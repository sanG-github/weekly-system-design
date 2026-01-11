import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { userId: Number }
  static targets = ["usersList", "userItem", "statusIndicator", "statusText"]

  connect() {
    try {
      this.consumer = createConsumer()
      this.subscription = this.consumer.subscriptions.create(
        { channel: "PresenceChannel" },
        {
          connected: () => {
            console.log("PresenceChannel connected")
          },
          disconnected: () => {
            console.log("PresenceChannel disconnected")
          },
          received: (data) => {
            console.log("PresenceChannel received:", data)
            this.handlePresenceUpdate(data)
          },
          rejected: () => {
            console.error("PresenceChannel subscription rejected")
          }
        }
      )
    } catch (error) {
      console.error("Error creating Action Cable subscription:", error)
    }
    
    // Set up heartbeat to keep connection alive and update last_seen_at
    this.heartbeatInterval = setInterval(() => {
      if (this.subscription) {
        this.subscription.perform("heartbeat")
      }
    }, 30000) // Every 30 seconds
    
    // Mark user as offline when page is being unloaded
    this.handleBeforeUnload = () => {
      this.markUserOffline()
    }
    window.addEventListener("beforeunload", this.handleBeforeUnload)
    
    // Also handle page visibility changes (tab switching, etc.)
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - could mark as away, but for now we'll keep online
        // The heartbeat will stop when the page unloads
      }
    }
    document.addEventListener("visibilitychange", this.handleVisibilityChange)
  }

  disconnect() {
    // Mark user as offline before disconnecting
    this.markUserOffline()
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    if (this.handleBeforeUnload) {
      window.removeEventListener("beforeunload", this.handleBeforeUnload)
    }
    
    if (this.handleVisibilityChange) {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange)
    }
    
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (this.consumer) {
      this.consumer.disconnect()
    }
  }
  
  markUserOffline() {
    // Send a quick request to mark user as offline
    // Use sendBeacon for reliability during page unload
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
    const formData = new FormData()
    formData.append("status", "offline")
    formData.append("authenticity_token", csrfToken)
    
    if (navigator.sendBeacon) {
      // sendBeacon doesn't support custom headers, so we'll use fetch with keepalive
      fetch("/users/update_status", {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": csrfToken
        },
        body: formData,
        keepalive: true
      }).catch(() => {}) // Ignore errors during unload
    } else {
      // Fallback for older browsers
      fetch("/users/update_status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken
        },
        body: new URLSearchParams({ status: "offline" }),
        keepalive: true
      }).catch(() => {}) // Ignore errors during unload
    }
  }

  handlePresenceUpdate(data) {
    if (data.type === "status_change" || data.type === "user_joined") {
      const user = data.user
      const userItem = this.userItemTargets.find(
        (item) => item.dataset.userId === user.id.toString()
      )

      if (userItem) {
        // Update existing user item
        this.updateUserItem(userItem, user)
      } else {
        // New user - add to list
        this.addNewUser(user)
      }

      // Show toast notification if it's not the current user
      if (user.id !== this.userIdValue) {
        const status = data.type === "user_joined" ? "joined" : (user.online ? "online" : "offline")
        this.dispatch("userStatusChanged", {
          detail: { user, status }
        })
      }
    }
  }

  updateUserItem(userItem, user) {
    userItem.dataset.online = user.online

    const statusIndicator = userItem.querySelector("[data-presence-target='statusIndicator']")
    const statusText = userItem.querySelector("[data-presence-target='statusText']")

    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${user.online ? "online" : "offline"}`
    }

    if (statusText) {
      statusText.textContent = user.online ? "Online" : "Offline"
    }
  }

  addNewUser(user) {
    // Create a new user item element
    const userItem = document.createElement("div")
    userItem.className = "user-item"
    userItem.dataset.presenceTarget = "userItem"
    userItem.dataset.userId = user.id
    userItem.dataset.online = user.online

    userItem.innerHTML = `
      <div class="user-avatar">
        <img src="${user.avatar}" alt="${user.name}" class="avatar-img">
        <span class="status-indicator ${user.online ? "online" : "offline"}" 
              data-presence-target="statusIndicator"></span>
      </div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-status" data-presence-target="statusText">
          ${user.online ? "Online" : "Offline"}
        </div>
      </div>
    `

    this.usersListTarget.appendChild(userItem)
  }
}

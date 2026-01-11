import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    // Listen for user status change events from presence controller
    document.addEventListener("userStatusChanged", this.handleStatusChange.bind(this))
  }

  disconnect() {
    document.removeEventListener("userStatusChanged", this.handleStatusChange.bind(this))
  }

  handleStatusChange(event) {
    const { user, status } = event.detail
    this.showToast(user, status)
  }

  showToast(user, status) {
    const toast = document.createElement("div")
    toast.className = `toast ${status === "offline" ? "offline" : "online"}`
    
    let message = ""
    if (status === "joined") {
      message = `${user.name} joined`
    } else if (status === "online") {
      message = `${user.name} is now online`
    } else {
      message = `${user.name} is now offline`
    }
    
    toast.textContent = message
    
    this.containerTarget.appendChild(toast)
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-out"
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}

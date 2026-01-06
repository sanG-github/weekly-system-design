import { Controller } from "@hotwired/stimulus"

/**
 * Infinite Scroll Controller with Cursor-Based Pagination
 * 
 * Implements Slack-like infinite scrolling using cursor-based pagination.
 * Loads older messages as user scrolls to the top of the container.
 * 
 * Features:
 * - Cursor-based pagination (clean, efficient)
 * - Automatic loading on scroll
 * - Comprehensive logging for debugging
 * - Error handling
 */
export default class extends Controller {
  static values = {
    channel: String,
    url: String
  }

  static targets = ["messages", "loading"]

  connect() {
    this.nextCursor = null
    this.isLoading = false
    this.hasMore = true
    // Find the messages container (parent of messages target)
    this.messagesContainer = this.messagesTarget.closest('.messages-container')

    this.log("Controller connected", { channel: this.channelValue, url: this.urlValue })

    // Load initial messages
    this.loadMessages().then(() => {
      // Scroll to bottom after initial load
      this.scrollToBottom()
    })

    // Set up scroll listener
    if (this.messagesContainer) {
      this.messagesContainer.addEventListener("scroll", this.handleScroll.bind(this))
    }
  }

  disconnect() {
    this.messagesContainer.removeEventListener("scroll", this.handleScroll.bind(this))
  }

  /**
   * Switch channel when clicking on channel item
   */
  switchChannel(event) {
    const channelName = event.currentTarget.dataset.channel
    
    if (channelName === this.channelValue) {
      return // Already on this channel
    }

    this.log("Channel switch", { from: this.channelValue, to: channelName })

    // Update active channel in sidebar
    document.querySelectorAll('.channel-item').forEach(item => {
      item.classList.remove('active')
    })
    event.currentTarget.classList.add('active')

    // Update channel header
    const channelHeader = document.querySelector('.channel-header h1')
    if (channelHeader) {
      channelHeader.textContent = `# ${channelName}`
    }

    // Reset state
    this.nextCursor = null
    this.hasMore = true
    this.isLoading = false
    
    // Clear existing messages
    this.messagesTarget.innerHTML = ''

    // Update channel value
    this.channelValue = channelName

    // Load messages for new channel
    this.loadMessages().then(() => {
      // Scroll to bottom after loading
      this.scrollToBottom()
    })
  }

  /**
   * Scroll to bottom of messages container
   */
  scrollToBottom() {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    })
  }

  /**
   * Handle scroll events to trigger loading more messages
   */
  handleScroll(event) {
    const container = event.target
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Load more when scrolled near the top (within 200px)
    if (scrollTop < 200 && this.hasMore && !this.isLoading) {
      this.log("Scroll threshold reached", { 
        scrollTop, 
        scrollHeight, 
        clientHeight,
        hasMore: this.hasMore,
        isLoading: this.isLoading
      })
      this.loadMessages()
    }
  }

  /**
   * Load messages using cursor-based pagination
   * 
   * Cursor-based pagination works by:
   * 1. Using a cursor (timestamp) to mark the position
   * 2. Requesting messages older than the cursor
   * 3. Using the oldest message's cursor as the next cursor
   */
  async loadMessages() {
    if (this.isLoading || !this.hasMore) {
      return Promise.resolve()
    }

    this.isLoading = true
    
    // Show loading immediately when request starts
    this.showLoading()

    const url = this.buildUrl()
    
    this.log("Request", {
      method: "GET",
      url: url,
      cursor: this.nextCursor || "null (first page)",
      channel: this.channelValue
    })

    try {
      // Add artificial delay to make loading animation more visible (for demo purposes)
      await new Promise(resolve => setTimeout(resolve, 800))

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      this.log("Response", {
        status: response.status,
        messageCount: data.messages.length,
        hasMore: data.pagination.has_more,
        nextCursor: data.pagination.next_cursor || "null",
        pagination: data.pagination
      })

      // Process messages
      if (data.messages && data.messages.length > 0) {
        this.appendMessages(data.messages)
        this.nextCursor = data.pagination.next_cursor
        this.hasMore = data.pagination.has_more

        this.log("Cursor update", {
          previousCursor: this.nextCursor || "null",
          newCursor: this.nextCursor || "null",
          hasMore: this.hasMore
        })
      } else {
        this.hasMore = false
        this.log("No more messages", { hasMore: false })
      }

    } catch (error) {
      this.log("Error", {
        message: error.message,
        stack: error.stack
      }, "error")
      console.error("Failed to load messages:", error)
    } finally {
      this.isLoading = false
      this.hideLoading()
    }
  }

  /**
   * Build the API URL with cursor parameter
   */
  buildUrl() {
    const url = new URL(this.urlValue, window.location.origin)
    url.searchParams.set("channel", this.channelValue)
    
    if (this.nextCursor) {
      url.searchParams.set("cursor", this.nextCursor)
    }

    return url.toString()
  }

  /**
   * Append messages to the container
   * - Initial load (no cursor): append messages in reverse order (newest at bottom)
   * - Pagination (with cursor): prepend messages (older at top)
   */
  appendMessages(messages) {
    const fragment = document.createDocumentFragment()
    const isInitialLoad = this.nextCursor === null

    // For initial load, reverse messages so newest appears at bottom
    // For pagination, keep order so oldest appears at top
    const messagesToRender = isInitialLoad ? [...messages].reverse() : messages

    messagesToRender.forEach((message, index) => {
      const messageElement = this.createMessageElement(message)
      // Add slight delay for staggered animation
      messageElement.style.animationDelay = `${index * 0.03}s`
      fragment.appendChild(messageElement)
    })

    if (isInitialLoad) {
      // Initial load: append messages (newest at bottom, like Slack)
      this.messagesTarget.appendChild(fragment)
    } else {
      // Pagination: prepend older messages (at top)
      this.messagesTarget.insertBefore(fragment, this.messagesTarget.firstChild)
    }

    this.log("Messages appended", {
      count: messages.length,
      isInitialLoad,
      messageIds: messages.map(m => m.id)
    })
  }

  /**
   * Generate avatar URL using UI Avatars service
   * Returns a consistent avatar for each author name
   */
  getAvatarUrl(authorName) {
    // Use UI Avatars service for consistent, recognizable avatars
    // Each author gets a unique color based on their name hash
    const encodedName = encodeURIComponent(authorName)
    // Generate a consistent color for each author
    const colors = ['667eea', '764ba2', 'f093fb', '4facfe', '00f2fe', '43e97b', 'fa709a', 'fee140', '30cfd0', '330867', 'a8edea', 'fed6e3']
    const colorIndex = authorName.charCodeAt(0) % colors.length
    const bgColor = colors[colorIndex]
    
    return `https://ui-avatars.com/api/?name=${encodedName}&size=80&background=${bgColor}&color=fff&bold=true&font-size=0.4`
  }

  /**
   * Create a message DOM element
   */
  createMessageElement(message) {
    const messageDiv = document.createElement("div")
    messageDiv.className = "message"
    messageDiv.dataset.messageId = message.id

    const avatar = document.createElement("img")
    avatar.className = "message-avatar"
    avatar.src = this.getAvatarUrl(message.author)
    avatar.alt = `${message.author}'s avatar`
    avatar.loading = "lazy"

    const content = document.createElement("div")
    content.className = "message-content"

    const header = document.createElement("div")
    header.className = "message-header"

    const author = document.createElement("span")
    author.className = "message-author"
    author.textContent = message.author

    const time = document.createElement("span")
    time.className = "message-time"
    time.textContent = this.formatTime(message.created_at)

    const text = document.createElement("div")
    text.className = "message-text"
    text.textContent = message.content

    header.appendChild(author)
    header.appendChild(time)
    content.appendChild(header)
    content.appendChild(text)
    messageDiv.appendChild(avatar)
    messageDiv.appendChild(content)

    return messageDiv
  }

  /**
   * Format timestamp for display
   */
  formatTime(isoString) {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  /**
   * Show loading indicator with animation
   */
  showLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.classList.add("visible")
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.classList.remove("visible")
    }
  }

  /**
   * Log messages to console (for debugging)
   */
  log(message, data = {}, type = "request") {
    // Log to console for debugging
    console.log(`[InfiniteScroll] ${message}`, data)
  }
}

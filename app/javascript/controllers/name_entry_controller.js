import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["nameInput", "avatarUrl", "form", "submitButton"]

  connect() {
    // Generate a random avatar URL when the page loads
    this.generateAvatar()
  }

  handleKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      this.formTarget.requestSubmit()
    }
  }

  generateAvatar() {
    // Generate a simple avatar URL - will be replaced by server if name is provided
    const randomColor = Math.floor(Math.random() * 16777215).toString(16)
    this.avatarUrlTarget.value = `https://ui-avatars.com/api/?name=User&background=${randomColor}&size=128`
  }
}

/**
 * Keyboard shortcuts functionality for Kefine Application
 */

export class KeyboardHandler {
  constructor() {
    this.initEventListeners();
  }

  private initEventListeners(): void {
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeydown(e));
  }

  private handleKeydown(e: KeyboardEvent): void {
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement?.tagName || "",
    );

    if (e.key === "Escape") {
      // Escape key handling will be delegated to the main app
      return;
    }

    if (isTyping) return;

    switch (e.key) {
      case "/":
        e.preventDefault();
        (document.querySelector("kf-combobox") as any)?.focus();
        break;
      case "b":
      case "B":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // This will be handled by the sidebar handler
        }
        break;
      case "ArrowDown":
      case "j":
        // This will be handled by the card handler
        break;
      case "ArrowUp":
      case "k":
        // This will be handled by the card handler
        break;
    }
  }

  // Expose API methods
  exposeAPI(_api: any): void {
    // No direct API methods for keyboard handler
  }
}
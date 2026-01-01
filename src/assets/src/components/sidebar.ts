import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("kf-sidebar")
export class KFSidebar extends LitElement {
  @property({ type: Boolean, reflect: true }) isOpen = false;

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      width: var(--sidebar-width, 250px);
      background: var(--sidebar-bg, #f8f9fa);
      border-right: 1px solid var(--border-color, #dee2e6);
      position: relative;
      overflow: hidden;
      transition:
        transform 0.3s ease,
        width 0.3s ease;
    }

    :host([open="false"]) {
      width: 0;
      transform: translateX(-100%);
    }

    .sidebar-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 1rem;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .close-btn:hover {
      background-color: var(--hover-bg, #e9ecef);
    }

    .search-container {
      margin-bottom: 1rem;
    }

    .nav-container {
      flex: 1;
      overflow-y: auto;
    }

    .nav-item {
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    .nav-item:hover {
      background-color: var(--hover-bg, #e9ecef);
    }

    .nav-item[active] {
      background-color: var(--active-bg, #0d6efd);
      color: white;
    }
  `;

  render() {
    return html`
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h2>Sidebar</h2>
          <button class="close-btn" @click="${this.handleCloseClick}">
            <kf-icon name="close"></kf-icon>
          </button>
        </div>

        <div class="search-container">
          <input
            id="sidebar-search"
            type="search"
            placeholder="Search..."
            @input="${this.handleSearchInput}"
          />
        </div>

        <div class="nav-container">
          <div
            class="nav-item"
            @click="${() => this.handleNavClick("dashboard")}"
          >
            <kf-icon name="home"></kf-icon>
            <span>Dashboard</span>
          </div>
          <div
            class="nav-item"
            @click="${() => this.handleNavClick("settings")}"
          >
            <kf-icon name="gear"></kf-icon>
            <span>Settings</span>
          </div>
          <div
            class="nav-item"
            @click="${() => this.handleNavClick("profile")}"
          >
            <kf-icon name="user"></kf-icon>
            <span>Profile</span>
          </div>
        </div>
      </div>
    `;
  }

  private handleCloseClick() {
    this.dispatchEvent(
      new CustomEvent("close", { bubbles: true, composed: true }),
    );
  }

  private handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("search", {
        detail: { query: target.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleNavClick(item: string) {
    // Remove active from all items
    this.querySelectorAll(".nav-item").forEach((navItem) => {
      navItem.removeAttribute("active");
    });

    // Set active on clicked item
    const clickedItem = event?.target as HTMLElement;
    const navItem = clickedItem?.closest(".nav-item");
    if (navItem) {
      navItem.setAttribute("active", "");
    }

    console.log("Navigate to:", item);
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-sidebar")) {
  customElements.define("kf-sidebar", KFSidebar);
}

export default KFSidebar;

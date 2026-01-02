import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kfSidebarStyles } from "./kf-sidebar.css.js";

@customElement("kf-sidebar")
export class KFSidebar extends LitElement {
  @property({ type: Boolean, reflect: true }) isOpen = false;

  static styles = kfSidebarStyles;

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

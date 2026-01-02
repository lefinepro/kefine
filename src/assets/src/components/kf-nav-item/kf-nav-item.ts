import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kfNavItemStyles } from "./kf-nav-item.css.js";

@customElement("kf-nav-item")
export class KFNavItem extends LitElement {
  @property({ type: Boolean, reflect: true }) active = false;

  static styles = kfNavItemStyles;

  render() {
    return html`
      <div
        class="nav-item"
        ?active="${this.active}"
        @click="${this.handleClick}"
      >
        <slot name="icon"></slot>
        <slot name="label"></slot>
      </div>
    `;
  }

  private handleClick() {
    // Remove active from all items in the same parent
    const parent = this.parentElement;
    if (parent) {
      const navItems = parent.querySelectorAll("kf-nav-item");
      navItems.forEach((item) => {
        (item as KFNavItem).active = false;
      });
    }

    // Set this item as active
    this.active = true;

    this.dispatchEvent(
      new CustomEvent("nav-select", {
        detail: { active: this.active },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-nav-item")) {
  customElements.define("kf-nav-item", KFNavItem);
}

export default KFNavItem;

import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { kfPostCloseStyles } from "./kf-post-close.css.js";

/**
 * kf-post-close - Close button for expanded posts
 *
 * @event close - Emitted when the close button is clicked
 *
 * @example
 * <kf-post-close></kf-post-close>
 */
@customElement("kf-post-close")
export class KfPostClose extends LitElement {
  static styles = kfPostCloseStyles;

  private handleClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button
        type="button"
        aria-label="Close post"
        @click=${this.handleClick}
      >
        <kf-icon name="close"></kf-icon>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-post-close": KfPostClose;
  }
}

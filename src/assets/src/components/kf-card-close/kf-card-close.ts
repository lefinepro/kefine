import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { kfCardCloseStyles } from "./kf-card-close.css.js";

/**
 * kf-card-close - Close button for expanded cards with back navigation
 *
 * @event close - Emitted when the close button is clicked
 *
 * @example
 * <kf-card-close></kf-card-close>
 */
@customElement("kf-card-close")
export class KfCardClose extends LitElement {
  static styles = kfCardCloseStyles;

  private handleClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleBackClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="card-nav">
        <button
          type="button"
          class="back-btn"
          aria-label="Back to feed"
          @click=${this.handleBackClick}
        >
          <kf-icon name="arrow-left"></kf-icon>
          <span>Back</span>
        </button>
        <button
          type="button"
          class="close-btn"
          aria-label="Close card"
          @click=${this.handleClick}
        >
          <kf-icon name="close"></kf-icon>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-card-close": KfCardClose;
  }
}

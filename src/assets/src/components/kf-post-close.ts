import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

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
  static styles = css`
    :host {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 10;
      display: none;
    }

    :host([visible]) {
      display: block;
    }

    button {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    button:hover {
      opacity: 0.8;
    }

    button:focus-visible {
      outline: 2px solid var(--kf-focus-ring-color, #3b82f6);
      outline-offset: 2px;
    }
  `;

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

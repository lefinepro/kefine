import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kfOverlayStyles } from "./kf-overlay.css.js";

/**
 * kf-overlay - Modal overlay component
 *
 * @property {boolean} visible - Whether the overlay is visible
 *
 * @example
 * <kf-overlay></kf-overlay>
 * <kf-overlay visible></kf-overlay>
 */
@customElement("kf-overlay")
export class KfOverlay extends LitElement {
  static styles = kfOverlayStyles;

  @property({ type: Boolean, reflect: true }) visible = false;

  render() {
    return html`<div class="overlay"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-overlay": KfOverlay;
  }
}

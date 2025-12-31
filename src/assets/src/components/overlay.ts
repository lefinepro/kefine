import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kt-overlay')
export class KTOverlay extends LitElement {
  @property({ type: Boolean, reflect: true }) visible = false;

  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s ease;
    }

    :host([visible="true"]) {
      opacity: 1;
      visibility: visible;
    }
  `;

  render() {
    return html`
      <div class="overlay"></div>
    `;
  }
}

// Define the custom element if not already defined
if (!customElements.get('kt-overlay')) {
  customElements.define('kt-overlay', KTOverlay);
}

export default KTOverlay;
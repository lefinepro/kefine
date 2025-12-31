import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kt-counter')
export class KTCounter extends LitElement {
  @property({ type: Number }) current = 0;
  @property({ type: Number }) total = 0;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
    }

    .counter-current {
      font-weight: bold;
      min-width: 20px;
      text-align: right;
    }

    .counter-divider {
      color: var(--text-secondary, #6c757d);
    }

    .counter-total {
      color: var(--text-secondary, #6c757d);
      min-width: 20px;
      text-align: left;
    }
  `;

  render() {
    return html`
      <span class="counter-current">${this.current}</span>
      <span class="counter-divider">/</span>
      <span class="counter-total">${this.total}</span>
    `;
  }
}

// Define the custom element if not already defined
if (!customElements.get('kt-counter')) {
  customElements.define('kt-counter', KTCounter);
}

export default KTCounter;
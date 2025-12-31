import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kt-filter-option')
export class KTFilterOption extends LitElement {
  @property({ type: Boolean, reflect: true }) selected = false;

  static styles = css`
    :host {
      display: block;
    }

    .filter-option {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .filter-option:hover {
      background-color: var(--hover-bg, #e9ecef);
    }

    .filter-option[selected] {
      background-color: var(--selected-bg, #e7f1ff);
    }

    .filter-checkbox {
      margin-right: 0.5rem;
    }
  `;

  render() {
    return html`
      <div 
        class="filter-option" 
        ?selected="${this.selected}"
        @click="${this.toggleSelection}"
      >
        <span class="filter-checkbox">
          <slot name="checkbox"></slot>
        </span>
        <span class="filter-label">
          <slot name="label"></slot>
        </span>
      </div>
    `;
  }

  private toggleSelection() {
    this.selected = !this.selected;
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { selected: this.selected },
      bubbles: true,
      composed: true
    }));
  }
}

// Define the custom element if not already defined
if (!customElements.get('kt-filter-option')) {
  customElements.define('kt-filter-option', KTFilterOption);
}

export default KTFilterOption;
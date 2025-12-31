import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kt-setting-item')
export class KTSettingItem extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color, #dee2e6);
    }

    :host(:last-child) {
      border-bottom: none;
    }

    .setting-content {
      flex: 1;
    }

    .setting-label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .setting-title {
      font-weight: 500;
      color: var(--text-primary, #212529);
    }

    .setting-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #6c757d);
    }

    .setting-control {
      flex-shrink: 0;
      margin-left: 1rem;
    }
  `;

  render() {
    return html`
      <div class="setting-content">
        <div class="setting-label">
          <span class="setting-title"><slot name="label">${this.label}</slot></span>
          <span class="setting-description"><slot name="description">${this.description}</slot></span>
        </div>
      </div>
      <div class="setting-control">
        <slot name="control"></slot>
      </div>
    `;
  }
}

// Define the custom element if not already defined
if (!customElements.get('kt-setting-item')) {
  customElements.define('kt-setting-item', KTSettingItem);
}

export default KTSettingItem;
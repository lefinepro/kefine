import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kfSettingItemStyles } from "./kf-setting-item.css.js";

@customElement("kf-setting-item")
export class KFSettingItem extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) description = "";

  static styles = kfSettingItemStyles;

  render() {
    return html`
      <div class="setting-content">
        <div class="setting-label">
          <span class="setting-title"
            ><slot name="label">${this.label}</slot></span
          >
          <span class="setting-description"
            ><slot name="description">${this.description}</slot></span
          >
        </div>
      </div>
      <div class="setting-control">
        <slot name="control"></slot>
      </div>
    `;
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-setting-item")) {
  customElements.define("kf-setting-item", KFSettingItem);
}

export default KFSettingItem;

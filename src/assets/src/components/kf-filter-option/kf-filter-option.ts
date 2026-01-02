import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { kfFilterOptionStyles } from "./kf-filter-option.css.js";

@customElement("kf-filter-option")
export class KFFilterOption extends LitElement {
  @property({ type: Boolean, reflect: true }) selected = false;

  static styles = kfFilterOptionStyles;

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
    this.dispatchEvent(
      new CustomEvent("toggle", {
        detail: { selected: this.selected },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-filter-option")) {
  customElements.define("kf-filter-option", KFFilterOption);
}

export default KFFilterOption;

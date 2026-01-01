import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { kfSwitchStyles } from "./kf-switch.css.js";

/**
 * kf-switch - Toggle switch component
 *
 * Based on WebAwesome switch component patterns
 *
 * @property {string} name - The name of the switch, submitted as a name/value pair with form data
 * @property {string} value - The value of the switch, submitted as a name/value pair with form data
 * @property {boolean} checked - Whether the switch is checked
 * @property {boolean} disabled - Disables the switch
 * @property {boolean} required - Makes the switch a required field
 * @property {string} size - The switch's size: small, medium, large
 *
 * @slot - The switch's label
 *
 * @event change - Emitted when the control's checked state changes
 * @event input - Emitted when the control receives input
 * @event blur - Emitted when the control loses focus
 * @event focus - Emitted when the control gains focus
 *
 * @csspart base - The component's base wrapper
 * @csspart control - The control that houses the switch's thumb
 * @csspart thumb - The switch's thumb
 * @csspart label - The switch's label
 *
 * @cssproperty --width - The width of the switch
 * @cssproperty --height - The height of the switch
 * @cssproperty --thumb-size - The size of the thumb
 *
 * @example
 * <kf-switch>Enable notifications</kf-switch>
 * <kf-switch checked>Dark mode</kf-switch>
 * <kf-switch disabled>Disabled option</kf-switch>
 */
@customElement("kf-switch")
export class KfSwitch extends LitElement {
  static styles = kfSwitchStyles;

  @query('input[type="checkbox"]') input!: HTMLInputElement;

  /** The name of the switch, submitted as a name/value pair with form data. */
  @property({ reflect: true }) name: string | null = null;

  /** The value of the switch, submitted as a name/value pair with form data. */
  @property({ reflect: true }) value: string = "on";

  /** The switch's size. */
  @property({ reflect: true }) size: "small" | "medium" | "large" = "medium";

  /** Disables the switch. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Draws the switch in a checked state. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Makes the switch a required field. */
  @property({ type: Boolean, reflect: true }) required = false;

  private handleClick() {
    if (this.disabled) return;

    this.checked = !this.checked;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (this.checked) {
        this.checked = false;
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      }
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!this.checked) {
        this.checked = true;
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      }
    }
  }

  /** Simulates a click on the switch. */
  click() {
    this.input.click();
  }

  /** Sets focus on the switch. */
  focus(options?: FocusOptions) {
    this.input.focus(options);
  }

  /** Removes focus from the switch. */
  blur() {
    this.input.blur();
  }

  render() {
    return html`
      <label
        part="base"
        class=${classMap({
          checked: this.checked,
          disabled: this.disabled,
        })}
      >
        <input
          class="input"
          type="checkbox"
          name=${this.name ?? ""}
          value=${this.value}
          .checked=${live(this.checked)}
          .disabled=${this.disabled}
          .required=${this.required}
          role="switch"
          aria-checked=${this.checked ? "true" : "false"}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
          @blur=${() => this.dispatchEvent(new Event("blur", { bubbles: true, composed: true }))}
          @focus=${() => this.dispatchEvent(new Event("focus", { bubbles: true, composed: true }))}
        />

        <span part="control" class="switch">
          <span part="thumb" class="thumb"></span>
        </span>

        <slot part="label" class="label"></slot>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-switch": KfSwitch;
  }
}

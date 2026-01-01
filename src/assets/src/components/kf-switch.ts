import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";

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
  static styles = css`
    :host {
      --width: 2.25rem;
      --height: 1.25rem;
      --thumb-size: 0.875rem;

      display: inline-flex;
      line-height: 1.5;
    }

    :host([size="small"]) {
      --width: 1.75rem;
      --height: 1rem;
      --thumb-size: 0.625rem;
      font-size: 0.875rem;
    }

    :host([size="large"]) {
      --width: 2.75rem;
      --height: 1.5rem;
      --thumb-size: 1.125rem;
      font-size: 1.125rem;
    }

    label {
      position: relative;
      display: inline-flex;
      align-items: center;
      font: inherit;
      color: inherit;
      vertical-align: middle;
      cursor: pointer;
      gap: 0.5rem;
    }

    label.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .switch {
      flex: 0 0 auto;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--width);
      height: var(--height);
      background-color: var(--kf-switch-background, #d1d5db);
      border: 1px solid var(--kf-switch-border-color, #9ca3af);
      border-radius: 0;
      transition: background-color 150ms ease, border-color 150ms ease;
    }

    .switch .thumb {
      position: absolute;
      left: 2px;
      width: var(--thumb-size);
      height: var(--thumb-size);
      background-color: var(--kf-switch-thumb-color, #6b7280);
      border-radius: 0;
      transition: transform 150ms ease, background-color 150ms ease;
    }

    .input {
      position: absolute;
      opacity: 0;
      padding: 0;
      margin: 0;
      pointer-events: none;
    }

    /* Focus */
    label:not(.disabled) .input:focus-visible ~ .switch .thumb {
      outline: 2px solid var(--kf-focus-ring-color, #3b82f6);
      outline-offset: 2px;
    }

    /* Checked */
    .checked .switch {
      background-color: var(--kf-switch-checked-background, #3b82f6);
      border-color: var(--kf-switch-checked-border-color, #2563eb);
    }

    .checked .switch .thumb {
      background-color: var(--kf-switch-checked-thumb-color, #ffffff);
      transform: translateX(calc(var(--width) - var(--thumb-size) - 4px));
    }

    /* Hover */
    label:not(.disabled):hover .switch {
      border-color: var(--kf-switch-hover-border-color, #6b7280);
    }

    .checked:hover .switch {
      border-color: var(--kf-switch-checked-hover-border-color, #1d4ed8);
    }

    [part~="label"] {
      display: inline-block;
      line-height: var(--height);
      user-select: none;
      -webkit-user-select: none;
    }

    :host([required]) [part~="label"]::after {
      content: " *";
      color: #ef4444;
    }

    @media (prefers-reduced-motion: reduce) {
      .switch,
      .switch .thumb {
        transition: none;
      }
    }
  `;

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

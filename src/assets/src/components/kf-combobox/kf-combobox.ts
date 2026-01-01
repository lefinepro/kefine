import { LitElement, html } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { kfComboboxStyles } from "./kf-combobox.css.js";

export interface ComboboxOption {
  id: string;
  label: string;
  type?: string;
  url?: string;
  icon?: string;
}

@customElement("kf-combobox")
export class KFCombobox extends LitElement {
  static styles = kfComboboxStyles;

  @property({ type: String }) placeholder = "Search...";
  @property({ type: String }) value = "";
  @property({ type: Array }) options: ComboboxOption[] = [];
  @property({ type: Boolean }) loading = false;
  @property({ type: Number, attribute: "min-chars" }) minChars = 2;

  @state() private isOpen = false;
  @state() private selectedIndex = -1;
  @state() private internalValue = "";

  @query(".combobox-input") private inputEl!: HTMLInputElement;

  // Mock search results for demonstration
  private mockResults: ComboboxOption[] = [
    { id: "1", label: "Components", type: "page", url: "/components" },
    { id: "2", label: "Documentation", type: "page", url: "/docs" },
    { id: "3", label: "Examples", type: "page", url: "/examples" },
    { id: "4", label: "Settings", type: "page", url: "/settings" },
    {
      id: "5",
      label: "Button Component",
      type: "component",
      url: "/components/button",
    },
    {
      id: "6",
      label: "Card Component",
      type: "component",
      url: "/components/card",
    },
    {
      id: "7",
      label: "Badge Component",
      type: "component",
      url: "/components/badge",
    },
  ];

  render() {
    const filteredOptions =
      this.options.length > 0 ? this.options : this.getFilteredResults();

    return html`
      <div class="combobox-wrapper">
        <span class="combobox-icon">
          <slot name="icon">
            <kf-icon name="search"></kf-icon>
          </slot>
        </span>

        <input
          class="combobox-input"
          type="text"
          role="combobox"
          aria-expanded="${this.isOpen}"
          aria-haspopup="listbox"
          aria-controls="combobox-listbox"
          aria-autocomplete="list"
          aria-activedescendant="${this.selectedIndex >= 0
            ? `option-${filteredOptions[this.selectedIndex]?.id}`
            : ""}"
          placeholder="${this.placeholder}"
          .value="${this.internalValue}"
          @input="${this.handleInput}"
          @keydown="${this.handleKeydown}"
          @focus="${this.handleFocus}"
          @blur="${this.handleBlur}"
        />

        ${this.internalValue
          ? html`
              <button
                class="combobox-clear"
                ?visible="${this.internalValue.length > 0}"
                @mousedown="${this.handleClear}"
                aria-label="Clear search"
              >
                <kf-icon name="close"></kf-icon>
              </button>
            `
          : null}

        <div
          id="combobox-listbox"
          class="combobox-listbox"
          role="listbox"
          ?hidden="${!this.isOpen}"
        >
          ${this.loading
            ? html`<div class="combobox-loading">Loading...</div>`
            : filteredOptions.length > 0
              ? filteredOptions.map(
                  (option, index) => html`
                    <div
                      id="option-${option.id}"
                      class="combobox-option"
                      role="option"
                      aria-selected="${index === this.selectedIndex}"
                      @mousedown="${() => this.selectOption(option)}"
                      @mouseenter="${() => (this.selectedIndex = index)}"
                    >
                      <span class="combobox-option-icon">
                        <kf-icon
                          name="${option.type === "page"
                            ? "document"
                            : "grid"}"
                        ></kf-icon>
                      </span>
                      <span class="combobox-option-label">${option.label}</span>
                      ${option.type
                        ? html`<span class="combobox-option-type"
                            >${option.type}</span
                          >`
                        : null}
                    </div>
                  `,
                )
              : this.internalValue.length >= this.minChars
                ? html`<div class="combobox-empty">No results found</div>`
                : null}
        </div>
      </div>
    `;
  }

  private getFilteredResults(): ComboboxOption[] {
    if (this.internalValue.length < this.minChars) {
      return [];
    }

    const query = this.internalValue.toLowerCase();
    return this.mockResults
      .filter((r) => r.label.toLowerCase().includes(query))
      .slice(0, 5);
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.internalValue = target.value;
    this.selectedIndex = -1;

    if (this.internalValue.length >= this.minChars) {
      this.isOpen = true;
    } else {
      this.isOpen = false;
    }

    this.dispatchEvent(
      new CustomEvent("kf-combobox-input", {
        detail: { value: this.internalValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleKeydown(e: KeyboardEvent) {
    const filteredOptions =
      this.options.length > 0 ? this.options : this.getFilteredResults();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this.isOpen && filteredOptions.length > 0) {
          this.isOpen = true;
          this.selectedIndex = 0;
        } else if (this.selectedIndex < filteredOptions.length - 1) {
          this.selectedIndex++;
        }
        this.scrollSelectedIntoView();
        break;

      case "ArrowUp":
        e.preventDefault();
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
        }
        this.scrollSelectedIntoView();
        break;

      case "Enter":
        e.preventDefault();
        if (this.isOpen && this.selectedIndex >= 0) {
          this.selectOption(filteredOptions[this.selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        this.isOpen = false;
        this.selectedIndex = -1;
        this.inputEl?.blur();
        break;

      case "Tab":
        this.isOpen = false;
        break;
    }
  }

  private handleFocus() {
    const filteredOptions = this.getFilteredResults();
    if (
      this.internalValue.length >= this.minChars &&
      filteredOptions.length > 0
    ) {
      this.isOpen = true;
    }
  }

  private handleBlur() {
    // Delay to allow click events on options
    setTimeout(() => {
      this.isOpen = false;
    }, 150);
  }

  private handleClear(e: Event) {
    e.preventDefault();
    this.internalValue = "";
    this.isOpen = false;
    this.selectedIndex = -1;

    this.dispatchEvent(
      new CustomEvent("kf-combobox-clear", {
        bubbles: true,
        composed: true,
      }),
    );

    // Re-focus input after clearing
    requestAnimationFrame(() => {
      this.inputEl?.focus();
    });
  }

  private selectOption(option: ComboboxOption) {
    this.internalValue = option.label;
    this.isOpen = false;
    this.selectedIndex = -1;

    this.dispatchEvent(
      new CustomEvent("kf-combobox-select", {
        detail: option,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private scrollSelectedIntoView() {
    requestAnimationFrame(() => {
      const listbox = this.shadowRoot?.querySelector(".combobox-listbox");
      const selectedOption = this.shadowRoot?.querySelector(
        '.combobox-option[aria-selected="true"]',
      );
      if (listbox && selectedOption) {
        selectedOption.scrollIntoView({ block: "nearest" });
      }
    });
  }

  // Public method to focus the input
  public focus() {
    this.inputEl?.focus();
  }

  // Public method to clear the input
  public clear() {
    this.internalValue = "";
    this.isOpen = false;
    this.selectedIndex = -1;
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-combobox")) {
  customElements.define("kf-combobox", KFCombobox);
}

export default KFCombobox;

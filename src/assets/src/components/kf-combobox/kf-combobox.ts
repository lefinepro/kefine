import { LitElement, html, nothing, TemplateResult } from "lit";
import { customElement, property, state, query, queryAssignedElements } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";
import { kfComboboxStyles } from "./kf-combobox.css.js";

export interface ComboboxOption {
  id: string;
  label: string;
  value?: string;
  type?: string;
  url?: string;
  icon?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export type SearchMode = "pattern" | "startswith" | "includes";

export interface BeforeFilterEvent {
  value: string;
  options: ComboboxOption[];
  preventDefault: () => void;
  setOptions: (options: ComboboxOption[]) => void;
}

export interface ComboboxSelectEvent {
  option: ComboboxOption;
  value: string;
}

export interface ComboboxChangeEvent {
  value: string;
  selectedOptions: ComboboxOption[];
}

/**
 * kf-combobox - Enhanced combobox component following Open UI standards
 *
 * Features:
 * - Input + datalist association via slots
 * - Multiple filtering modes: pattern, startswith, includes
 * - beforefilter event for custom/async filtering
 * - Full ARIA compliance and keyboard navigation
 * - Virtualization support for large option sets
 * - Text highlighting for matched characters
 * - Multiple selection support
 * - Extensive theming via CSS custom properties
 *
 * @property {string} placeholder - Input placeholder text
 * @property {string} value - Current value of the combobox
 * @property {ComboboxOption[]} options - Array of options to display
 * @property {boolean} loading - Show loading state
 * @property {number} minChars - Minimum characters before showing options
 * @property {SearchMode} search - Filtering mode: pattern, startswith, includes
 * @property {boolean} multiple - Enable multiple selection
 * @property {boolean} highlightMatches - Highlight matched text in options
 * @property {boolean} virtualize - Enable virtualization for large lists
 * @property {number} virtualizeThreshold - Number of items to trigger virtualization
 * @property {string} label - Accessible label for the combobox
 * @property {boolean} disabled - Disable the combobox
 *
 * @event kf-combobox-input - Fired when input value changes
 * @event kf-combobox-beforefilter - Fired before filtering (cancelable)
 * @event kf-combobox-filter - Fired after filtering
 * @event kf-combobox-select - Fired when an option is selected
 * @event kf-combobox-change - Fired when value changes
 * @event kf-combobox-clear - Fired when input is cleared
 * @event kf-combobox-open - Fired when listbox opens
 * @event kf-combobox-close - Fired when listbox closes
 */
@customElement("kf-combobox")
export class KFCombobox extends LitElement {
  static styles = kfComboboxStyles;

  // Public properties
  @property({ type: String }) placeholder = "Search...";
  @property({ type: String }) value = "";
  @property({ type: Array }) options: ComboboxOption[] = [];
  @property({ type: Boolean }) loading = false;
  @property({ type: Number, attribute: "min-chars" }) minChars = 0;
  @property({ type: String }) search: SearchMode = "includes";
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean, attribute: "highlight-matches" }) highlightMatches = false;
  @property({ type: Boolean }) virtualize = false;
  @property({ type: Number, attribute: "virtualize-threshold" }) virtualizeThreshold = 100;
  @property({ type: String }) label = "";
  @property({ type: Boolean }) disabled = false;

  // Internal state
  @state() private isOpen = false;
  @state() private selectedIndex = -1;
  @state() private internalValue = "";
  @state() private filteredOptions: ComboboxOption[] = [];
  @state() private selectedOptions: ComboboxOption[] = [];
  @state() private virtualStartIndex = 0;
  @state() private virtualEndIndex = 50;

  // Element queries
  @query(".combobox-input") private inputEl!: HTMLInputElement;
  @query(".combobox-listbox") private listboxEl!: HTMLElement;
  @queryAssignedElements({ slot: "options" }) private slottedOptions!: HTMLElement[];

  // Private fields
  private customFilterApplied = false;
  private readonly VIRTUAL_ITEM_HEIGHT = 40; // px
  private readonly VIRTUAL_VISIBLE_ITEMS = 10;

  // Mock search results for demonstration
  private mockResults: ComboboxOption[] = [
    { id: "1", label: "Components", value: "components", type: "page", url: "/components" },
    { id: "2", label: "Documentation", value: "documentation", type: "page", url: "/docs" },
    { id: "3", label: "Examples", value: "examples", type: "page", url: "/examples" },
    { id: "4", label: "Settings", value: "settings", type: "page", url: "/settings" },
    {
      id: "5",
      label: "Button Component",
      value: "button",
      type: "component",
      url: "/components/button",
    },
    {
      id: "6",
      label: "Card Component",
      value: "card",
      type: "component",
      url: "/components/card",
    },
    {
      id: "7",
      label: "Badge Component",
      value: "badge",
      type: "component",
      url: "/components/badge",
    },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.internalValue = this.value;
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("value") && this.value !== this.internalValue) {
      this.internalValue = this.value;
    }
    if (changedProperties.has("options")) {
      this.applyFiltering();
    }
  }

  render() {
    const displayOptions =
      this.filteredOptions.length > 0 ? this.filteredOptions : this.getFilteredResults();

    const shouldVirtualize = this.virtualize && displayOptions.length > this.virtualizeThreshold;
    const visibleOptions = shouldVirtualize
      ? displayOptions.slice(this.virtualStartIndex, this.virtualEndIndex)
      : displayOptions;

    const ariaLabel = this.label || this.placeholder || "Combobox";

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
          aria-label="${ariaLabel}"
          aria-expanded="${this.isOpen}"
          aria-haspopup="listbox"
          aria-controls="combobox-listbox"
          aria-autocomplete="list"
          aria-activedescendant="${
            this.selectedIndex >= 0 && displayOptions[this.selectedIndex]
              ? `option-${displayOptions[this.selectedIndex].id}`
              : ""
          }"
          aria-disabled="${this.disabled}"
          placeholder="${this.placeholder}"
          .value="${this.internalValue}"
          ?disabled="${this.disabled}"
          @input="${this.handleInput}"
          @keydown="${this.handleKeydown}"
          @focus="${this.handleFocus}"
          @blur="${this.handleBlur}"
        />

        ${
          this.internalValue && !this.disabled
            ? html`
              <button
                class="combobox-clear"
                @mousedown="${this.handleClear}"
                aria-label="Clear search"
                tabindex="-1"
              >
                <kf-icon name="close"></kf-icon>
              </button>
            `
            : nothing
        }

        ${
          this.multiple && this.selectedOptions.length > 0
            ? html`
              <div class="combobox-selected-chips">
                ${this.selectedOptions.map(
                  (opt) => html`
                    <span class="combobox-chip">
                      ${opt.label}
                      <button
                        class="combobox-chip-remove"
                        @click="${() => this.removeSelectedOption(opt)}"
                        aria-label="Remove ${opt.label}"
                        tabindex="-1"
                      >
                        <kf-icon name="close"></kf-icon>
                      </button>
                    </span>
                  `,
                )}
              </div>
            `
            : nothing
        }

        <div
          id="combobox-listbox"
          class="combobox-listbox"
          role="listbox"
          aria-label="${ariaLabel} options"
          aria-multiselectable="${this.multiple}"
          ?hidden="${!this.isOpen}"
          @scroll="${shouldVirtualize ? this.handleScroll : nothing}"
        >
          ${
            this.loading
              ? html`<div class="combobox-loading">
                <slot name="loading">Loading...</slot>
              </div>`
              : displayOptions.length > 0
                ? html`
                  ${
                    shouldVirtualize
                      ? html`<div style="height: ${this.virtualStartIndex * this.VIRTUAL_ITEM_HEIGHT}px;"></div>`
                      : nothing
                  }
                  ${repeat(
                    visibleOptions,
                    (option) => option.id,
                    (option, index) => {
                      const actualIndex = shouldVirtualize ? this.virtualStartIndex + index : index;
                      const isSelected = this.multiple
                        ? this.selectedOptions.some((opt) => opt.id === option.id)
                        : actualIndex === this.selectedIndex;
                      const isFocused = actualIndex === this.selectedIndex;

                      return html`
                        <div
                          id="option-${option.id}"
                          class="${classMap({
                            "combobox-option": true,
                            "combobox-option--focused": isFocused,
                            "combobox-option--selected": isSelected,
                            "combobox-option--disabled": option.disabled || false,
                          })}"
                          role="option"
                          aria-selected="${isSelected}"
                          aria-disabled="${option.disabled || false}"
                          @mousedown="${() => !option.disabled && this.selectOption(option, actualIndex)}"
                          @mouseenter="${() => !option.disabled && (this.selectedIndex = actualIndex)}"
                        >
                          ${this.renderOption(option)}
                        </div>
                      `;
                    },
                  )}
                  ${
                    shouldVirtualize
                      ? html`<div style="height: ${(displayOptions.length - this.virtualEndIndex) * this.VIRTUAL_ITEM_HEIGHT}px;"></div>`
                      : nothing
                  }
                `
                : this.internalValue.length >= this.minChars
                  ? html`<div class="combobox-empty">
                    <slot name="empty">No results found</slot>
                  </div>`
                  : html`<div class="combobox-empty">
                    <slot name="prompt">Type to search...</slot>
                  </div>`
          }
        </div>

        <slot name="options" @slotchange="${this.handleSlotChange}"></slot>
      </div>
    `;
  }

  private renderOption(option: ComboboxOption): TemplateResult {
    const labelText = option.label;
    const highlightedLabel =
      this.highlightMatches && this.internalValue
        ? this.highlightText(labelText, this.internalValue)
        : html`${labelText}`;

    return html`
      <span class="combobox-option-icon">
        ${
          option.icon
            ? html`<kf-icon name="${option.icon}"></kf-icon>`
            : option.type === "page"
              ? html`<kf-icon name="document"></kf-icon>`
              : option.type === "component"
                ? html`<kf-icon name="grid"></kf-icon>`
                : nothing
        }
      </span>
      <span class="combobox-option-label">${highlightedLabel}</span>
      ${option.type ? html`<span class="combobox-option-type">${option.type}</span>` : nothing}
    `;
  }

  private highlightText(text: string, query: string): TemplateResult {
    if (!query) return html`${text}`;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi");
    const parts = text.split(regex);

    return html`${parts.map((part) =>
      regex.test(part) ? html`<mark class="combobox-highlight">${part}</mark>` : html`${part}`,
    )}`;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private getFilteredResults(): ComboboxOption[] {
    if (this.customFilterApplied) {
      return this.filteredOptions;
    }

    if (this.internalValue.length < this.minChars) {
      return this.options.length > 0 ? this.options : [];
    }

    const sourceOptions = this.options.length > 0 ? this.options : this.mockResults;
    return this.filterOptions(sourceOptions, this.internalValue);
  }

  private filterOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
    if (!query) return options;

    const lowerQuery = query.toLowerCase();

    return options.filter((option) => {
      if (option.disabled) return false;

      const label = option.label.toLowerCase();
      const value = (option.value || "").toLowerCase();

      switch (this.search) {
        case "startswith":
          return label.startsWith(lowerQuery) || value.startsWith(lowerQuery);

        case "pattern":
          try {
            const regex = new RegExp(query, "i");
            return regex.test(option.label) || regex.test(option.value || "");
          } catch {
            // Invalid regex, fall back to includes
            return label.includes(lowerQuery) || value.includes(lowerQuery);
          }

        case "includes":
        default:
          return label.includes(lowerQuery) || value.includes(lowerQuery);
      }
    });
  }

  private applyFiltering() {
    if (!this.customFilterApplied) {
      this.filteredOptions = this.filterOptions(this.options, this.internalValue);
    }
  }

  private async handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.internalValue = target.value;
    this.selectedIndex = -1;
    this.customFilterApplied = false;

    // Dispatch input event
    this.dispatchEvent(
      new CustomEvent("kf-combobox-input", {
        detail: { value: this.internalValue },
        bubbles: true,
        composed: true,
      }),
    );

    // Dispatch beforefilter event (allows custom filtering)
    const sourceOptions = this.options.length > 0 ? this.options : this.mockResults;
    let prevented = false;
    let customOptions: ComboboxOption[] | null = null;

    const beforeFilterEvent = new CustomEvent("kf-combobox-beforefilter", {
      detail: {
        value: this.internalValue,
        options: [...sourceOptions],
        preventDefault: () => {
          prevented = true;
        },
        setOptions: (opts: ComboboxOption[]) => {
          customOptions = opts;
        },
      },
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    this.dispatchEvent(beforeFilterEvent);

    if (prevented || customOptions) {
      this.customFilterApplied = true;
      if (customOptions) {
        this.filteredOptions = customOptions;
      }
    } else {
      this.customFilterApplied = false;
      this.applyFiltering();
    }

    // Open/close listbox based on input length
    const shouldOpen = this.internalValue.length >= this.minChars || this.options.length > 0;
    if (shouldOpen && !this.isOpen) {
      this.openListbox();
    } else if (!shouldOpen && this.isOpen) {
      this.closeListbox();
    }

    // Dispatch filter event
    this.dispatchEvent(
      new CustomEvent("kf-combobox-filter", {
        detail: {
          value: this.internalValue,
          filteredOptions: this.filteredOptions,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.disabled) return;

    const displayOptions =
      this.filteredOptions.length > 0 ? this.filteredOptions : this.getFilteredResults();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this.isOpen && displayOptions.length > 0) {
          this.openListbox();
          this.selectedIndex = 0;
        } else if (this.selectedIndex < displayOptions.length - 1) {
          this.selectedIndex++;
          // Skip disabled options
          while (
            this.selectedIndex < displayOptions.length - 1 &&
            displayOptions[this.selectedIndex]?.disabled
          ) {
            this.selectedIndex++;
          }
        }
        this.scrollSelectedIntoView();
        break;

      case "ArrowUp":
        e.preventDefault();
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          // Skip disabled options
          while (this.selectedIndex > 0 && displayOptions[this.selectedIndex]?.disabled) {
            this.selectedIndex--;
          }
        }
        this.scrollSelectedIntoView();
        break;

      case "Home":
        e.preventDefault();
        if (this.isOpen && displayOptions.length > 0) {
          this.selectedIndex = 0;
          // Skip disabled options at the start
          while (
            this.selectedIndex < displayOptions.length - 1 &&
            displayOptions[this.selectedIndex]?.disabled
          ) {
            this.selectedIndex++;
          }
          this.scrollSelectedIntoView();
        }
        break;

      case "End":
        e.preventDefault();
        if (this.isOpen && displayOptions.length > 0) {
          this.selectedIndex = displayOptions.length - 1;
          // Skip disabled options at the end
          while (this.selectedIndex > 0 && displayOptions[this.selectedIndex]?.disabled) {
            this.selectedIndex--;
          }
          this.scrollSelectedIntoView();
        }
        break;

      case "Enter":
        e.preventDefault();
        if (
          this.isOpen &&
          this.selectedIndex >= 0 &&
          displayOptions[this.selectedIndex] &&
          !displayOptions[this.selectedIndex].disabled
        ) {
          this.selectOption(displayOptions[this.selectedIndex], this.selectedIndex);
        }
        break;

      case "Escape":
        e.preventDefault();
        if (this.isOpen) {
          this.closeListbox();
          this.selectedIndex = -1;
        } else {
          // Clear input if listbox is already closed
          this.internalValue = "";
          this.value = "";
        }
        break;

      case "Tab":
        if (this.isOpen) {
          this.closeListbox();
        }
        break;
    }
  }

  private handleFocus() {
    if (this.disabled) return;

    const displayOptions =
      this.filteredOptions.length > 0 ? this.filteredOptions : this.getFilteredResults();

    if (
      displayOptions.length > 0 &&
      (this.internalValue.length >= this.minChars || this.options.length > 0)
    ) {
      this.openListbox();
    }
  }

  private handleBlur() {
    // Delay to allow click events on options
    setTimeout(() => {
      if (this.isOpen) {
        this.closeListbox();
      }
    }, 150);
  }

  private handleClear(e: Event) {
    e.preventDefault();
    if (this.disabled) return;

    this.internalValue = "";
    this.value = "";
    this.closeListbox();
    this.selectedIndex = -1;
    this.selectedOptions = [];
    this.customFilterApplied = false;
    this.filteredOptions = [];

    this.dispatchEvent(
      new CustomEvent("kf-combobox-clear", {
        bubbles: true,
        composed: true,
      }),
    );

    this.dispatchChangeEvent();

    // Re-focus input after clearing
    requestAnimationFrame(() => {
      this.inputEl?.focus();
    });
  }

  private selectOption(option: ComboboxOption, index: number) {
    if (option.disabled) return;

    if (this.multiple) {
      // Toggle selection in multiple mode
      const existingIndex = this.selectedOptions.findIndex((opt) => opt.id === option.id);
      if (existingIndex >= 0) {
        this.selectedOptions = this.selectedOptions.filter((opt) => opt.id !== option.id);
      } else {
        this.selectedOptions = [...this.selectedOptions, option];
      }
      this.internalValue = "";
      this.selectedIndex = index;
    } else {
      // Single selection mode
      this.internalValue = option.label;
      this.value = option.value || option.label;
      this.selectedOptions = [option];
      this.closeListbox();
      this.selectedIndex = -1;
    }

    // Dispatch select event
    this.dispatchEvent(
      new CustomEvent("kf-combobox-select", {
        detail: {
          option,
          value: option.value || option.label,
        } as ComboboxSelectEvent,
        bubbles: true,
        composed: true,
      }),
    );

    this.dispatchChangeEvent();
  }

  private removeSelectedOption(option: ComboboxOption) {
    this.selectedOptions = this.selectedOptions.filter((opt) => opt.id !== option.id);
    this.dispatchChangeEvent();
  }

  private openListbox() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.dispatchEvent(
      new CustomEvent("kf-combobox-open", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private closeListbox() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.dispatchEvent(
      new CustomEvent("kf-combobox-close", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private dispatchChangeEvent() {
    const value = this.multiple
      ? this.selectedOptions.map((opt) => opt.value || opt.label).join(",")
      : this.selectedOptions[0]?.value || this.selectedOptions[0]?.label || this.value;

    this.value = value;

    this.dispatchEvent(
      new CustomEvent("kf-combobox-change", {
        detail: {
          value,
          selectedOptions: [...this.selectedOptions],
        } as ComboboxChangeEvent,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleScroll(e: Event) {
    if (!this.virtualize) return;

    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const newStartIndex = Math.floor(scrollTop / this.VIRTUAL_ITEM_HEIGHT);

    this.virtualStartIndex = Math.max(0, newStartIndex);
    this.virtualEndIndex = Math.min(
      this.filteredOptions.length,
      this.virtualStartIndex + this.VIRTUAL_VISIBLE_ITEMS * 2,
    );
  }

  private handleSlotChange() {
    // Handle datalist slot changes for future enhancement
    // This allows integration with <datalist> elements
    if (this.slottedOptions && this.slottedOptions.length > 0) {
      // Parse options from slotted datalist
      const parsedOptions: ComboboxOption[] = [];
      this.slottedOptions.forEach((el) => {
        if (el.tagName === "DATALIST") {
          const options = el.querySelectorAll("option");
          options.forEach((opt, index) => {
            parsedOptions.push({
              id: opt.value || `option-${index}`,
              label: opt.textContent || opt.value || "",
              value: opt.value,
            });
          });
        }
      });

      if (parsedOptions.length > 0 && this.options.length === 0) {
        this.options = parsedOptions;
      }
    }
  }

  private scrollSelectedIntoView() {
    requestAnimationFrame(() => {
      const listbox = this.shadowRoot?.querySelector(".combobox-listbox");
      if (!listbox) return;

      const selectedOption =
        this.shadowRoot?.querySelector(".combobox-option--focused") ||
        this.shadowRoot?.querySelector('.combobox-option[aria-selected="true"]');

      if (selectedOption) {
        selectedOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  // Public API methods

  /**
   * Focus the combobox input
   */
  public focus() {
    this.inputEl?.focus();
  }

  /**
   * Blur the combobox input
   */
  public blur() {
    this.inputEl?.blur();
  }

  /**
   * Clear the combobox value and selection
   */
  public clear() {
    this.internalValue = "";
    this.value = "";
    this.selectedOptions = [];
    this.customFilterApplied = false;
    this.filteredOptions = [];
    this.closeListbox();
    this.selectedIndex = -1;
    this.dispatchChangeEvent();
  }

  /**
   * Open the listbox
   */
  public open() {
    this.openListbox();
  }

  /**
   * Close the listbox
   */
  public close() {
    this.closeListbox();
  }

  /**
   * Set custom filtered options (bypasses built-in filtering)
   */
  public setFilteredOptions(options: ComboboxOption[]) {
    this.customFilterApplied = true;
    this.filteredOptions = options;
    this.requestUpdate();
  }

  /**
   * Get currently selected options
   */
  public getSelectedOptions(): ComboboxOption[] {
    return [...this.selectedOptions];
  }

  /**
   * Set selected options programmatically
   */
  public setSelectedOptions(options: ComboboxOption[]) {
    this.selectedOptions = options;
    if (!this.multiple && options.length > 0) {
      this.internalValue = options[0].label;
      this.value = options[0].value || options[0].label;
    }
    this.dispatchChangeEvent();
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-combobox")) {
  customElements.define("kf-combobox", KFCombobox);
}

export default KFCombobox;

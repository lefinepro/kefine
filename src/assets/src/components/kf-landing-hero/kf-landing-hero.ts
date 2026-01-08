import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { kfLandingHeroStyles } from "./kf-landing-hero.css.js";
import type { ComboboxOption, ComboboxSelectEvent } from "../kf-combobox/kf-combobox.js";

export interface UseCase {
  id: string;
  label: string;
  value: string;
  icon?: string;
  title: string;
  description: string;
  learnMoreUrl: string;
}

export interface UseCaseSelectEvent {
  useCase: UseCase;
  useCaseId: string;
}

/**
 * kf-landing-hero - Landing page hero section with centered combobox
 *
 * Features:
 * - Full viewport height hero section
 * - Centered combobox for use-case selection
 * - Slogan display
 * - Error handling with fallback UI
 * - Analytics tracking
 * - i18n ready
 *
 * @property {string} slogan - The hero slogan text
 * @property {string} placeholder - Combobox placeholder text
 * @property {UseCase[]} useCases - Array of use-case options
 * @property {string} dataUrl - URL to fetch use-cases JSON (optional)
 * @property {string} locale - Current locale for i18n
 * @property {boolean} enableAnalytics - Enable analytics tracking
 *
 * @event kf-landing-select - Fired when a use-case is selected
 */
@customElement("kf-landing-hero")
export class KFLandingHero extends LitElement {
  static styles = kfLandingHeroStyles;

  @property({ type: String }) slogan = "Deadline's on fire — but the fix is already in hand.";
  @property({ type: String }) placeholder = "Select a use-case";
  @property({ type: Array }) useCases: UseCase[] = [];
  @property({ type: String, attribute: "data-url" }) dataUrl = "";
  @property({ type: String }) locale = "en";
  @property({ type: Boolean, attribute: "enable-analytics" }) enableAnalytics = true;

  @state() private loading = false;
  @state() private error: string | null = null;
  @state() private loadedUseCases: UseCase[] = [];

  // Fallback use-cases in case JSON fails to load
  private fallbackUseCases: UseCase[] = [
    { id: "analytics", label: "Analytics", value: "analytics", title: "Analytics Dashboard", description: "Track and visualize your key metrics.", learnMoreUrl: "/use-cases/analytics" },
    { id: "reporting", label: "Reporting", value: "reporting", title: "Automated Reporting", description: "Generate detailed reports automatically.", learnMoreUrl: "/use-cases/reporting" },
    { id: "automation", label: "Automation", value: "automation", title: "Workflow Automation", description: "Streamline repetitive tasks.", learnMoreUrl: "/use-cases/automation" },
    { id: "integration", label: "Integration", value: "integration", title: "Seamless Integration", description: "Connect with your favorite tools.", learnMoreUrl: "/use-cases/integration" },
    { id: "custom", label: "Custom", value: "custom", title: "Custom Solutions", description: "Build tailored solutions.", learnMoreUrl: "/use-cases/custom" },
  ];

  connectedCallback() {
    super.connectedCallback();
    if (this.dataUrl) {
      this.fetchUseCases();
    } else if (this.useCases.length === 0) {
      this.loadedUseCases = this.fallbackUseCases;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("useCases") && this.useCases.length > 0) {
      this.loadedUseCases = this.useCases;
    }
    if (changedProperties.has("dataUrl") && this.dataUrl) {
      this.fetchUseCases();
    }
  }

  private async fetchUseCases() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.useCases && Array.isArray(data.useCases)) {
        this.loadedUseCases = data.useCases;
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err) {
      console.error("Failed to load use-cases:", err);
      this.error = "Failed to load use-cases. Please try again.";
      this.loadedUseCases = this.fallbackUseCases;

      // Log error to Sentry if available
      this.logErrorToSentry(err);
    } finally {
      this.loading = false;
    }
  }

  private logErrorToSentry(error: unknown) {
    // Sentry integration placeholder
    if (typeof (window as any).Sentry !== "undefined") {
      (window as any).Sentry.captureException(error);
    }
  }

  private getComboboxOptions(): ComboboxOption[] {
    return this.loadedUseCases.map((uc) => ({
      id: uc.id,
      label: uc.label,
      value: uc.value,
      icon: uc.icon,
    }));
  }

  private handleComboboxSelect(e: CustomEvent<ComboboxSelectEvent>) {
    const selectedOption = e.detail.option;
    const useCase = this.loadedUseCases.find((uc) => uc.id === selectedOption.id);

    if (useCase) {
      // Track analytics
      if (this.enableAnalytics) {
        this.trackUseCaseSelection(useCase);
      }

      // Dispatch custom event
      this.dispatchEvent(
        new CustomEvent("kf-landing-select", {
          detail: {
            useCase,
            useCaseId: useCase.id,
          } as UseCaseSelectEvent,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private trackUseCaseSelection(useCase: UseCase) {
    // Google Analytics / Matomo tracking
    const eventData = {
      event: "comboboxChange",
      useCaseId: useCase.id,
      useCaseLabel: useCase.label,
    };

    // Google Analytics 4
    if (typeof (window as any).gtag !== "undefined") {
      (window as any).gtag("event", "comboboxChange", {
        use_case_id: useCase.id,
        use_case_label: useCase.label,
      });
    }

    // Matomo/Piwik
    if (typeof (window as any)._paq !== "undefined") {
      (window as any)._paq.push(["trackEvent", "Landing", "comboboxChange", useCase.id]);
    }

    // Custom analytics event
    window.dispatchEvent(
      new CustomEvent("kf-analytics", {
        detail: eventData,
      })
    );

    console.log("Analytics tracked:", eventData);
  }

  private handleFallbackSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    const useCase = this.loadedUseCases.find((uc) => uc.id === target.value);

    if (useCase) {
      if (this.enableAnalytics) {
        this.trackUseCaseSelection(useCase);
      }

      this.dispatchEvent(
        new CustomEvent("kf-landing-select", {
          detail: {
            useCase,
            useCaseId: useCase.id,
          } as UseCaseSelectEvent,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private handleRetry() {
    this.error = null;
    if (this.dataUrl) {
      this.fetchUseCases();
    }
  }

  render() {
    const options = this.getComboboxOptions();
    const showFallback = this.error !== null;

    return html`
      <section class="hero-section" role="banner" aria-label="Landing hero">
        <div class="hero-content">
          <h1 class="hero-slogan">${this.slogan}</h1>

          <div class="hero-combobox-wrapper">
            ${this.loading
              ? html`<div aria-live="polite" aria-busy="true">Loading...</div>`
              : showFallback
                ? this.renderFallbackSelect()
                : this.renderCombobox(options)
            }
          </div>

          ${this.error
            ? html`
              <div class="hero-error" role="alert">
                <span class="hero-error-message">${this.error}</span>
                <button @click="${this.handleRetry}" aria-label="Retry loading use-cases">
                  Retry
                </button>
              </div>
            `
            : nothing
          }
        </div>
      </section>
    `;
  }

  private renderCombobox(options: ComboboxOption[]) {
    return html`
      <kf-combobox
        placeholder="${this.placeholder}"
        .options="${options}"
        min-chars="0"
        label="Select a use-case"
        @kf-combobox-select="${this.handleComboboxSelect}"
        aria-label="Use-case selection"
      >
        <slot name="icon" slot="icon"></slot>
      </kf-combobox>
    `;
  }

  private renderFallbackSelect() {
    return html`
      <div class="fallback-list">
        <select
          @change="${this.handleFallbackSelect}"
          aria-label="Select a use-case"
        >
          <option value="" disabled selected>${this.placeholder}</option>
          ${this.loadedUseCases.map(
            (uc) => html`<option value="${uc.id}">${uc.label}</option>`
          )}
        </select>
      </div>
    `;
  }

  // Public API methods

  /**
   * Set use-cases programmatically
   */
  public setUseCases(useCases: UseCase[]) {
    this.loadedUseCases = useCases;
    this.error = null;
  }

  /**
   * Reload use-cases from URL
   */
  public reload() {
    if (this.dataUrl) {
      this.fetchUseCases();
    }
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-landing-hero")) {
  customElements.define("kf-landing-hero", KFLandingHero);
}

export default KFLandingHero;

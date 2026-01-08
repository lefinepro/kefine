import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { kfUseCaseSectionStyles } from "./kf-use-case-section.css.js";

export interface UseCase {
  id: string;
  label: string;
  value: string;
  icon?: string;
  title: string;
  description: string;
  learnMoreUrl: string;
}

/**
 * kf-use-case-section - Scroll-triggered use-case carousel section
 *
 * Features:
 * - Scroll-triggered visibility
 * - Responsive carousel/grid layout
 * - Auto-rotation on desktop
 * - Swipe support on mobile
 * - Lazy loading of assets
 * - Full accessibility support
 *
 * @property {UseCase[]} useCases - Array of use-case data
 * @property {string} title - Section title
 * @property {string} learnMoreText - Text for learn more links
 * @property {boolean} visible - Whether the section is visible
 * @property {boolean} autoRotate - Enable auto-rotation on desktop
 * @property {number} autoRotateInterval - Auto-rotation interval in ms
 *
 * @event kf-use-case-click - Fired when a use-case card is clicked
 */
@customElement("kf-use-case-section")
export class KFUseCaseSection extends LitElement {
  static styles = kfUseCaseSectionStyles;

  @property({ type: Array }) useCases: UseCase[] = [];
  @property({ type: String }) title = "Use-Cases";
  @property({ type: String, attribute: "learn-more-text" }) learnMoreText = "Learn More";
  @property({ type: Boolean, reflect: true }) visible = false;
  @property({ type: Boolean, attribute: "auto-rotate" }) autoRotate = true;
  @property({ type: Number, attribute: "auto-rotate-interval" }) autoRotateInterval = 5000;

  @state() private currentPage = 0;
  @state() private touchStartX = 0;
  @state() private touchEndX = 0;
  @state() private loading = false;
  @state() private error: string | null = null;

  private autoRotateTimer: number | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.setupIntersectionObserver();
    this.setupResizeObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRotate();
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.visible = true;
            if (this.autoRotate) {
              this.startAutoRotate();
            }
          } else {
            // Don't hide once visible (per requirements: appears after scroll past hero)
            // Only stop auto-rotation when not visible
            this.stopAutoRotate();
          }
        });
      },
      { threshold: 0.1 }
    );

    this.intersectionObserver.observe(this);
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      // Reset to first page on resize to handle layout changes
      this.currentPage = 0;
    });

    this.resizeObserver.observe(this);
  }

  private startAutoRotate() {
    if (this.autoRotateTimer || !this.autoRotate) return;

    this.autoRotateTimer = window.setInterval(() => {
      this.nextPage();
    }, this.autoRotateInterval);
  }

  private stopAutoRotate() {
    if (this.autoRotateTimer) {
      window.clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
  }

  private getColumnsCount(): number {
    const width = window.innerWidth;
    if (width >= 1200) return 3;
    if (width >= 768) return 2;
    return 1;
  }

  private getTotalPages(): number {
    const columns = this.getColumnsCount();
    return Math.ceil(this.useCases.length / columns);
  }

  private nextPage() {
    const totalPages = this.getTotalPages();
    this.currentPage = (this.currentPage + 1) % totalPages;
  }

  private prevPage() {
    const totalPages = this.getTotalPages();
    this.currentPage = (this.currentPage - 1 + totalPages) % totalPages;
  }

  private goToPage(page: number) {
    this.currentPage = page;
    // Reset auto-rotate timer on manual navigation
    this.stopAutoRotate();
    if (this.autoRotate) {
      this.startAutoRotate();
    }
  }

  // Touch event handlers for mobile swipe
  private handleTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
    this.stopAutoRotate();
  }

  private handleTouchMove(e: TouchEvent) {
    this.touchEndX = e.touches[0].clientX;
  }

  private handleTouchEnd() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    }

    this.touchStartX = 0;
    this.touchEndX = 0;

    // Restart auto-rotate after swipe
    if (this.autoRotate) {
      this.startAutoRotate();
    }
  }

  private handleCardClick(useCase: UseCase) {
    this.dispatchEvent(
      new CustomEvent("kf-use-case-click", {
        detail: {
          useCase,
          useCaseId: useCase.id,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCardKeydown(e: KeyboardEvent, useCase: UseCase) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleCardClick(useCase);
    }
  }

  render() {
    if (this.loading) {
      return html`
        <section class="use-case-section" aria-label="${this.title}">
          <div class="loading-state" aria-live="polite" aria-busy="true">
            Loading...
          </div>
        </section>
      `;
    }

    if (this.error) {
      return html`
        <section class="use-case-section" aria-label="${this.title}">
          <div class="error-state" role="alert">
            <span>${this.error}</span>
          </div>
        </section>
      `;
    }

    const totalPages = this.getTotalPages();
    // Note: We render all cards in a CSS grid layout, pagination is visual only via CSS
    // The responsive CSS handles showing 1/2/3 columns based on viewport

    return html`
      <section
        class="use-case-section"
        aria-label="${this.title}"
        @touchstart="${this.handleTouchStart}"
        @touchmove="${this.handleTouchMove}"
        @touchend="${this.handleTouchEnd}"
      >
        <header class="section-header">
          <h2 class="section-title">${this.title}</h2>
        </header>

        <div class="carousel-container">
          <div class="carousel-track" role="list" aria-label="Use-case cards">
            ${this.useCases.map((useCase) => this.renderCard(useCase))}
          </div>

          ${totalPages > 1
            ? html`
              <div class="carousel-arrows">
                <button
                  class="carousel-arrow"
                  @click="${this.prevPage}"
                  aria-label="Previous page"
                  ?disabled="${this.currentPage === 0}"
                >
                  <kf-icon name="arrow-left"></kf-icon>
                </button>
                <button
                  class="carousel-arrow"
                  @click="${this.nextPage}"
                  aria-label="Next page"
                  ?disabled="${this.currentPage === totalPages - 1}"
                >
                  <kf-icon name="arrow-right"></kf-icon>
                </button>
              </div>
            `
            : nothing
          }
        </div>

        ${totalPages > 1
          ? html`
            <nav class="carousel-nav" aria-label="Carousel pagination">
              ${Array.from({ length: totalPages }, (_, i) => html`
                <button
                  class="carousel-dot"
                  @click="${() => this.goToPage(i)}"
                  aria-label="Go to page ${i + 1}"
                  aria-selected="${this.currentPage === i}"
                ></button>
              `)}
            </nav>
            <div class="swipe-indicator" aria-hidden="true">
              Swipe to see more
            </div>
          `
          : nothing
        }
      </section>
    `;
  }

  private renderCard(useCase: UseCase) {
    return html`
      <article
        class="use-case-card"
        role="listitem"
        tabindex="0"
        @click="${() => this.handleCardClick(useCase)}"
        @keydown="${(e: KeyboardEvent) => this.handleCardKeydown(e, useCase)}"
        aria-label="${useCase.title}"
      >
        <div class="card-icon" aria-hidden="true">
          <kf-icon name="${useCase.icon || 'document'}"></kf-icon>
        </div>
        <h3 class="card-title">${useCase.title}</h3>
        <p class="card-description">${useCase.description}</p>
        <a
          class="card-link"
          href="${useCase.learnMoreUrl}"
          @click="${(e: Event) => e.stopPropagation()}"
          aria-label="${this.learnMoreText} about ${useCase.title}"
        >
          ${this.learnMoreText}
          <kf-icon name="arrow-right"></kf-icon>
        </a>
      </article>
    `;
  }

  // Public API methods

  /**
   * Show the section (triggered by scroll)
   */
  public show() {
    this.visible = true;
    if (this.autoRotate) {
      this.startAutoRotate();
    }
  }

  /**
   * Hide the section
   */
  public hide() {
    this.visible = false;
    this.stopAutoRotate();
  }

  /**
   * Go to next carousel page
   */
  public next() {
    this.nextPage();
  }

  /**
   * Go to previous carousel page
   */
  public prev() {
    this.prevPage();
  }

  /**
   * Set use-cases programmatically
   */
  public setUseCases(useCases: UseCase[]) {
    this.useCases = useCases;
    this.currentPage = 0;
  }
}

// Define the custom element if not already defined
if (!customElements.get("kf-use-case-section")) {
  customElements.define("kf-use-case-section", KFUseCaseSection);
}

export default KFUseCaseSection;

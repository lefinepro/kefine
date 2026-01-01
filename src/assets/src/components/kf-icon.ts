import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Error symbols for caching
const CACHEABLE_ERROR = Symbol();
const RETRYABLE_ERROR = Symbol();
type SVGResult = SVGSVGElement | typeof RETRYABLE_ERROR | typeof CACHEABLE_ERROR;

// Global icon cache - stores promises to avoid duplicate fetches
const iconCache = new Map<string, Promise<SVGResult>>();

// DOMParser instance (reused)
let parser: DOMParser;

/**
 * kf-icon - Local SVG icon component
 * Uses Carbon Design System icons stored locally
 *
 * Based on WebAwesome icon component patterns
 *
 * @property {string} name - Name of the icon (without .svg extension)
 * @property {string} size - Size of the icon: sm, md, lg, xl, 2xl, 3xl (default: md)
 * @property {string} label - Accessibility label for the icon
 * @property {string} src - External URL for custom SVG icon
 *
 * @event kf-load - Emitted when the icon has loaded successfully
 * @event kf-error - Emitted when the icon fails to load
 *
 * @csspart svg - The internal SVG element
 *
 * @example
 * <kf-icon name="close"></kf-icon>
 * <kf-icon name="search" size="lg"></kf-icon>
 * <kf-icon name="user" label="User profile"></kf-icon>
 */
@customElement("kf-icon")
export class KfIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      line-height: 1;
      color: inherit;
      contain: strict;
      box-sizing: content-box !important;
    }

    :host([size="sm"]) {
      font-size: 0.875rem;
    }

    :host([size="md"]) {
      font-size: 1rem;
    }

    :host([size="lg"]) {
      font-size: 1.25rem;
    }

    :host([size="xl"]) {
      font-size: 1.5rem;
    }

    :host([size="2xl"]) {
      font-size: 2rem;
    }

    :host([size="3xl"]) {
      font-size: 3rem;
    }

    svg {
      display: block;
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  `;

  @state() private svg: SVGSVGElement | null = null;

  /** The name of the icon to draw. */
  @property({ reflect: true }) name?: string;

  /** Size of the icon. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" = "md";

  /**
   * An alternate description to use for assistive devices.
   * If omitted, the icon will be considered presentational and ignored by assistive devices.
   */
  @property() label = "";

  /** An external URL of an SVG file. */
  @property() src?: string;

  connectedCallback() {
    super.connectedCallback();
    this.handleLabelChange();
  }

  firstUpdated() {
    this.setIcon();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("label")) {
      this.handleLabelChange();
    }

    if (changedProperties.has("name") || changedProperties.has("src")) {
      this.setIcon();
    }
  }

  private handleLabelChange() {
    const hasLabel = typeof this.label === "string" && this.label.length > 0;

    if (hasLabel) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }

  private getIconUrl(): string | undefined {
    if (this.src) {
      return this.src;
    }
    if (this.name) {
      return `/dist/icons/${this.name}.svg`;
    }
    return undefined;
  }

  /** Given a URL, this function returns the resulting SVG element or an appropriate error symbol. */
  private async resolveIcon(url: string): Promise<SVGResult> {
    let fileData: Response;

    try {
      fileData = await fetch(url, { mode: "cors" });
      if (!fileData.ok) {
        return fileData.status === 410 ? CACHEABLE_ERROR : RETRYABLE_ERROR;
      }
    } catch {
      return RETRYABLE_ERROR;
    }

    try {
      const text = await fileData.text();

      if (!parser) {
        parser = new DOMParser();
      }

      const doc = parser.parseFromString(text, "text/html");
      const svgEl = doc.body.querySelector("svg");

      if (!svgEl) {
        return CACHEABLE_ERROR;
      }

      // Clean up the SVG for proper sizing
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");

      if (!svgEl.hasAttribute("viewBox")) {
        svgEl.setAttribute("viewBox", "0 0 16 16");
      }

      svgEl.part.add("svg");

      return document.adoptNode(svgEl) as SVGSVGElement;
    } catch {
      return CACHEABLE_ERROR;
    }
  }

  private async setIcon() {
    const url = this.getIconUrl();

    if (!url) {
      this.svg = null;
      return;
    }

    let iconResolver = iconCache.get(url);

    if (!iconResolver) {
      iconResolver = this.resolveIcon(url);
      iconCache.set(url, iconResolver);
    }

    const svg = await iconResolver;

    // Handle errors
    if (svg === RETRYABLE_ERROR) {
      iconCache.delete(url);
      this.svg = null;
      this.dispatchEvent(new CustomEvent("kf-error", { bubbles: true, composed: true }));
      return;
    }

    if (svg === CACHEABLE_ERROR) {
      this.svg = null;
      this.dispatchEvent(new CustomEvent("kf-error", { bubbles: true, composed: true }));
      return;
    }

    // Clone the cached SVG so each instance gets its own copy
    this.svg = svg.cloneNode(true) as SVGSVGElement;
    this.dispatchEvent(new CustomEvent("kf-load", { bubbles: true, composed: true }));
  }

  render() {
    return html`${this.svg}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-icon": KfIcon;
  }
}

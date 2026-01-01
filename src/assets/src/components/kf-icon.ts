import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

// Import all icons as raw SVG strings
const icons: Record<string, string> = {};

// Load icons dynamically from the icons directory
// Icons will be inlined during build
async function loadIcon(name: string): Promise<string> {
  try {
    const response = await fetch(`/dist/icons/${name}.svg`);
    if (!response.ok) {
      console.warn(`Icon "${name}" not found`);
      return "";
    }
    return await response.text();
  } catch {
    console.warn(`Failed to load icon "${name}"`);
    return "";
  }
}

/**
 * kf-icon - Local SVG icon component
 * Uses Carbon Design System icons stored locally
 *
 * @property {string} name - Name of the icon (without .svg extension)
 * @property {string} size - Size of the icon: sm, md, lg (default: md)
 *
 * @example
 * <kf-icon name="close"></kf-icon>
 * <kf-icon name="search" size="lg"></kf-icon>
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
      width: 1em;
      height: 1em;
      fill: currentColor;
    }

    svg path,
    svg g {
      fill: currentColor;
    }
  `;

  @property({ type: String })
  name = "";

  @property({ type: String })
  size = "md";

  private _iconContent = "";
  private _loadedName = "";

  async connectedCallback() {
    super.connectedCallback();
    await this._loadIcon();
  }

  async updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("name") && this.name !== this._loadedName) {
      await this._loadIcon();
    }
  }

  private async _loadIcon() {
    if (!this.name) return;

    // Check cache first
    if (icons[this.name]) {
      this._iconContent = icons[this.name];
      this._loadedName = this.name;
      this.requestUpdate();
      return;
    }

    // Load icon
    const svg = await loadIcon(this.name);
    if (svg) {
      icons[this.name] = svg;
      this._iconContent = svg;
      this._loadedName = this.name;
      this.requestUpdate();
    }
  }

  render() {
    if (!this._iconContent) {
      return html``;
    }

    // Parse SVG and inject into shadow DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(this._iconContent, "image/svg+xml");
    const svg = doc.querySelector("svg");

    if (svg) {
      // Remove width/height attributes to let CSS control size
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      // Ensure viewBox is present
      if (!svg.hasAttribute("viewBox")) {
        svg.setAttribute("viewBox", "0 0 16 16");
      }
      return html`${new DOMParser().parseFromString(svg.outerHTML, "text/html").body.firstChild}`;
    }

    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kf-icon": KfIcon;
  }
}

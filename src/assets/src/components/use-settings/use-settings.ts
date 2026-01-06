/**
 * Settings functionality for Kefine Application
 */

export class SettingsHandler {
  constructor() {
    this.loadSettings();
    this.initEventListeners();
  }

  private loadSettings(): void {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Default to light theme
      document.documentElement.setAttribute("data-theme", "light");
    }

    const savedAnimations = localStorage.getItem("animations");
    if (savedAnimations === "false") {
      document.documentElement.classList.add("reduce-motion");
    }
  }

  private initEventListeners(): void {
    // Settings switches
    document.querySelectorAll("kf-switch").forEach((toggle) => {
      toggle.addEventListener("change", (e) => this.handleSettingChange(e));
    });
  }

  private handleSettingChange(e: Event): void {
    const target = e.target as HTMLElement & { checked: boolean; id: string };
    localStorage.setItem(target.id, String(target.checked));

    switch (target.id) {
      case "dark-mode-toggle":
        document.documentElement.setAttribute("data-theme", target.checked ? "dark" : "light");
        localStorage.setItem("theme", target.checked ? "dark" : "light");
        break;
      case "animations-toggle":
        document.documentElement.classList.toggle("reduce-motion", !target.checked);
        localStorage.setItem("animations", String(target.checked));
        break;
    }
  }

  // Expose API methods
  exposeAPI(_api: any): void {
    // No direct API methods for settings handler
  }
}

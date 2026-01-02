/**
 * Sidebar functionality for Kefine Application
 */

interface AppState {
  sidebarOpen: boolean;
}

export class SidebarHandler {
  public state: AppState = {
    sidebarOpen: false,
  };

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners(): void {
    // Sidebar toggle
    document
      .getElementById("logo-toggle")
      ?.addEventListener("click", () => this.toggleSidebar());
    document
      .getElementById("sidebar-close")
      ?.addEventListener("click", () => this.closeSidebar());

    // Overlay click closes sidebar
    document.addEventListener("click", (e) => {
      if ((e.target as HTMLElement)?.tagName === "KF-OVERLAY") {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar(): void {
    if (this.state.sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar(): void {
    this.state.sidebarOpen = true;
    document.getElementById("sidebar")?.setAttribute("open", "");
    document.querySelector("kf-app")?.setAttribute("sidebar-open", "");
    document.querySelector("kf-overlay")?.setAttribute("visible", "");
  }

  closeSidebar(): void {
    this.state.sidebarOpen = false;
    document.getElementById("sidebar")?.removeAttribute("open");
    document.querySelector("kf-app")?.removeAttribute("sidebar-open");
    document.querySelector("kf-overlay")?.removeAttribute("visible");
  }

  // Expose API methods
  exposeAPI(api: any): void {
    api.toggleSidebar = () => this.toggleSidebar();
    api.openSidebar = () => this.openSidebar();
    api.closeSidebar = () => this.closeSidebar();
  }
}
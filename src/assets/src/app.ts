// Import Lit components for interactive elements
// All icons are local Carbon Design System SVGs
import "./components/kf-icon/kf-icon.js";
import "./components/kf-switch/kf-switch.js";
import "./components/kf-post-close/kf-post-close.js";
import "./components/kf-overlay/kf-overlay.js";
import "./components/kf-combobox/kf-combobox.js";

/**
 * Kefine Application
 * Handles sidebar toggle, keyboard shortcuts, and settings
 * Interactive elements are Lit components, static templates remain as ECR
 */

interface AppState {
  sidebarOpen: boolean;
  expandedPostId: string | null;
}

class KefineApp {
  private state: AppState = {
    sidebarOpen: false,
    expandedPostId: null,
  };

  constructor() {
    this.loadSettings();
    this.initEventListeners();
    this.exposeAPI();
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
    // Sidebar toggle
    document.getElementById("logo-toggle")?.addEventListener("click", () => this.toggleSidebar());
    document.getElementById("sidebar-close")?.addEventListener("click", () => this.closeSidebar());

    // Overlay click closes sidebar
    document.addEventListener("click", (e) => {
      if ((e.target as HTMLElement)?.tagName === "KF-OVERLAY") {
        this.closeSidebar();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeydown(e));

    // Settings switches
    document.querySelectorAll("kf-switch").forEach((toggle) => {
      toggle.addEventListener("change", (e) => this.handleSettingChange(e));
    });

    // Posts
    document.querySelectorAll("kf-post").forEach((post) => {
      post.addEventListener("click", (e) => this.handlePostClick(e, post));
      post.querySelector("kf-post-close")?.addEventListener("close", () => this.collapsePost());
    });

    // Combobox select
    document.addEventListener("kf-combobox-select", (e) => {
      console.log("Search selected:", (e as CustomEvent).detail);
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

  private handlePostClick(e: Event, post: Element): void {
    const target = e.target as HTMLElement;
    if (target.closest("kf-post-action") || target.closest("button") || target.closest("kf-post-close")) {
      return;
    }
    const postId = post.getAttribute("data-post-id");
    if (postId && !post.hasAttribute("expanded")) {
      this.expandPost(postId);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "");

    if (e.key === "Escape") {
      if (this.state.expandedPostId) {
        this.collapsePost();
        e.preventDefault();
      } else if (this.state.sidebarOpen) {
        this.closeSidebar();
        e.preventDefault();
      }
      return;
    }

    if (isTyping) return;

    switch (e.key) {
      case "/":
        e.preventDefault();
        (document.querySelector("kf-combobox") as any)?.focus();
        break;
      case "b":
      case "B":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleSidebar();
        }
        break;
    }
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

  expandPost(postId: string): void {
    if (this.state.expandedPostId) this.collapsePost();

    const post = document.querySelector(`kf-post[data-post-id="${postId}"]`);
    if (!post) return;

    this.state.expandedPostId = postId;
    post.setAttribute("expanded", "");
    post.querySelector("kf-post-close")?.setAttribute("visible", "");
    document.body.style.overflow = "hidden";
  }

  collapsePost(): void {
    if (!this.state.expandedPostId) return;

    const post = document.querySelector(`kf-post[data-post-id="${this.state.expandedPostId}"]`);
    post?.removeAttribute("expanded");
    post?.querySelector("kf-post-close")?.removeAttribute("visible");
    document.body.style.overflow = "";
    this.state.expandedPostId = null;
  }

  private exposeAPI(): void {
    (window as any).Kefine = {
      toggleSidebar: () => this.toggleSidebar(),
      openSidebar: () => this.openSidebar(),
      closeSidebar: () => this.closeSidebar(),
      expandPost: (id: string) => this.expandPost(id),
      collapsePost: () => this.collapsePost(),
    };
  }
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new KefineApp());
} else {
  new KefineApp();
}

export default KefineApp;

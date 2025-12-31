import { registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js";

// Import WebAwesome components individually
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/switch/switch.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/select/select.js";

// Import our custom Lit components for interactive elements
import "./components/overlay.js";
import "./components/counter.js";
import "./components/filter-option.js";
import "./components/nav-item.js";
import "./components/setting-item.js";
import "./components/kf-combobox/kf-combobox.js";

// Register the icon library
registerIconLibrary("icon", {
  resolver: (name: string) => `/icons/${name}.svg`,
});

/**
 * Kefine Application TypeScript
 * Handles sidebar toggle, search combobox, keyboard shortcuts, posts, and settings
 * Interactive elements are handled by Lit components, static templates remain as ECR
 */

// WebAwesome components are already registered when we import their files above
// No need to define them again

// ===== Types =====
type KFElement = HTMLElement & (HTMLElement | Element);

interface KefineAPI {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSound: () => void;
  expandPost: (postId: string) => void;
  collapsePost: () => void;
}

interface AppElements {
  app: KFElement | null;
  sidebar: HTMLElement | null;
  logoToggle: HTMLElement | null;
  sidebarClose: HTMLElement | null;
  searchCombobox: HTMLElement | null;
  sidebarSearch: HTMLInputElement | null;
  soundToggle: HTMLElement | null;
  themeSelect: HTMLSelectElement | null;
  loginButton: HTMLElement | null;
}

interface AppState {
  isSidebarOpen: boolean;
  isSoundEnabled: boolean;
  expandedPostId: string | null;
}

// ===== Application Class =====
class KefineApp {
  private elements: AppElements;
  private state: AppState;
  private api: KefineAPI;

  constructor() {
    this.elements = this.initializeElements();
    this.state = {
      isSidebarOpen: false,
      isSoundEnabled: false,
      expandedPostId: null,
    };

    this.api = {
      toggleSidebar: this.toggleSidebar.bind(this),
      openSidebar: this.openSidebar.bind(this),
      closeSidebar: this.closeSidebar.bind(this),
      toggleSound: this.toggleSound.bind(this),
      expandPost: this.expandPost.bind(this),
      collapsePost: this.collapsePost.bind(this),
    };

    this.initialize();
  }

  private initializeElements(): AppElements {
    return {
      app: document.querySelector("kf-app") as KFElement,
      sidebar: document.getElementById("sidebar"),
      logoToggle: document.getElementById("logo-toggle"),
      sidebarClose: document.getElementById("sidebar-close"),
      searchCombobox: document.querySelector("kf-combobox"),
      sidebarSearch: document.getElementById(
        "sidebar-search",
      ) as HTMLInputElement,
      soundToggle: document.getElementById("sound-toggle"),
      themeSelect: document.getElementById("theme-select") as HTMLSelectElement,
      loginButton: document.getElementById("login-button"),
    };
  }

  private initialize(): void {
    this.loadSettings();

    // Initialize Lit component event listeners for interactive elements
    this.initLitComponentEventListeners();

    // Initialize static template event listeners
    this.initStaticTemplateEventListeners();

    // Initialize posts
    this.initPosts();

    this.exposeAPI();

    // Log initialization
    console.log("Kefine initialized");
    console.log("Keyboard shortcuts:");
    console.log("  / - Focus search");
    console.log("  Ctrl+B - Toggle sidebar");
    console.log("  M - Toggle sound");
    console.log("  Esc - Close panels");
  }

  private loadSettings(): void {
    // Load saved settings from localStorage
    const savedSound = localStorage.getItem("sound-enabled");
    if (savedSound !== null) {
      this.state.isSoundEnabled = savedSound === "true";
      if (this.elements.soundToggle) {
        this.elements.soundToggle.setAttribute(
          "aria-pressed",
          String(this.state.isSoundEnabled),
        );
      }
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    const savedAnimations = localStorage.getItem("animations");
    if (savedAnimations === "false") {
      document.documentElement.classList.add("reduce-motion");
    }
  }

  private saveSettings(key: string, value: boolean | string): void {
    localStorage.setItem(key, String(value));
  }

  // ===== Lit Component Event Listeners =====
  private initLitComponentEventListeners(): void {
    // Listen for overlay clicks to close sidebar
    document.addEventListener("click", (e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.tagName === "KF-OVERLAY"
      ) {
        this.closeSidebar();
      }
    });

    // Listen for filter option toggle events
    document.addEventListener("toggle", (e: Event) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.tagName === "KF-FILTER-OPTION"
      ) {
        this.handleFilterChange();
      }
    });

    // Listen for nav item selection events
    document.addEventListener("nav-select", (e: Event) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.tagName === "KF-NAV-ITEM"
      ) {
        const label = e.target.querySelector("span");
        if (label) {
          console.log("Navigate to:", label.textContent);
        }
      }
    });

    // Listen for combobox select events
    document.addEventListener("kf-combobox-select", (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("Search selected:", customEvent.detail);
    });
  }

  // ===== Static Template Event Listeners =====
  private initStaticTemplateEventListeners(): void {
    // Sidebar toggle
    if (this.elements.logoToggle) {
      this.elements.logoToggle.addEventListener(
        "click",
        this.toggleSidebar.bind(this),
      );
    }

    // Sidebar close
    if (this.elements.sidebarClose) {
      this.elements.sidebarClose.addEventListener(
        "click",
        this.closeSidebar.bind(this),
      );
    }

    // Sound toggle
    if (this.elements.soundToggle) {
      this.elements.soundToggle.addEventListener(
        "click",
        this.toggleSound.bind(this),
      );
    }

    // Sidebar search
    if (this.elements.sidebarSearch) {
      this.elements.sidebarSearch.addEventListener("input", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.handleSearch(target.value);
      });
    }

    // Login button
    if (this.elements.loginButton) {
      this.elements.loginButton.addEventListener("click", () => {
        console.log("Login clicked");
        // Handle login action
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", this.handleKeydown.bind(this));

    // Settings toggles - these are static elements that need manual event handling
    const settingsToggles = document.querySelectorAll(
      'kf-setting-item input[type="checkbox"]',
    );
    settingsToggles.forEach((toggle) => {
      toggle.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.saveSettings(target.id, target.checked);
      });
    });

    // Theme select
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLSelectElement;
        document.documentElement.setAttribute("data-theme", target.value);
        this.saveSettings("theme", target.value);
      });
    }
  }

  // ===== Sidebar Functions =====
  private openSidebar(): void {
    this.state.isSidebarOpen = true;
    if (this.elements.sidebar) this.elements.sidebar.setAttribute("open", "");
    if (this.elements.app) this.elements.app.setAttribute("sidebar-open", "");
    this.createOverlay();
  }

  private closeSidebar(): void {
    this.state.isSidebarOpen = false;
    if (this.elements.sidebar) this.elements.sidebar.removeAttribute("open");
    if (this.elements.app) this.elements.app.removeAttribute("sidebar-open");
    this.removeOverlay();
  }

  public toggleSidebar(): void {
    if (this.state.isSidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  // ===== Overlay Functions =====
  private createOverlay(): void {
    let overlay = document.querySelector("kf-overlay");
    if (!overlay) {
      overlay = document.createElement("kf-overlay");
      document.body.appendChild(overlay);
    }
    // Force reflow for transition
    if (overlay) {
      (overlay as HTMLElement).offsetHeight;
      overlay.setAttribute("visible", "");
    }
  }

  private removeOverlay(): void {
    const overlay = document.querySelector("kf-overlay");
    if (overlay) {
      overlay.removeAttribute("visible");
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 250);
    }
  }

  // ===== Post Functions =====
  private initPosts(): void {
    const posts = document.querySelectorAll("kf-post");
    posts.forEach((post) => {
      post.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        // Don't expand if clicking on action buttons
        if (target.closest("kf-post-action") || target.closest("wa-button")) {
          return;
        }
        const postId = post.getAttribute("data-post-id");
        if (postId && !post.hasAttribute("expanded")) {
          this.expandPost(postId);
        }
      });
    });
  }

  public expandPost(postId: string): void {
    const post = document.querySelector(`kf-post[data-post-id="${postId}"]`);
    if (!post) return;

    // Close any previously expanded post
    if (this.state.expandedPostId) {
      this.collapsePost();
    }

    this.state.expandedPostId = postId;
    post.setAttribute("expanded", "");
    document.body.style.overflow = "hidden";

    // Add close button if not exists
    if (!post.querySelector(".kf-post-close")) {
      const closeBtn = document.createElement("wa-button");
      closeBtn.className = "kf-post-close";
      closeBtn.setAttribute("appearance", "plain");
      closeBtn.setAttribute("variant", "neutral");
      closeBtn.setAttribute("size", "small");
      closeBtn.setAttribute("aria-label", "Close post");
      closeBtn.innerHTML = '<wa-icon name="xmark"></wa-icon>';
      closeBtn.style.cssText =
        "position: absolute; top: 1rem; right: 1rem; z-index: 10;";
      closeBtn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        this.collapsePost();
      });
      (post as HTMLElement).style.position = "relative";
      post.appendChild(closeBtn);
    }

    // Handle Escape key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.collapsePost();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  public collapsePost(): void {
    if (!this.state.expandedPostId) return;

    const post = document.querySelector(
      `kf-post[data-post-id="${this.state.expandedPostId}"]`,
    );
    if (post) {
      post.removeAttribute("expanded");
      const closeBtn = post.querySelector(".kf-post-close");
      if (closeBtn) {
        closeBtn.remove();
      }
    }

    document.body.style.overflow = "";
    this.state.expandedPostId = null;
  }

  private handleSearch(query: string): void {
    console.log("Search query:", query);
    // In a real application, this would make an API call
  }

  private focusSearch(): void {
    const combobox = this.elements.searchCombobox as any;
    if (combobox && combobox.focus) {
      combobox.focus();
    }
  }

  // ===== Sound Functions =====
  public toggleSound(): void {
    this.state.isSoundEnabled = !this.state.isSoundEnabled;
    if (this.elements.soundToggle) {
      this.elements.soundToggle.setAttribute(
        "aria-pressed",
        String(this.state.isSoundEnabled),
      );
      // Update icon or visual state
      const icon = this.elements.soundToggle.querySelector("wa-icon");
      if (icon) {
        icon.setAttribute(
          "name",
          this.state.isSoundEnabled ? "volume-high" : "volume-xmark",
        );
      }
    }
    // Save preference
    this.saveSettings("sound-enabled", this.state.isSoundEnabled);
  }

  // ===== Filter Functions =====
  private handleFilterChange(): void {
    const selectedFilters: string[] = [];
    document.querySelectorAll("kf-filter-option[selected]").forEach((option) => {
      const label = option.querySelector("span");
      if (label) {
        selectedFilters.push(label.textContent || "");
      }
    });
    console.log("Selected filters:", selectedFilters);
    // Apply filters to content
  }

  // ===== Keyboard Shortcuts =====
  private handleKeydown(event: KeyboardEvent): void {
    // Don't handle shortcuts when typing in inputs
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement?.tagName || "",
    );

    // Global shortcuts (work even when typing)
    if (event.key === "Escape") {
      if (this.state.expandedPostId) {
        this.collapsePost();
        event.preventDefault();
        return;
      }
      if (this.state.isSidebarOpen) {
        this.closeSidebar();
        event.preventDefault();
      }
      if (document.activeElement !== document.body) {
        (document.activeElement as HTMLElement)?.blur();
      }
      return;
    }

    // Skip other shortcuts when typing
    if (isTyping) return;

    switch (event.key) {
      case "/":
        event.preventDefault();
        this.focusSearch();
        break;

      case "m":
      case "M":
        event.preventDefault();
        this.toggleSound();
        break;

      case "b":
      case "B":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleSidebar();
        }
        break;
    }
  }

  private exposeAPI(): void {
    (window as any).Kefine = this.api;
  }
}

// ===== Initialization =====
function initializeApp(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new KefineApp());
  } else {
    new KefineApp();
  }
}

// Initialize the application
initializeApp();

export default KefineApp;

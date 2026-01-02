import "./components/kf-icon/kf-icon.js";
import "./components/kf-switch/kf-switch.js";
import "./components/kf-card-close/kf-card-close.js";
import "./components/kf-combobox/kf-combobox.js";
import "./components/kf-sidebar/kf-sidebar.js";
import "./components/kf-setting-item/kf-setting-item.js";

import { SidebarHandler } from "./components/use-sidebar/use-sidebar.js";
import { CardHandler } from "./components/use-card/use-card.js";
import { SettingsHandler } from "./components/use-settings/use-settings.js";
import { KeyboardHandler } from "./components/use-keyboard/use-keyboard.js";
import { ScrollHandler } from "./components/use-scroll/use-scroll.js";

class KefineApp {
  private sidebarHandler: SidebarHandler;
  private cardHandler: CardHandler;
  private settingsHandler: SettingsHandler;
  private keyboardHandler: KeyboardHandler;
  private scrollHandler: ScrollHandler;

  constructor() {
    // Initialize settings first
    this.settingsHandler = new SettingsHandler();

    // Initialize other handlers
    this.sidebarHandler = new SidebarHandler();
    this.keyboardHandler = new KeyboardHandler();
    this.scrollHandler = new ScrollHandler();

    // Initialize card handler after other handlers are set up
    this.cardHandler = new CardHandler();

    // Initialize event listeners that need coordination between handlers
    this.initEventListeners();

    // Set up coordination between card handler and scroll handler
    this.setupCardScrollCoordination();

    this.exposeAPI();
  }

  private setupCardScrollCoordination(): void {
    // Update scroll handler with current card state
    if (typeof this.cardHandler.updateScrollHandler === "function") {
      this.cardHandler.updateScrollHandler(this.scrollHandler);
    }
  }

  private initEventListeners(): void {
    // Combobox select
    document.addEventListener("kf-combobox-select", (e) => {
      console.log("Search selected:", (e as CustomEvent).detail);
    });

    // Escape key handling - needs access to both sidebar and card states
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // For now, we'll handle this in the main app since it requires coordination
        // between multiple handlers
        if (this.cardHandler["state"]?.expandedCardId) {
          this.cardHandler.collapseCard();
          e.preventDefault();
        } else if (this.sidebarHandler["state"]?.sidebarOpen) {
          this.sidebarHandler.closeSidebar();
          e.preventDefault();
        }
      }
    });

    // Keyboard shortcuts that require coordination between handlers
    document.addEventListener("keydown", (e) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName || "",
      );

      if (isTyping) return;

      switch (e.key) {
        case "b":
        case "B":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.sidebarHandler.toggleSidebar();
          }
          break;
        case "ArrowDown":
        case "j":
          if (this.cardHandler["state"]?.expandedCardId) {
            e.preventDefault();
            this.cardHandler.navigateToNextCard();
          }
          break;
        case "ArrowUp":
        case "k":
          if (this.cardHandler["state"]?.expandedCardId) {
            e.preventDefault();
            this.cardHandler.navigateToPrevCard();
          }
          break;
      }
    });

    // Set up scroll handler with cards from card handler
    const cards = Array.from(
      document.querySelectorAll('kf-card[variant="post"]'),
    );
    if (typeof this.scrollHandler.initInfiniteScrollWithCards === "function") {
      this.scrollHandler.initInfiniteScrollWithCards(cards);
    }
  }

  private exposeAPI(): void {
    const api: any = {};

    // Expose API methods from all handlers
    this.sidebarHandler.exposeAPI(api);
    this.cardHandler.exposeAPI(api);
    this.settingsHandler.exposeAPI(api);
    this.keyboardHandler.exposeAPI(api);
    this.scrollHandler.exposeAPI(api);

    (window as any).Kefine = api;
  }
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new KefineApp());
} else {
  new KefineApp();
}

export default KefineApp;

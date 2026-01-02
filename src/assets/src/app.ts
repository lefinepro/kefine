// Import Lit components for interactive elements
// All icons are local Carbon Design System SVGs
import "./components/kf-icon/kf-icon.js";
import "./components/kf-switch/kf-switch.js";
import "./components/kf-card-close/kf-card-close.js";
import "./components/kf-combobox/kf-combobox.js";

/**
 * Kefine Application
 * Handles sidebar toggle, keyboard shortcuts, and settings
 * Interactive elements are Lit components, static templates remain as ECR
 */

interface AppState {
  sidebarOpen: boolean;
  expandedCardId: string | null;
  currentCardIndex: number;
}

class KefineApp {
  private state: AppState = {
    sidebarOpen: false,
    expandedCardId: null,
    currentCardIndex: 0,
  };

  private cards: Element[] = [];

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

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeydown(e));

    // Settings switches
    document.querySelectorAll("kf-switch").forEach((toggle) => {
      toggle.addEventListener("change", (e) => this.handleSettingChange(e));
    });

    // Post cards - using kf-card[variant="post"]
    this.cards = Array.from(
      document.querySelectorAll('kf-card[variant="post"]'),
    );
    this.cards.forEach((card, index) => {
      card.addEventListener("click", (e) =>
        this.handleCardClick(e, card, index),
      );
      card
        .querySelector("kf-card-close")
        ?.addEventListener("close", () => this.collapseCard());

      // Comment toggle button - shows comment form when clicked
      const commentToggle = card.querySelector(".comment-toggle");
      commentToggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleCommentForm(card);
      });
    });

    // Infinite scroll for feed
    this.initInfiniteScroll();

    // Combobox select
    document.addEventListener("kf-combobox-select", (e) => {
      console.log("Search selected:", (e as CustomEvent).detail);
    });
  }

  private initInfiniteScroll(): void {
    const feed = document.querySelector("kf-feed");
    if (!feed) return;

    // Observer for infinite scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.state.expandedCardId) {
            const cardIndex = this.cards.findIndex(
              (c) =>
                c.getAttribute("data-post-id") === this.state.expandedCardId,
            );
            if (cardIndex !== -1) {
              this.state.currentCardIndex = cardIndex;
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    this.cards.forEach((card) => observer.observe(card));
  }

  private handleSettingChange(e: Event): void {
    const target = e.target as HTMLElement & { checked: boolean; id: string };
    localStorage.setItem(target.id, String(target.checked));

    switch (target.id) {
      case "dark-mode-toggle":
        document.documentElement.setAttribute(
          "data-theme",
          target.checked ? "dark" : "light",
        );
        localStorage.setItem("theme", target.checked ? "dark" : "light");
        break;
      case "animations-toggle":
        document.documentElement.classList.toggle(
          "reduce-motion",
          !target.checked,
        );
        localStorage.setItem("animations", String(target.checked));
        break;
    }
  }

  private handleCardClick(e: Event, card: Element, index: number): void {
    const target = e.target as HTMLElement;
    if (
      target.closest("kf-card-action") ||
      target.closest("button") ||
      target.closest("kf-card-close")
    ) {
      return;
    }
    const cardId = card.getAttribute("data-post-id");
    if (cardId && !card.hasAttribute("expanded")) {
      this.state.currentCardIndex = index;
      this.expandCard(cardId);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement?.tagName || "",
    );

    if (e.key === "Escape") {
      if (this.state.expandedCardId) {
        this.collapseCard();
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
      case "ArrowDown":
      case "j":
        if (this.state.expandedCardId) {
          e.preventDefault();
          this.navigateToNextCard();
        }
        break;
      case "ArrowUp":
      case "k":
        if (this.state.expandedCardId) {
          e.preventDefault();
          this.navigateToPrevCard();
        }
        break;
    }
  }

  private navigateToNextCard(): void {
    if (this.state.currentCardIndex < this.cards.length - 1) {
      this.collapseCard();
      this.state.currentCardIndex++;
      const nextCard = this.cards[this.state.currentCardIndex];
      const nextId = nextCard?.getAttribute("data-post-id");
      if (nextId) {
        this.expandCard(nextId);
      }
    }
  }

  private navigateToPrevCard(): void {
    if (this.state.currentCardIndex > 0) {
      this.collapseCard();
      this.state.currentCardIndex--;
      const prevCard = this.cards[this.state.currentCardIndex];
      const prevId = prevCard?.getAttribute("data-post-id");
      if (prevId) {
        this.expandCard(prevId);
      }
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

  expandCard(cardId: string): void {
    if (this.state.expandedCardId) this.collapseCard();

    const card = document.querySelector(`kf-card[data-post-id="${cardId}"]`);
    if (!card) return;

    this.state.expandedCardId = cardId;
    card.setAttribute("expanded", "");
    card.querySelector("kf-card-close")?.setAttribute("visible", "");
    document.body.style.overflow = "hidden";
  }

  collapseCard(): void {
    if (!this.state.expandedCardId) return;

    const card = document.querySelector(
      `kf-card[data-post-id="${this.state.expandedCardId}"]`,
    );
    card?.removeAttribute("expanded");
    card?.querySelector("kf-card-close")?.removeAttribute("visible");
    document.body.style.overflow = "";
    this.state.expandedCardId = null;
  }

  navigateToHome(): void {
    this.collapseCard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  toggleCommentForm(card: Element): void {
    const commentForm = card.querySelector("kf-comment-form");
    if (!commentForm) return;

    // First expand the card if not expanded
    const cardId = card.getAttribute("data-post-id");
    if (cardId && !card.hasAttribute("expanded")) {
      const index = this.cards.indexOf(card);
      this.state.currentCardIndex = index;
      this.expandCard(cardId);
    }

    // Toggle comment form visibility
    if (commentForm.hasAttribute("hidden")) {
      commentForm.removeAttribute("hidden");
      // Focus the combobox input after a short delay
      setTimeout(() => {
        (commentForm.querySelector("kf-combobox") as any)?.focus();
      }, 100);
    } else {
      commentForm.setAttribute("hidden", "");
    }
  }

  private exposeAPI(): void {
    (window as any).Kefine = {
      toggleSidebar: () => this.toggleSidebar(),
      openSidebar: () => this.openSidebar(),
      closeSidebar: () => this.closeSidebar(),
      expandCard: (id: string) => this.expandCard(id),
      collapseCard: () => this.collapseCard(),
      navigateToHome: () => this.navigateToHome(),
      nextCard: () => this.navigateToNextCard(),
      prevCard: () => this.navigateToPrevCard(),
      toggleCommentForm: (card: Element) => this.toggleCommentForm(card),
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

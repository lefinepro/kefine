/**
 * Card functionality for Kefine Application
 */

interface CardState {
  expandedCardId: string | null;
  currentCardIndex: number;
}

export class CardHandler {
  public state: CardState = {
    expandedCardId: null,
    currentCardIndex: 0,
  };

  private cards: Element[] = [];

  constructor() {
    this.initCards();
  }

  private initCards(): void {
    // Post cards - using kf-card[variant="post"]
    this.cards = Array.from(document.querySelectorAll('kf-card[variant="post"]'));
    this.cards.forEach((card, index) => {
      card.addEventListener("click", (e) => this.handleCardClick(e, card, index));
      card.querySelector("kf-card-close")?.addEventListener("close", () => this.collapseCard());

      // Comment toggle button - shows comment form when clicked
      const commentToggle = card.querySelector(".comment-toggle");
      commentToggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleCommentForm(card);
      });
    });
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

    const card = document.querySelector(`kf-card[data-post-id="${this.state.expandedCardId}"]`);
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

  navigateToNextCard(): void {
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

  navigateToPrevCard(): void {
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

  // Expose API methods
  exposeAPI(api: any): void {
    api.expandCard = (id: string) => this.expandCard(id);
    api.collapseCard = () => this.collapseCard();
    api.navigateToHome = () => this.navigateToHome();
    api.nextCard = () => this.navigateToNextCard();
    api.prevCard = () => this.navigateToPrevCard();
    api.toggleCommentForm = (card: Element) => this.toggleCommentForm(card);
  }

  // Method to update scroll handler when state changes
  updateScrollHandler(scrollHandler: any): void {
    if (scrollHandler && typeof scrollHandler.updateState === "function") {
      scrollHandler.updateState(this.state.expandedCardId, this.state.currentCardIndex);
    }
  }
}

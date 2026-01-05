/**
 * Infinite scroll functionality for Kefine Application
 */

interface ScrollState {
  expandedCardId: string | null;
  currentCardIndex: number;
}

export class ScrollHandler {
  private state: ScrollState = {
    expandedCardId: null,
    currentCardIndex: 0,
  };

  constructor() {
    this.initInfiniteScroll();
  }

  initInfiniteScrollWithCards(cards: Element[]): void {
    const feed = document.querySelector("kf-feed");
    if (!feed) return;

    // Observer for infinite scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.state.expandedCardId) {
            const cardIndex = cards.findIndex(
              (c) => c.getAttribute("data-post-id") === this.state.expandedCardId,
            );
            if (cardIndex !== -1) {
              this.state.currentCardIndex = cardIndex;
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    cards.forEach((card) => observer.observe(card));
  }

  private initInfiniteScroll(): void {
    // Initially set up with existing cards
    const cards = Array.from(document.querySelectorAll('kf-card[variant="post"]'));
    this.initInfiniteScrollWithCards(cards);
  }

  // Expose API methods
  exposeAPI(_api: any): void {
    // No direct API methods for scroll handler
  }

  // Method to update state from outside
  updateState(expandedCardId: string | null, currentCardIndex: number): void {
    this.state.expandedCardId = expandedCardId;
    this.state.currentCardIndex = currentCardIndex;
  }
}

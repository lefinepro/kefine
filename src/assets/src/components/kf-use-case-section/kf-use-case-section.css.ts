import { css } from "lit";

export const kfUseCaseSectionStyles = css`
  :host {
    display: block;
    width: 100%;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity var(--kf-transition-normal), transform var(--kf-transition-normal);
  }

  :host([visible]) {
    opacity: 1;
    transform: translateY(0);
  }

  .use-case-section {
    width: 100%;
    padding: var(--kf-space-3xl) var(--kf-space-xl);
    background-color: var(--kf-color-bg-secondary);
    box-sizing: border-box;
  }

  .section-header {
    text-align: center;
    margin-bottom: var(--kf-space-2xl);
  }

  .section-title {
    font-size: var(--kf-font-size-2xl);
    font-weight: var(--kf-font-weight-bold);
    color: var(--kf-color-text-primary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Carousel container */
  .carousel-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    overflow: hidden;
  }

  .carousel-track {
    display: grid;
    gap: var(--kf-space-lg);
    transition: transform var(--kf-transition-normal);
  }

  /* Responsive grid columns */
  /* Default: 3 columns on desktop >= 1200px */
  .carousel-track {
    grid-template-columns: repeat(3, 1fr);
  }

  /* 2 columns on tablet >= 768px */
  @media (max-width: 1199px) and (min-width: 768px) {
    .carousel-track {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* 1 column on mobile < 768px */
  @media (max-width: 767px) {
    .carousel-track {
      grid-template-columns: 1fr;
    }
  }

  /* Use-case card */
  .use-case-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--kf-space-xl);
    background-color: var(--kf-color-bg-elevated);
    border: 1px solid var(--kf-color-border-default);
    text-align: center;
    transition: all var(--kf-transition-fast);
    cursor: pointer;
  }

  .use-case-card:hover {
    background-color: var(--kf-color-bg-surface);
    border-color: var(--kf-color-accent-primary);
    transform: translateY(-2px);
  }

  .use-case-card:focus {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: 2px;
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: var(--kf-space-md);
    color: var(--kf-color-accent-primary);
    font-size: var(--kf-font-size-2xl);
  }

  .card-title {
    font-size: var(--kf-font-size-lg);
    font-weight: var(--kf-font-weight-semibold);
    color: var(--kf-color-text-primary);
    margin: 0 0 var(--kf-space-sm) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-description {
    font-size: var(--kf-font-size-sm);
    color: var(--kf-color-text-secondary);
    line-height: var(--kf-line-height-normal);
    margin: 0 0 var(--kf-space-md) 0;
    max-width: 80ch;
    /* Limit to ~80 characters as per requirements */
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-link {
    display: inline-flex;
    align-items: center;
    gap: var(--kf-space-xs);
    color: var(--kf-color-accent-primary);
    font-size: var(--kf-font-size-sm);
    font-weight: var(--kf-font-weight-medium);
    text-decoration: none;
    transition: color var(--kf-transition-fast);
  }

  .card-link:hover {
    color: var(--kf-color-accent-secondary);
  }

  .card-link:focus {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: 2px;
  }

  /* Carousel navigation */
  .carousel-nav {
    display: flex;
    justify-content: center;
    gap: var(--kf-space-sm);
    margin-top: var(--kf-space-xl);
  }

  .carousel-dot {
    width: 10px;
    height: 10px;
    background-color: var(--kf-color-border-default);
    border: none;
    cursor: pointer;
    transition: background-color var(--kf-transition-fast);
  }

  .carousel-dot:hover,
  .carousel-dot[aria-selected="true"] {
    background-color: var(--kf-color-accent-primary);
  }

  .carousel-dot:focus {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: 2px;
  }

  /* Carousel arrows */
  .carousel-arrows {
    display: none; /* Hidden on mobile, shown on desktop */
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    justify-content: space-between;
    pointer-events: none;
    padding: 0 var(--kf-space-md);
  }

  @media (min-width: 768px) {
    .carousel-arrows {
      display: flex;
    }
  }

  .carousel-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: var(--kf-color-bg-elevated);
    border: 1px solid var(--kf-color-border-default);
    cursor: pointer;
    pointer-events: auto;
    transition: all var(--kf-transition-fast);
  }

  .carousel-arrow:hover {
    background-color: var(--kf-color-accent-primary);
    color: var(--kf-color-bg-primary);
    border-color: var(--kf-color-accent-primary);
  }

  .carousel-arrow:focus {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: 2px;
  }

  .carousel-arrow:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading state */
  .loading-state {
    display: flex;
    justify-content: center;
    padding: var(--kf-space-2xl);
    color: var(--kf-color-text-muted);
  }

  /* Error state */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--kf-space-md);
    padding: var(--kf-space-2xl);
    color: var(--kf-color-accent-error);
    text-align: center;
  }

  /* Mobile swipe indicator */
  .swipe-indicator {
    display: none;
    text-align: center;
    padding: var(--kf-space-md);
    color: var(--kf-color-text-muted);
    font-size: var(--kf-font-size-xs);
  }

  @media (max-width: 767px) {
    .swipe-indicator {
      display: block;
    }
  }

  /* Responsive padding */
  @media (max-width: 768px) {
    .use-case-section {
      padding: var(--kf-space-2xl) var(--kf-space-md);
    }

    .section-title {
      font-size: var(--kf-font-size-xl);
    }
  }
`;

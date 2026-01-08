import { css } from "lit";

export const kfLandingHeroStyles = css`
  :host {
    display: block;
    width: 100%;
    min-height: 100vh;
    position: relative;
  }

  .hero-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(
      135deg,
      var(--kf-color-bg-primary) 0%,
      var(--kf-color-bg-secondary) 50%,
      var(--kf-color-bg-tertiary) 100%
    );
    position: relative;
    padding: var(--kf-space-xl);
    box-sizing: border-box;
  }

  /* Subtle overlay for text readability */
  .hero-section::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.02);
    pointer-events: none;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    text-align: center;
    max-width: 600px;
    width: 100%;
  }

  .hero-slogan {
    font-size: var(--kf-font-size-3xl);
    font-weight: var(--kf-font-weight-bold);
    color: var(--kf-color-text-primary);
    margin: 0 0 var(--kf-space-2xl) 0;
    line-height: var(--kf-line-height-tight);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hero-combobox-wrapper {
    width: 100%;
    max-width: 400px;
  }

  /* Ensure combobox is visible and styled */
  .hero-combobox-wrapper kf-combobox {
    --kf-combobox-bg: var(--kf-color-bg-elevated);
  }

  /* Error state */
  .hero-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--kf-space-md);
    padding: var(--kf-space-lg);
    background-color: var(--kf-color-bg-surface);
    border: 1px solid var(--kf-color-accent-error);
    color: var(--kf-color-accent-error);
    text-align: center;
  }

  .hero-error-message {
    font-size: var(--kf-font-size-sm);
    color: var(--kf-color-text-secondary);
  }

  .hero-error button {
    background-color: var(--kf-color-accent-error);
    color: var(--kf-color-bg-primary);
    border: none;
    padding: var(--kf-space-xs) var(--kf-space-md);
    cursor: pointer;
    font-size: var(--kf-font-size-sm);
  }

  .hero-error button:hover {
    opacity: 0.9;
  }

  /* Fallback static list */
  .fallback-list {
    width: 100%;
    max-width: 400px;
    background-color: var(--kf-color-bg-elevated);
    border: 1px solid var(--kf-color-border-default);
  }

  .fallback-list select {
    width: 100%;
    padding: var(--kf-space-sm) var(--kf-space-md);
    background-color: var(--kf-color-bg-elevated);
    border: none;
    color: var(--kf-color-text-primary);
    font-size: var(--kf-font-size-sm);
    cursor: pointer;
  }

  .fallback-list select:focus {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: -2px;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .hero-section {
      min-height: 80vh;
      padding: var(--kf-space-lg);
    }

    .hero-slogan {
      font-size: var(--kf-font-size-2xl);
      margin-bottom: var(--kf-space-xl);
    }

    .hero-combobox-wrapper {
      max-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .hero-slogan {
      font-size: var(--kf-font-size-xl);
    }
  }
`;

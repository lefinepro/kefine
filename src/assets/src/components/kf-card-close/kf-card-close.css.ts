import { css } from "lit";

export const kfCardCloseStyles = css`
  :host {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: none;
    background-color: var(--kf-color-bg-secondary);
    border-bottom: 1px solid var(--kf-color-border-default);
  }

  :host([visible]) {
    display: block;
  }

  .card-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  button:hover {
    color: var(--kf-color-accent-primary);
  }

  button:focus-visible {
    outline: 2px solid var(--kf-color-accent-primary);
    outline-offset: 2px;
  }

  .back-btn {
    font-weight: 500;
  }

  .close-btn {
    padding: 0.5rem;
  }
`;

export default kfCardCloseStyles;

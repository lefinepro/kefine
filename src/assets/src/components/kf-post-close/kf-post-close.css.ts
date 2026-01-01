import { css } from "lit";

export const kfPostCloseStyles = css`
  :host {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
    display: none;
  }

  :host([visible]) {
    display: block;
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
  }

  button:hover {
    opacity: 0.8;
  }

  button:focus-visible {
    outline: 2px solid var(--kf-focus-ring-color, #3b82f6);
    outline-offset: 2px;
  }
`;

export default kfPostCloseStyles;

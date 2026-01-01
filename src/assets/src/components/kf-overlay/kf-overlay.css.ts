import { css } from "lit";

export const kfOverlayStyles = css`
  :host {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.25s ease,
      visibility 0.25s ease;
  }

  :host([visible]) {
    opacity: 1;
    visibility: visible;
  }
`;

export default kfOverlayStyles;

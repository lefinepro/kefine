import { css } from "lit";

export const kfIconStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    line-height: 1;
    color: inherit;
    contain: strict;
    box-sizing: content-box !important;
  }

  :host([size="sm"]) {
    font-size: 0.875rem;
  }

  :host([size="md"]) {
    font-size: 1rem;
  }

  :host([size="lg"]) {
    font-size: 1.25rem;
  }

  :host([size="xl"]) {
    font-size: 1.5rem;
  }

  :host([size="2xl"]) {
    font-size: 2rem;
  }

  :host([size="3xl"]) {
    font-size: 3rem;
  }

  svg {
    display: block;
    width: 1em;
    height: 1em;
    fill: currentColor;
  }
`;

export default kfIconStyles;

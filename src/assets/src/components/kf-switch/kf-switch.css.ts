import { css } from "lit";

export const kfSwitchStyles = css`
  :host {
    --width: 2.25rem;
    --height: 1.25rem;
    --thumb-size: 0.875rem;

    display: inline-flex;
    line-height: 1.5;
  }

  :host([size="small"]) {
    --width: 1.75rem;
    --height: 1rem;
    --thumb-size: 0.625rem;
    font-size: 0.875rem;
  }

  :host([size="large"]) {
    --width: 2.75rem;
    --height: 1.5rem;
    --thumb-size: 1.125rem;
    font-size: 1.125rem;
  }

  label {
    position: relative;
    display: inline-flex;
    align-items: center;
    font: inherit;
    color: inherit;
    vertical-align: middle;
    cursor: pointer;
    gap: 0.5rem;
  }

  label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .switch {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--kf-switch-background, #d1d5db);
    border: 1px solid var(--kf-switch-border-color, #9ca3af);
    border-radius: 0;
    transition: background-color 150ms ease, border-color 150ms ease;
  }

  .switch .thumb {
    position: absolute;
    left: 2px;
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--kf-switch-thumb-color, #6b7280);
    border-radius: 0;
    transition: transform 150ms ease, background-color 150ms ease;
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Focus */
  label:not(.disabled) .input:focus-visible ~ .switch .thumb {
    outline: 2px solid var(--kf-focus-ring-color, #3b82f6);
    outline-offset: 2px;
  }

  /* Checked */
  .checked .switch {
    background-color: var(--kf-switch-checked-background, #3b82f6);
    border-color: var(--kf-switch-checked-border-color, #2563eb);
  }

  .checked .switch .thumb {
    background-color: var(--kf-switch-checked-thumb-color, #ffffff);
    transform: translateX(calc(var(--width) - var(--thumb-size) - 4px));
  }

  /* Hover */
  label:not(.disabled):hover .switch {
    border-color: var(--kf-switch-hover-border-color, #6b7280);
  }

  .checked:hover .switch {
    border-color: var(--kf-switch-checked-hover-border-color, #1d4ed8);
  }

  [part~="label"] {
    display: inline-block;
    line-height: var(--height);
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) [part~="label"]::after {
    content: " *";
    color: #ef4444;
  }

  @media (prefers-reduced-motion: reduce) {
    .switch,
    .switch .thumb {
      transition: none;
    }
  }
`;

export default kfSwitchStyles;

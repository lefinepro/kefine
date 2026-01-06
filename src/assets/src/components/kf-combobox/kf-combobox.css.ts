import { css } from "lit";

export const kfComboboxStyles = css`
  :host {
    display: block;
    position: relative;
    --kf-combobox-bg: var(--kf-color-bg-surface, #ffffff);
    --kf-combobox-border-color: var(--kf-color-border-default, #e5e7eb);
    --kf-combobox-border-radius: 0.375rem;
    --kf-combobox-text-color: var(--kf-color-text-primary, #111827);
    --kf-combobox-placeholder-color: var(--kf-color-text-muted, #9ca3af);
    --kf-combobox-focus-color: var(--kf-color-accent-primary, #3b82f6);
    --kf-combobox-option-hover-bg: var(--kf-color-hover-bg, rgba(59, 130, 246, 0.1));
    --kf-combobox-option-selected-bg: var(--kf-color-selected-bg, rgba(59, 130, 246, 0.2));
    --kf-combobox-option-focused-bg: var(--kf-color-hover-bg, rgba(59, 130, 246, 0.1));
    --kf-combobox-disabled-bg: var(--kf-color-bg-disabled, #f3f4f6);
    --kf-combobox-disabled-text: var(--kf-color-text-disabled, #9ca3af);
    --kf-combobox-highlight-bg: #fef3c7;
    --kf-combobox-highlight-color: #92400e;
    --kf-combobox-chip-bg: var(--kf-color-accent-primary, #3b82f6);
    --kf-combobox-chip-color: #ffffff;
    --kf-combobox-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    --kf-combobox-padding: 0.5rem 0.75rem;
    --kf-combobox-font-size: 0.875rem;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.6;
  }

  .combobox-wrapper {
    position: relative;
    width: 100%;
  }

  .combobox-input {
    width: 100%;
    padding: var(--kf-combobox-padding);
    padding-right: 2.5rem;
    font-size: var(--kf-combobox-font-size);
    font-family: inherit;
    border: 1px solid var(--kf-combobox-border-color);
    border-radius: var(--kf-combobox-border-radius);
    background: var(--kf-combobox-bg);
    color: var(--kf-combobox-text-color);
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
    /* CSS Anchor Positioning - anchor name for the input */
    anchor-name: --combobox-anchor;
  }

  .combobox-input:focus {
    outline: none;
    border-color: var(--kf-combobox-focus-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .combobox-input:disabled {
    background: var(--kf-combobox-disabled-bg);
    color: var(--kf-combobox-disabled-text);
    cursor: not-allowed;
  }

  .combobox-input::placeholder {
    color: var(--kf-combobox-placeholder-color);
  }

  .combobox-icon {
    display: none;
  }

  .combobox-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.25rem;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--kf-combobox-placeholder-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      opacity 0.15s ease-in-out,
      background-color 0.15s ease-in-out,
      color 0.15s ease-in-out;
    z-index: 1;
  }

  .combobox-clear:hover {
    color: var(--kf-combobox-text-color);
    background: var(--kf-combobox-option-hover-bg);
  }

  .combobox-clear:active {
    transform: translateY(-50%) scale(0.95);
  }

  /* Selected chips for multiple selection */
  .combobox-selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .combobox-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--kf-combobox-chip-bg);
    color: var(--kf-combobox-chip-color);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .combobox-chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem;
    border: none;
    background: transparent;
    color: currentColor;
    cursor: pointer;
    border-radius: 9999px;
    transition: background-color 0.15s ease-in-out;
  }

  .combobox-chip-remove:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .combobox-listbox {
    /* Fallback for browsers without anchor positioning support */
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;

    /* CSS Anchor Positioning - for modern browsers */
    position-anchor: --combobox-anchor;
    inset: unset;
    top: anchor(bottom);
    left: anchor(left);
    right: anchor(right);
    width: anchor-size(width);

    padding: 0;
    background: var(--kf-combobox-bg);
    border: 1px solid var(--kf-combobox-border-color);
    border-radius: var(--kf-combobox-border-radius);
    box-shadow: var(--kf-combobox-shadow);
    max-height: 16rem;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: var(--kf-z-index-dropdown, 100);
    scrollbar-width: thin;
  }

  .combobox-listbox::-webkit-scrollbar {
    width: 0.5rem;
  }

  .combobox-listbox::-webkit-scrollbar-track {
    background: transparent;
  }

  .combobox-listbox::-webkit-scrollbar-thumb {
    background: var(--kf-combobox-border-color);
    border-radius: 9999px;
  }

  .combobox-listbox::-webkit-scrollbar-thumb:hover {
    background: var(--kf-combobox-placeholder-color);
  }

  /* Fallback styles when anchor positioning is not supported */
  @supports not (anchor-name: --foo) {
    .combobox-listbox {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      width: auto;
      margin-top: 0.25rem;
    }
  }

  .combobox-listbox[hidden] {
    display: none;
  }

  /* Option styles */
  .combobox-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: var(--kf-combobox-padding);
    cursor: pointer;
    transition:
      background-color 0.15s ease-in-out,
      color 0.15s ease-in-out;
    user-select: none;
  }

  .combobox-option:not(:last-child) {
    border-bottom: 1px solid var(--kf-color-border-subtle, rgba(0, 0, 0, 0.05));
  }

  .combobox-option:hover:not(.combobox-option--disabled) {
    background: var(--kf-combobox-option-hover-bg);
  }

  .combobox-option--focused:not(.combobox-option--disabled) {
    background: var(--kf-combobox-option-focused-bg);
    outline: 2px solid var(--kf-combobox-focus-color);
    outline-offset: -2px;
  }

  .combobox-option--selected:not(.combobox-option--disabled) {
    background: var(--kf-combobox-option-selected-bg);
    font-weight: 500;
  }

  .combobox-option--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Pseudo-class support for Open UI spec */
  .combobox-option:focus-within {
    background: var(--kf-combobox-option-focused-bg);
  }

  .combobox-option-icon {
    flex-shrink: 0;
    color: var(--kf-combobox-placeholder-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .combobox-option--selected .combobox-option-icon,
  .combobox-option--focused .combobox-option-icon {
    color: var(--kf-combobox-focus-color);
  }

  .combobox-option-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--kf-combobox-text-color);
  }

  .combobox-option-type {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--kf-combobox-placeholder-color);
  }

  /* Highlight matched text */
  .combobox-highlight {
    background: var(--kf-combobox-highlight-bg);
    color: var(--kf-combobox-highlight-color);
    font-weight: 600;
    padding: 0.05rem 0.1rem;
    border-radius: 0.125rem;
  }

  .combobox-empty,
  .combobox-loading {
    padding: 1rem;
    text-align: center;
    color: var(--kf-combobox-placeholder-color);
    font-size: var(--kf-combobox-font-size);
  }

  .combobox-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  /* Slot for options (hidden by default) */
  slot[name="options"] {
    display: none;
  }

  /* Animation for listbox */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .combobox-listbox:not([hidden]) {
    animation: slideIn 0.15s ease-out;
  }

  /* Focus visible styles for better keyboard navigation */
  .combobox-input:focus-visible {
    outline: 2px solid var(--kf-combobox-focus-color);
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .combobox-option--focused {
      outline-width: 3px;
    }

    .combobox-input:focus {
      outline-width: 3px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .combobox-listbox:not([hidden]) {
      animation: none;
    }

    * {
      transition: none !important;
    }
  }
`;

export default kfComboboxStyles;

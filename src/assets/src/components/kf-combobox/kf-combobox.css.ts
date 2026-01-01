import { css } from "lit";

export const kfComboboxStyles = css`
  :host {
    display: block;
    position: relative;
  }

  .combobox-wrapper {
    position: relative;
    width: 100%;
  }

  .combobox-input {
    width: 100%;
    padding: 0.5rem 2.5rem 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--kf-color-border-default);
    background: var(--kf-color-bg-surface);
    color: var(--kf-color-text-primary);
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
  }

  .combobox-input:focus {
    outline: none;
    border-color: var(--kf-color-accent-primary);
  }

  .combobox-input::placeholder {
    color: var(--kf-color-text-muted);
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
    background: transparent;
    color: var(--kf-color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .combobox-clear:hover {
    color: var(--kf-color-text-primary);
    background: var(--kf-color-hover-bg);
  }

  .combobox-wrapper:focus-within .combobox-clear,
  .combobox-clear[visible] {
    opacity: 1;
  }

  .combobox-listbox {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    padding: 0;
    background: var(--kf-color-bg-surface);
    border: 1px solid var(--kf-color-border-default);
    border-radius: 0.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 16rem;
    overflow-y: auto;
    z-index: var(--kf-z-index-dropdown, 100);
  }

  .combobox-listbox[hidden] {
    display: none;
  }

  .combobox-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
  }

  .combobox-option:not(:last-child) {
    border-bottom: 1px solid var(--kf-color-border-subtle, rgba(0, 0, 0, 0.05));
  }

  .combobox-option:hover,
  .combobox-option[aria-selected="true"] {
    background: var(--kf-color-hover-bg);
  }

  .combobox-option[aria-selected="true"] {
    background: var(--kf-color-selected-bg);
  }

  .combobox-option-icon {
    flex-shrink: 0;
    color: var(--kf-color-text-muted);
  }

  .combobox-option-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--kf-color-text-primary);
  }

  .combobox-option-type {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--kf-color-text-muted);
  }

  .combobox-empty {
    padding: 1rem;
    text-align: center;
    color: var(--kf-color-text-muted);
    font-size: 0.875rem;
  }

  .combobox-loading {
    padding: 1rem;
    text-align: center;
    color: var(--kf-color-text-muted);
    font-size: 0.875rem;
  }
`;

export default kfComboboxStyles;

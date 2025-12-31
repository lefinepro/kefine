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
    padding: 0.5rem 2.5rem 0.5rem 2.5rem;
    font-size: 0.875rem;
    border: 1px solid var(--kf-border-color, #dee2e6);
    border-radius: var(--kf-radius-md, 0.375rem);
    background: var(--kf-surface-bg, #fff);
    color: var(--kf-text-primary, #212529);
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
  }

  .combobox-input:focus {
    outline: none;
    border-color: var(--kf-primary, #0d6efd);
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  }

  .combobox-input::placeholder {
    color: var(--kf-text-muted, #6c757d);
  }

  .combobox-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--kf-text-muted, #6c757d);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .combobox-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.25rem;
    border: none;
    background: transparent;
    color: var(--kf-text-muted, #6c757d);
    cursor: pointer;
    border-radius: var(--kf-radius-sm, 0.25rem);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .combobox-clear:hover {
    color: var(--kf-text-primary, #212529);
    background: var(--kf-hover-bg, #e9ecef);
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
    padding: 0.25rem;
    background: var(--kf-surface-bg, #fff);
    border: 1px solid var(--kf-border-color, #dee2e6);
    border-radius: var(--kf-radius-md, 0.375rem);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-height: 20rem;
    overflow-y: auto;
    z-index: 1000;
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
    border-radius: var(--kf-radius-sm, 0.25rem);
    transition: background-color 0.15s ease-in-out;
  }

  .combobox-option:hover,
  .combobox-option[aria-selected="true"] {
    background: var(--kf-hover-bg, #e9ecef);
  }

  .combobox-option[aria-selected="true"] {
    background: var(--kf-selected-bg, #e7f1ff);
  }

  .combobox-option-icon {
    flex-shrink: 0;
    color: var(--kf-text-muted, #6c757d);
  }

  .combobox-option-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .combobox-option-type {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--kf-text-muted, #6c757d);
  }

  .combobox-empty {
    padding: 1rem;
    text-align: center;
    color: var(--kf-text-muted, #6c757d);
    font-size: 0.875rem;
  }

  .combobox-loading {
    padding: 1rem;
    text-align: center;
    color: var(--kf-text-muted, #6c757d);
    font-size: 0.875rem;
  }
`;

export default kfComboboxStyles;

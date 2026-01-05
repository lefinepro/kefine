import { css } from "lit";

export const kfFilterOptionStyles = css`
  :host {
    display: block;
  }

  .filter-option {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .filter-option:hover {
    background-color: var(--hover-bg, #e9ecef);
  }

  .filter-option[selected] {
    background-color: var(--selected-bg, #e7f1ff);
  }

  .filter-checkbox {
    margin-right: 0.5rem;
  }
`;

export default kfFilterOptionStyles;

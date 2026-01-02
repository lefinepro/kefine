import { css } from "lit";

export const kfNavItemStyles = css`
  :host {
    display: block;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
    gap: 0.75rem;
  }

  .nav-item:hover {
    background-color: var(--hover-bg, #e9ecef);
  }

  .nav-item[active] {
    background-color: var(--active-bg, #0d6efd);
    color: white;
  }
`;

export default kfNavItemStyles;
import { css } from "lit";

export const kfSidebarStyles = css`
  :host {
    display: block;
    height: 100vh;
    width: var(--sidebar-width, 250px);
    background: var(--sidebar-bg, #f8f9fa);
    border-right: 1px solid var(--border-color, #dee2e6);
    position: relative;
    overflow: hidden;
    transition:
      transform 0.3s ease,
      width 0.3s ease;
  }

  :host([open="false"]) {
    width: 0;
    transform: translateX(-100%);
  }

  .sidebar-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .close-btn:hover {
    background-color: var(--hover-bg, #e9ecef);
  }

  .search-container {
    margin-bottom: 1rem;
  }

  .nav-container {
    flex: 1;
    overflow-y: auto;
  }

  .nav-item {
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 0.25rem;
  }

  .nav-item:hover {
    background-color: var(--hover-bg, #e9ecef);
  }

  .nav-item[active] {
    background-color: var(--active-bg, #0d6efd);
    color: white;
  }
`;

export default kfSidebarStyles;
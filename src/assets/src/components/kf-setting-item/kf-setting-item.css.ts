import { css } from "lit";

export const kfSettingItemStyles = css`
  :host {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color, #dee2e6);
  }

  :host(:last-child) {
    border-bottom: none;
  }

  .setting-content {
    flex: 1;
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .setting-title {
    font-weight: 500;
    color: var(--text-primary, #212529);
  }

  .setting-description {
    font-size: 0.875rem;
    color: var(--text-secondary, #6c757d);
  }

  .setting-control {
    flex-shrink: 0;
    margin-left: 1rem;
  }
`;

export default kfSettingItemStyles;

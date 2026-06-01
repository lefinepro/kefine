<script lang="ts">
  import Icon from '@iconify/svelte';

  let {
    value,
    placeholder,
    ariaLabel,
    status,
    active = false,
    completed = false,
    readonly = false,
    onInput,
    onKeydown
  }: {
    value: string;
    placeholder: string;
    ariaLabel: string;
    status: string;
    active?: boolean;
    completed?: boolean;
    readonly?: boolean;
    onInput?: (event: Event) => void;
    onKeydown?: (event: KeyboardEvent) => void;
  } = $props();

  const statusIcon = $derived(completed ? 'mdi:check-circle-outline' : active ? 'mdi:progress-clock' : 'mdi:source-repository');
</script>

<label
  class="kefine-repo-search"
  data-search-active={active}
  data-search-completed={completed}
  data-testid="kefine-header-search"
>
  <kefine-repo-search-icon aria-hidden="true">
    <Icon icon="mdi:magnify" width="17" height="17" aria-hidden="true" />
  </kefine-repo-search-icon>

  <kefine-repo-search-field>
    <kefine-repo-search-meta>
      <lefine-text>Search</lefine-text>
      <kefine-repo-search-status data-testid="kefine-header-search-status">
        <Icon icon={statusIcon} width="13" height="13" aria-hidden="true" />
        <lefine-meta>{status}</lefine-meta>
      </kefine-repo-search-status>
    </kefine-repo-search-meta>

    <input
      data-testid="kefine-task-input"
      type="search"
      data-search-active={active}
      value={value}
      {readonly}
      aria-label={ariaLabel}
      {placeholder}
      onkeydown={(event) => onKeydown?.(event)}
      oninput={(event) => onInput?.(event)}
    />
  </kefine-repo-search-field>
</label>

<style>
  .kefine-repo-search {
    position: relative;
    display: grid;
    grid-template-columns: 1.9rem minmax(0, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-width: 0;
    min-height: 2.25rem;
    overflow: hidden;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.25rem;
    background: color-mix(in oklab, var(--kef-bg-card) 97%, white 3%);
    padding: 0.25rem 0.5rem 0.25rem 0.35rem;
    color: var(--lefine-text);
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .kefine-repo-search::after {
    content: '';
    position: absolute;
    right: 0.45rem;
    bottom: 0;
    left: 0.45rem;
    height: 1px;
    background: transparent;
    transform: translateX(-115%);
  }

  .kefine-repo-search[data-search-active='true'] {
    border-color: color-mix(in oklab, var(--kef-success) 44%, var(--kef-line-soft));
    background: color-mix(in oklab, var(--kef-success) 7%, var(--kef-bg-card));
  }

  .kefine-repo-search[data-search-active='true']::after {
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in oklab, var(--kef-success) 74%, transparent),
      transparent
    );
    animation: kefine-search-scan 1.35s var(--kef-ease-soft) infinite;
  }

  .kefine-repo-search[data-search-completed='true']::after {
    background: var(--kef-success);
    transform: translateX(0);
    animation: none;
  }

  .kefine-repo-search:focus-within {
    border-color: color-mix(in oklab, var(--kef-primary) 46%, var(--kef-line-soft));
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--kef-primary) 14%, transparent);
  }

  kefine-repo-search-icon {
    display: grid;
    place-items: center;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 0.2rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 72%, var(--kef-bg-card));
    color: var(--lefine-text-soft);
  }

  .kefine-repo-search[data-search-active='true'] kefine-repo-search-icon {
    color: var(--kef-success);
    animation: kefine-search-pulse 1.2s var(--kef-ease-soft) infinite;
  }

  .kefine-repo-search[data-search-completed='true'] kefine-repo-search-icon {
    animation: none;
  }

  kefine-repo-search-field {
    display: grid;
    gap: 0.05rem;
    min-width: 0;
  }

  kefine-repo-search-meta {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.55rem;
    align-items: center;
    min-width: 0;
    color: var(--lefine-text-soft);
    font-size: 0.72rem;
    line-height: 1.1;
  }

  kefine-repo-search-meta > lefine-text {
    font-weight: 650;
  }

  kefine-repo-search-status {
    display: inline-flex;
    align-items: center;
    justify-self: end;
    gap: 0.25rem;
    min-width: 0;
    color: var(--lefine-text-soft);
  }

  kefine-repo-search-status lefine-meta {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  input {
    width: 100%;
    min-width: 0;
    min-height: 1.28rem;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--lefine-text);
    padding: 0;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
  }

  input::placeholder {
    color: color-mix(in oklab, var(--lefine-text-soft) 72%, transparent);
  }

  input::-webkit-search-decoration,
  input::-webkit-search-cancel-button {
    display: none;
  }

  @keyframes kefine-search-scan {
    from { transform: translateX(-115%); }
    to { transform: translateX(115%); }
  }

  @keyframes kefine-search-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.58; }
  }

  @media (prefers-reduced-motion: reduce) {
    .kefine-repo-search,
    .kefine-repo-search::after,
    kefine-repo-search-icon {
      animation: none;
      transition: none;
    }
  }
</style>

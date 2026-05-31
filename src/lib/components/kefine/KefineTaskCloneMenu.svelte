<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import type { OrderView } from './kefine-workflow';
  import {
    getTaskRepository,
    getTaskRepositoryArchiveTargets,
    getTaskRepositoryCloneTarget,
    getTaskRepositoryLinkTarget,
    type TaskCloneFormat
  } from './kefine-task-clone';

  let {
    order,
    canSaveLocally = false,
    repositoriesEnabled = true,
    onExport,
    onSaveLocally
  }: {
    order: OrderView | null;
    canSaveLocally?: boolean;
    repositoriesEnabled?: boolean;
    onExport: (format: TaskCloneFormat) => void;
    onSaveLocally?: (runLocally: boolean) => void;
  } = $props();

  let menuOpen = $state(false);
  let runLocally = $state(false);
  let rootElement = $state<HTMLElement | null>(null);
  let copiedValue = $state<string | null>(null);
  let copiedTimeout = $state<number | null>(null);

  const repository = $derived(repositoriesEnabled && order ? getTaskRepository(order) : null);
  const repositoryCloneTarget = $derived(repositoriesEnabled && order ? getTaskRepositoryCloneTarget(order) : null);
  const repositoryLinkTarget = $derived(repositoriesEnabled && order ? getTaskRepositoryLinkTarget(order) : null);
  const repositoryArchiveTargets = $derived(repositoriesEnabled && order ? getTaskRepositoryArchiveTargets(order) : null);
  const repositoryArchiveActions = $derived.by(() =>
    repositoryArchiveTargets
      ? [
          { label: 'zip', href: repositoryArchiveTargets.zip },
          { label: 'tar.gz', href: repositoryArchiveTargets.tarGz },
          { label: 'tar.zst', href: repositoryArchiveTargets.tarZst }
        ]
      : []
  );
  const taskExportActions = ['txt', 'md', 'org'] as const;

  function closeMenu() {
    menuOpen = false;
  }

  function toggleMenu() {
    if (!order) {
      return;
    }

    menuOpen = !menuOpen;
  }

  function handleExport(format: TaskCloneFormat) {
    if (!order) {
      return;
    }

    onExport(format);
    closeMenu();
  }

  function handleSave() {
    if (!canSaveLocally || !onSaveLocally) {
      return;
    }

    onSaveLocally(runLocally);
    closeMenu();
  }

  async function copyText(value: string) {
    if (!browser || !value.trim()) {
      return;
    }

    await navigator.clipboard.writeText(value);
    copiedValue = value;

    if (copiedTimeout) {
      window.clearTimeout(copiedTimeout);
    }

    copiedTimeout = window.setTimeout(() => {
      copiedValue = null;
      copiedTimeout = null;
    }, 1800);
  }

  $effect(() => {
    if (!browser || !menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!rootElement?.contains(target)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  });

  $effect(() => {
    return () => {
      if (copiedTimeout) {
        window.clearTimeout(copiedTimeout);
      }
    };
  });
</script>

<kefine-clone-menu bind:this={rootElement}>
  <button
    type="button"
    data-part="clone-trigger"
    onclick={toggleMenu}
    aria-haspopup="menu"
    aria-expanded={menuOpen}
    aria-label="Clone task"
    title="Clone task"
    disabled={!order}
  >
    <Icon
      icon={menuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
      width="16"
      height="16"
      aria-hidden="true"
    />
    <lefine-text>Clone</lefine-text>
  </button>

  {#if menuOpen && order}
    <kefine-clone-popover role="menu" aria-label="Clone task">
      {#if repository}
        <kefine-clone-section>
          {#if repositoryCloneTarget}
            <kefine-clone-target>
              <kefine-clone-target-copy>
                <strong>{repositoryCloneTarget.label}</strong>
                <code>{repositoryCloneTarget.command}</code>
                <small>{repositoryCloneTarget.url}</small>
              </kefine-clone-target-copy>
              <button
                type="button"
                data-part="icon-copy"
                onclick={() => copyText(repositoryCloneTarget.command)}
                aria-label="Copy git clone command"
                title="Copy git clone command"
              >
                <Icon
                  icon={copiedValue === repositoryCloneTarget.command ? 'mdi:check' : 'mdi:content-copy'}
                  width="16"
                  height="16"
                  aria-hidden="true"
                />
              </button>
            </kefine-clone-target>
          {:else if repositoryLinkTarget}
            <kefine-clone-target>
              <kefine-clone-target-copy>
                <strong>{repositoryLinkTarget.label}</strong>
                <code>{repositoryLinkTarget.url}</code>
              </kefine-clone-target-copy>
              <button
                type="button"
                data-part="icon-copy"
                onclick={() => copyText(repositoryLinkTarget.url)}
                aria-label="Copy repository link"
                title="Copy repository link"
              >
                <Icon
                  icon={copiedValue === repositoryLinkTarget.url ? 'mdi:check' : 'mdi:content-copy'}
                  width="16"
                  height="16"
                  aria-hidden="true"
                />
              </button>
            </kefine-clone-target>
          {/if}
        </kefine-clone-section>
      {/if}

      {#if repositoryArchiveActions.length > 0}
        <kefine-clone-section>
          <strong>Repository archive</strong>
          <kefine-clone-format-grid>
            {#each repositoryArchiveActions as action}
              <a href={action.href} rel="noreferrer">{action.label}</a>
            {/each}
          </kefine-clone-format-grid>
        </kefine-clone-section>
      {/if}

      <kefine-clone-section>
        <strong>{repository ? 'Task exports' : 'Download package'}</strong>
        <kefine-clone-format-grid>
          {#each taskExportActions as format}
            <button type="button" onclick={() => handleExport(format)}>{format}</button>
          {/each}
        </kefine-clone-format-grid>
      </kefine-clone-section>

      {#if canSaveLocally && onSaveLocally}
        <kefine-clone-section>
          <strong>Save to my tasks</strong>
          <label data-part="run-checkbox">
            <input bind:checked={runLocally} type="checkbox" />
            <lefine-text>Run locally</lefine-text>
          </label>
          <button type="button" data-part="save-action" onclick={handleSave}>
            {runLocally ? 'Save and run' : 'Save'}
          </button>
        </kefine-clone-section>
      {/if}
    </kefine-clone-popover>
  {/if}
</kefine-clone-menu>

<style>
  kefine-clone-menu {
    position: relative;
    display: inline-flex;
  }

  button[data-part='clone-trigger'] {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.35rem;
    padding: 0.55rem 0.9rem;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 84%, transparent);
    font: inherit;
    font-weight: 600;
  }

  kefine-clone-popover {
    position: absolute;
    top: calc(100% + 0.55rem);
    right: 0;
    z-index: 15;
    display: grid;
    gap: 0.9rem;
    width: min(24rem, calc(100vw - 1rem));
    max-width: calc(100vw - 1rem);
    padding: 0.95rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 82%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 97%, white 3%);
    box-shadow: 0 1rem 2.5rem color-mix(in oklab, #3d2815 16%, transparent);
    box-sizing: border-box;
  }

  kefine-clone-section {
    display: grid;
    gap: 0.7rem;
  }

  kefine-clone-section strong {
    font-size: 0.9rem;
  }

  kefine-clone-target {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.7rem;
    padding: 0.75rem;
    border-radius: 0.85rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 84%, white 16%);
  }

  kefine-clone-target-copy {
    display: grid;
    gap: 0.3rem;
  }

  kefine-clone-target-copy code {
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 0.8rem;
    line-height: 1.48;
  }

  kefine-clone-target-copy small {
    color: color-mix(in oklab, var(--lefine-text, #453323) 68%, transparent);
    font-size: 0.74rem;
    line-height: 1.42;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  kefine-clone-format-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  kefine-clone-format-grid button,
  kefine-clone-format-grid a,
  button[data-part='save-action'] {
    width: 100%;
    min-width: 0;
    min-height: 2.5rem;
    padding: 0.55rem 0.8rem;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: inherit;
    font: inherit;
    font-weight: 600;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    text-align: center;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  label[data-part='run-checkbox'] {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.92rem;
  }

  button[data-part='save-action'] {
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 14%, white);
  }

  button[data-part='icon-copy'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    min-width: 2.5rem;
    min-height: 2.5rem;
    padding: 0;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: inherit;
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='clone-trigger'],
  :global(:root[data-kefine-theme='dark']) kefine-clone-popover,
  :global(:root[data-kefine-theme='dark']) kefine-clone-target,
  :global(:root[data-kefine-theme='dark']) kefine-clone-format-grid button,
  :global(:root[data-kefine-theme='dark']) kefine-clone-format-grid a,
  :global(:root[data-kefine-theme='dark']) button[data-part='icon-copy'],
  :global(:root[data-kefine-theme='dark']) button[data-part='save-action'] {
    color: #eadcc7;
    border-color: color-mix(in oklab, #d3a45c 36%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 92%, #3a2818 8%);
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='save-action'] {
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 18%, var(--kef-bg-card, #22170f));
  }

  @media (max-width: 380px) {
    kefine-clone-format-grid {
      grid-template-columns: 1fr;
    }

    kefine-clone-target {
      grid-template-columns: 1fr;
    }

    kefine-clone-popover {
      width: min(22rem, calc(100vw - 1rem));
    }
  }
</style>

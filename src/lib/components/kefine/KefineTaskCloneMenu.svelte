<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import type { OrderView } from './kefine-workflow';
  import type { TaskCloneFormat } from './kefine-task-clone';

  let {
    order,
    canSaveLocally = false,
    onExport,
    onSaveLocally
  }: {
    order: OrderView | null;
    canSaveLocally?: boolean;
    onExport: (format: TaskCloneFormat) => void;
    onSaveLocally?: (runLocally: boolean) => void;
  } = $props();

  let menuOpen = $state(false);
  let runLocally = $state(false);
  let rootElement = $state<HTMLElement | null>(null);

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
</script>

<kefine-clone-menu bind:this={rootElement}>
  <button
    type="button"
    data-part="clone-trigger"
    onclick={toggleMenu}
    aria-haspopup="menu"
    aria-expanded={menuOpen}
    disabled={!order}
  >
    <Icon icon="mdi:source-branch" width="16" height="16" aria-hidden="true" />
    <span>Clone</span>
  </button>

  {#if menuOpen && order}
    <kefine-clone-popover role="menu" aria-label="Clone task">
      <kefine-clone-section>
        <strong>Download package</strong>
        <kefine-clone-format-grid>
          <button type="button" onclick={() => handleExport('txt')}>txt</button>
          <button type="button" onclick={() => handleExport('md')}>md</button>
          <button type="button" onclick={() => handleExport('org')}>org</button>
        </kefine-clone-format-grid>
      </kefine-clone-section>

      {#if canSaveLocally && onSaveLocally}
        <kefine-clone-section>
          <strong>Save to my tasks</strong>
          <label data-part="run-checkbox">
            <input bind:checked={runLocally} type="checkbox" />
            <span>Run locally</span>
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
    width: min(18rem, calc(100vw - 1rem));
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

  kefine-clone-format-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  kefine-clone-format-grid button,
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

  :global(:root[data-kefine-theme='dark']) button[data-part='clone-trigger'],
  :global(:root[data-kefine-theme='dark']) kefine-clone-popover,
  :global(:root[data-kefine-theme='dark']) kefine-clone-format-grid button,
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
  }
</style>

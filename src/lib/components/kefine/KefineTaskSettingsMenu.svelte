<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { normalizeProfileResourceSlug } from '$lib/profile/profile-handles';
  import type { OrderView } from './kefine-workflow';

  let {
    order,
    onApply
  }: {
    order: OrderView | null;
    onApply: (patch: Partial<Pick<OrderView, 'shareId' | 'isPublicTask'>>) => void;
  } = $props();

  let menuOpen = $state(false);
  let rootElement = $state<HTMLElement | null>(null);
  let slugDraft = $state('');
  let isPublicDraft = $state(false);

  function syncDrafts() {
    slugDraft = order?.shareId?.trim() && order.shareId !== order.id ? order.shareId.trim() : '';
    isPublicDraft = order?.isPublicTask === true;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function toggleMenu() {
    if (!order) {
      return;
    }

    if (!menuOpen) {
      syncDrafts();
    }

    menuOpen = !menuOpen;
  }

  function applySettings() {
    if (!order) {
      return;
    }

    const normalizedSlug = normalizeProfileResourceSlug(slugDraft);
    onApply({
      shareId: normalizedSlug || order.id,
      isPublicTask: isPublicDraft
    });
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

<kefine-task-settings bind:this={rootElement}>
  <button
    type="button"
    data-part="settings-trigger"
    onclick={toggleMenu}
    aria-haspopup="dialog"
    aria-expanded={menuOpen}
    disabled={!order}
    title="Task settings"
  >
    <Icon icon="mdi:cog-outline" width="18" height="18" aria-hidden="true" />
  </button>

  {#if menuOpen && order}
    <kefine-task-settings-popover role="dialog" aria-label="Task settings">
      <kefine-task-settings-section>
        <strong>Settings</strong>
        <label data-part="field">
          <lefine-text>Slug</lefine-text>
          <input
            bind:value={slugDraft}
            type="text"
            placeholder="task-name"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <label data-part="toggle">
          <input bind:checked={isPublicDraft} type="checkbox" />
          <lefine-text>Make public</lefine-text>
        </label>
        <button type="button" data-part="apply" onclick={applySettings}>Save</button>
      </kefine-task-settings-section>
    </kefine-task-settings-popover>
  {/if}
</kefine-task-settings>

<style>
  kefine-task-settings {
    position: relative;
    display: inline-flex;
  }

  button[data-part='settings-trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.35rem;
    height: 2.35rem;
    padding: 0;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 84%, transparent);
  }

  kefine-task-settings-popover {
    position: absolute;
    top: calc(100% + 0.55rem);
    right: 0;
    z-index: 15;
    width: min(18rem, calc(100vw - 1rem));
    max-width: calc(100vw - 1rem);
    padding: 0.95rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 82%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 97%, white 3%);
    box-shadow: 0 1rem 2.5rem color-mix(in oklab, #3d2815 16%, transparent);
    box-sizing: border-box;
  }

  kefine-task-settings-section {
    display: grid;
    gap: 0.75rem;
  }

  kefine-task-settings-section strong {
    font-size: 0.9rem;
  }

  label[data-part='field'] {
    display: grid;
    gap: 0.35rem;
  }

  label[data-part='field'] lefine-text,
  label[data-part='toggle'] lefine-text {
    font-size: 0.92rem;
    font-weight: 600;
  }

  label[data-part='field'] input {
    min-width: 0;
    min-height: 2.45rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: inherit;
    font: inherit;
  }

  label[data-part='toggle'] {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  button[data-part='apply'] {
    min-height: 2.5rem;
    padding: 0.55rem 0.8rem;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 14%, white);
    color: inherit;
    font: inherit;
    font-weight: 600;
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='settings-trigger'],
  :global(:root[data-kefine-theme='dark']) kefine-task-settings-popover,
  :global(:root[data-kefine-theme='dark']) label[data-part='field'] input,
  :global(:root[data-kefine-theme='dark']) button[data-part='apply'] {
    color: #eadcc7;
    border-color: color-mix(in oklab, #d3a45c 36%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 92%, #3a2818 8%);
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='apply'] {
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 18%, var(--kef-bg-card, #22170f));
  }
</style>

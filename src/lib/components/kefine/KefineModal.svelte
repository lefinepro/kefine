<script lang="ts">
  import type { Snippet } from 'svelte';

  let dialogEl: HTMLDialogElement | undefined = $state();

  let {
    open,
    onClose,
    closeLabel = 'Close',
    showClose = true,
    width = 'min(34rem, calc(100vw - 2rem))',
    children
  }: {
    open: boolean;
    onClose: () => void;
    closeLabel?: string;
    showClose?: boolean;
    width?: string;
    children?: Snippet;
  } = $props();

  $effect(() => {
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      dialogEl.showModal();
      return;
    }

    if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });

  function requestClose() {
    if (dialogEl?.open) {
      dialogEl.close();
      return;
    }

    onClose();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialogEl) {
      requestClose();
    }
  }
</script>

<dialog
  class="kefine-modal-shell"
  bind:this={dialogEl}
  onclose={onClose}
  onclick={handleBackdropClick}
  style={`--kefine-modal-width: ${width};`}
>
  {#if showClose}
    <button
      type="button"
      class="kefine-modal-shell__close"
      data-variant="close"
      aria-label={closeLabel}
      onclick={requestClose}
    >
      ✕
    </button>
  {/if}

  <lefine-box class="kefine-modal-shell__body">
    {@render children?.()}
  </lefine-box>
</dialog>

<style>
  .kefine-modal-shell {
    width: var(--kefine-modal-width);
    border: none;
    border-radius: 1.25rem;
    padding: 0;
    margin: auto;
    background: color-mix(in oklab, var(--kef-bg-card, #fff) 96%, white);
    color: inherit;
    box-shadow: 0 1.25rem 3rem color-mix(in oklab, var(--lefine-text, #2e2317) 12%, transparent);
  }

  .kefine-modal-shell::backdrop {
    background: rgba(15, 23, 42, 0.32);
    backdrop-filter: blur(4px);
  }

  .kefine-modal-shell__close {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    z-index: 1;
    display: inline-flex;
  }

  .kefine-modal-shell__body {
    position: relative;
    padding: 1.1rem 1.2rem 1.2rem;
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let dialogEl: HTMLDialogElement | undefined = $state();

  let {
    open,
    onClose,
    closeLabel = 'Close',
    showClose = true,
    width = 'default',
    tone = 'default',
    children
  }: {
    open: boolean;
    onClose: () => void;
    closeLabel?: string;
    showClose?: boolean;
    width?: 'narrow' | 'default' | 'medium' | 'wide' | 'xwide';
    tone?: 'default' | 'dark';
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
  data-tone={tone}
  data-width={width}
  bind:this={dialogEl}
  onclose={onClose}
  onclick={handleBackdropClick}
>
  {#if showClose}
    <button
      type="button"
      data-variant="close"
      aria-label={closeLabel}
      onclick={requestClose}
    >
      ✕
    </button>
  {/if}

  <lef-modal-body>
    {@render children?.()}
  </lef-modal-body>
</dialog>

<style>
  dialog {
    width: min(34rem, calc(100vw - 2rem));
    border: none;
    border-radius: 1.25rem;
    padding: 0;
    margin: auto;
    background: color-mix(in oklab, var(--kef-bg-card, #fff) 96%, white);
    color: inherit;
    box-shadow: 0 1.25rem 3rem color-mix(in oklab, var(--lefine-text, #2e2317) 12%, transparent);
  }

  dialog[data-tone='dark'] {
    background: color-mix(in oklab, #17110d 96%, black 4%);
    color: color-mix(in oklab, #ead7b3 84%, white 16%);
    box-shadow: 0 1.25rem 3rem color-mix(in oklab, black 38%, transparent);
  }

  dialog[data-width='narrow'] {
    width: min(30rem, calc(100vw - 2rem));
  }

  dialog[data-width='medium'] {
    width: min(32rem, calc(100vw - 2rem));
  }

  dialog[data-width='wide'] {
    width: min(42rem, calc(100vw - 2rem));
  }

  dialog[data-width='xwide'] {
    width: min(58rem, calc(100vw - 2rem));
  }

  dialog::backdrop {
    background: rgba(15, 23, 42, 0.32);
    backdrop-filter: blur(4px);
  }

  dialog > button[data-variant='close'] {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    z-index: 1;
    display: inline-flex;
  }

  lef-modal-body {
    display: block;
    position: relative;
    padding: 1.1rem 1.2rem 1.2rem;
  }
</style>

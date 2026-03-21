<script lang="ts">
  let dialogEl: HTMLDialogElement | undefined = $state();

  let {
    open,
    title,
    description,
    walletTitle,
    walletDetail,
    passkeyTitle,
    passkeyDetail,
    closeLabel,
    onClose,
    onWallet,
    onPasskey
  }: {
    open: boolean;
    title: string;
    description: string;
    walletTitle: string;
    walletDetail: string;
    passkeyTitle: string;
    passkeyDetail: string;
    closeLabel: string;
    onClose: () => void;
    onWallet: () => void;
    onPasskey: () => void;
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
</script>

<dialog class="kefine-auth-dialog" bind:this={dialogEl} onclose={onClose}>
  <header class="kefine-auth-dialog__header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <button type="button" data-variant="close" aria-label={closeLabel} onclick={onClose}>✕</button>
  </header>

  <section class="kefine-auth-dialog__actions">
    <button type="button" class="kefine-auth-dialog__action" onclick={onWallet}>
      <strong>{walletTitle}</strong>
      <span>{walletDetail}</span>
    </button>

    <button type="button" class="kefine-auth-dialog__action" onclick={onPasskey}>
      <strong>{passkeyTitle}</strong>
      <span>{passkeyDetail}</span>
    </button>
  </section>
</dialog>

<style>
  .kefine-auth-dialog {
    width: min(34rem, calc(100vw - 2rem));
    border: none;
    border-radius: 0.72rem;
    padding: 0;
    margin: auto;
    background: color-mix(in oklab, var(--kef-bg-card, #f4ead8) 96%, white);
    color: var(--kef-text, #2e2317);
    box-shadow: 0 1rem 2.5rem rgba(17, 24, 39, 0.18);
  }

  .kefine-auth-dialog::backdrop {
    background: rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(2px);
  }

  .kefine-auth-dialog__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .kefine-auth-dialog__header {
    padding: 1.25rem 1.25rem 0;
  }

  .kefine-auth-dialog__header h2 {
    margin: 0 0 0.35rem;
  }

  .kefine-auth-dialog__header p {
    margin: 0;
    opacity: 0.72;
  }

  .kefine-auth-dialog__actions {
    display: grid;
    gap: 0.85rem;
    padding: 1.25rem;
  }

  .kefine-auth-dialog__action {
    display: grid;
    gap: 0.35rem;
    text-align: left;
    border: 1px solid color-mix(in oklab, var(--kef-border, #b8a07a) 38%, transparent);
    border-radius: 0.72rem;
    padding: 1rem 1.05rem;
    background: color-mix(in oklab, var(--kef-bg-card, #fff) 92%, transparent);
    color: var(--kef-text, #2e2317);
  }

  .kefine-auth-dialog__action span {
    opacity: 0.72;
  }
</style>

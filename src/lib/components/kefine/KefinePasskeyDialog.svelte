<script lang="ts">
  import PasskeyLogin from '$lib/components/passkeys/PasskeyLogin.svelte';
  import type { PasskeyAuthSuccess } from '$lib/auth/routes';

  let dialogEl: HTMLDialogElement | undefined = $state();

  let {
    open,
    title,
    closeLabel,
    onClose,
    onSuccess,
    onError
  }: {
    open: boolean;
    title: string;
    closeLabel: string;
    onClose: () => void;
    onSuccess: (session: PasskeyAuthSuccess) => void;
    onError: (error: Error | string) => void;
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

<dialog class="kefine-passkey-dialog" bind:this={dialogEl} onclose={onClose}>
  <header class="kefine-passkey-dialog__header">
    <h2>{title}</h2>
    <button type="button" data-variant="close" aria-label={closeLabel} onclick={onClose}>✕</button>
  </header>

  <PasskeyLogin
    title={title}
    description="Enter a username once to bind a new passkey to your profile."
    showLogin={false}
    showRegistration={true}
    onSuccess={onSuccess}
    onError={(error) => {
      onError(error instanceof Error ? error.message : error);
    }}
  />
</dialog>

<style>
  .kefine-passkey-dialog {
    width: min(34rem, calc(100vw - 2rem));
    border: none;
    border-radius: 1.5rem;
    padding: 1.25rem;
    background: color-mix(in srgb, var(--kefine-surface, #fff) 92%, #f2e3c2 8%);
    color: inherit;
    box-shadow: 0 1.5rem 4rem rgba(17, 24, 39, 0.22);
  }

  .kefine-passkey-dialog::backdrop {
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(6px);
  }

  .kefine-passkey-dialog__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .kefine-passkey-dialog__header h2 {
    margin: 0;
  }
</style>

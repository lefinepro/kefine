<script lang="ts">
  import Icon from '@iconify/svelte';
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';
  import KefineWalletProviderGrid from '$lib/components/kefine/KefineWalletProviderGrid.svelte';
  let {
    open,
    title,
    description,
    walletTitle,
    passkeyTitle,
    localhostTitle,
    showLocalhost,
    closeLabel,
    onClose,
    onWallet,
    onPasskey,
    onLocalhost
  }: {
    open: boolean;
    title: string;
    description: string;
    walletTitle: string;
    passkeyTitle: string;
    localhostTitle: string;
    showLocalhost: boolean;
    closeLabel: string;
    onClose: () => void;
    onWallet: () => void;
    onPasskey: () => void;
    onLocalhost: () => void;
  } = $props();

</script>

<KefineModal open={open} onClose={onClose} closeLabel={closeLabel}>
  <header class="kefine-auth-dialog__header">
    <lefine-box>
      <h2>{title}</h2>
      <p>{description}</p>
    </lefine-box>
  </header>

  <section class="kefine-auth-dialog__actions">
    <button type="button" class="kefine-auth-tile kefine-auth-tile--wallet" onclick={onWallet}>
      <lefine-box class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">
        <KefineWalletProviderGrid />
      </lefine-box>
      <strong>{walletTitle}</strong>
    </button>

    <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey" onclick={onPasskey}>
      <lefine-box class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
        <lefine-text class="kefine-auth-icon">
          <Icon icon="mdi:fingerprint" width="100%" height="100%" aria-hidden="true" />
        </lefine-text>
      </lefine-box>
      <strong>{passkeyTitle}</strong>
    </button>

    {#if showLocalhost}
      <button type="button" class="kefine-auth-tile kefine-auth-tile--localhost" onclick={onLocalhost}>
        <lefine-box class="kefine-auth-hero kefine-auth-hero--localhost" aria-hidden="true">
          <lefine-text class="kefine-auth-icon">
            <Icon icon="mdi:laptop" width="100%" height="100%" aria-hidden="true" />
          </lefine-text>
        </lefine-box>
        <strong>{localhostTitle}</strong>
      </button>
    {/if}
  </section>
</KefineModal>

<style>
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 1.25rem;
  }

  .kefine-auth-tile {
    display: grid;
    gap: 0.45rem;
    align-content: start;
    justify-items: center;
    min-height: 11rem;
    text-align: center;
    border: 0;
    border-radius: 0.95rem;
    padding: 0.9rem;
    background: color-mix(in oklab, var(--kef-bg-card, #fff) 96%, white);
    color: var(--lefine-text, #2e2317);
    box-shadow: 0 6px 16px color-mix(in oklab, var(--lefine-text, #2e2317) 6%, transparent);
  }

  .kefine-auth-tile lefine-text {
    opacity: 0.72;
  }

  .kefine-auth-hero {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 7.2rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg, #f0e5d4) 70%, white);
  }

  .kefine-auth-hero--wallet,
  .kefine-auth-hero--passkey {
    background: transparent;
  }

  .kefine-auth-icon {
    width: min(100%, 6rem);
    min-height: min(100%, 6rem);
    color: var(--kef-primary, #6f5540);
  }

  :global(.kefine-auth-icon svg) {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 640px) {
    .kefine-auth-dialog__actions {
      grid-template-columns: 1fr;
    }
  }
</style>

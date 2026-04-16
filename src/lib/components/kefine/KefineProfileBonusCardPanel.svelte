<script lang="ts">
  import KefineProfileCardInput from '$lib/components/kefine/KefineProfileCardInput.svelte';
  import type { ProfileCardVerification } from '$lib/types/user';

  let {
    mode = 'setup',
    cardStepTitle = 'Card bonus',
    bonusTitle = 'Get a $100 bonus',
    bonusText = 'Verify a bank card tied to an Armenian bank. The bonus is added to your profile balance after BIN validation.',
    cardHint = '',
    bankLabel = 'Armenian banks',
    cardNumber = $bindable(''),
    holderName = 'LEFINE',
    verifyLabel = 'Verify card',
    skipLabel = 'Skip for now',
    status,
    onVerify = () => {},
    onSkip = () => {}
  }: {
    mode?: 'setup' | 'summary';
    cardStepTitle?: string;
    bonusTitle?: string;
    bonusText?: string;
    cardHint?: string;
    bankLabel?: string;
    cardNumber?: string;
    holderName?: string;
    verifyLabel?: string;
    skipLabel?: string;
    status?: ProfileCardVerification | null;
    onVerify?: () => void;
    onSkip?: () => void;
  } = $props();
</script>

{#if mode === 'setup'}
  <kefine-profile-bonus-panel data-mode="setup">
    <kefine-profile-bonus-copy>
      <small>{cardStepTitle}</small>
      <h2>{bonusTitle}</h2>
      <p>{bonusText}</p>
    </kefine-profile-bonus-copy>

    <kefine-profile-bonus-card>
      <KefineProfileCardInput
        bind:cardNumber
        title={bonusTitle}
        description={bonusText}
        {holderName}
        {verifyLabel}
        {skipLabel}
        status={status ?? undefined}
        {onVerify}
        {onSkip}
      />
    </kefine-profile-bonus-card>
  </kefine-profile-bonus-panel>
{:else}
  <kefine-profile-bonus-panel data-mode="summary">
    <kefine-profile-bonus-summary>
      <small>{bankLabel}</small>
      <strong>{bonusTitle}</strong>
      <p>{cardHint || bonusText}</p>
    </kefine-profile-bonus-summary>

    {#if status}
      <kefine-profile-bonus-status data-status={status.status}>
        <strong>{status.bankName ?? 'Unknown bank'}</strong>
        <span>{status.countryName ?? 'Unknown country'} · BIN {status.bin}</span>
        {#if status.rejectionReason}
          <small>{status.rejectionReason}</small>
        {/if}
      </kefine-profile-bonus-status>
    {/if}
  </kefine-profile-bonus-panel>
{/if}

<style>
  kefine-profile-bonus-panel,
  kefine-profile-bonus-copy,
  kefine-profile-bonus-card,
  kefine-profile-bonus-summary,
  kefine-profile-bonus-status {
    display: grid;
    gap: 0.65rem;
  }

  kefine-profile-bonus-panel[data-mode='setup'] {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    gap: 1rem;
    align-items: start;
  }

  kefine-profile-bonus-copy,
  kefine-profile-bonus-card,
  kefine-profile-bonus-summary,
  kefine-profile-bonus-status {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg, #f4ead3) 45%, var(--kef-color-bg-card, #fbf3e3));
    border: 1px solid color-mix(in oklab, var(--kef-color-text, #3d3125) 8%, transparent);
  }

  kefine-profile-bonus-copy h2,
  kefine-profile-bonus-copy p,
  kefine-profile-bonus-summary strong,
  kefine-profile-bonus-summary p,
  kefine-profile-bonus-summary small,
  kefine-profile-bonus-status strong,
  kefine-profile-bonus-status span,
  kefine-profile-bonus-status small {
    margin: 0;
  }

  kefine-profile-bonus-copy small,
  kefine-profile-bonus-summary small,
  kefine-profile-bonus-status span,
  kefine-profile-bonus-status small {
    color: var(--kef-color-muted, #7a6a57);
  }

  kefine-profile-bonus-status[data-status='verified'] {
    background: color-mix(in oklab, var(--kef-color-success, #7aa35a) 16%, var(--kef-color-bg-card, #fbf3e3));
  }

  kefine-profile-bonus-status[data-status='rejected'] {
    background: color-mix(in oklab, var(--kef-color-error, #bf6d5f) 12%, var(--kef-color-bg-card, #fbf3e3));
  }

  @media (max-width: 980px) {
    kefine-profile-bonus-panel[data-mode='setup'] {
      grid-template-columns: 1fr;
    }
  }
</style>

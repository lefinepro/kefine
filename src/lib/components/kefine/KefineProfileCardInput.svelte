<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getCardBrandPresentation } from '$lib/profile/profile-accounts';
  import type { ProfileCardVerification } from '$lib/types/user';

  let {
    eyebrow,
    title,
    description,
    cardNumber = $bindable(''),
    holderName,
    verifyLabel,
    verifyDisabled = false,
    skipLabel,
    status,
    onVerify,
    onSkip
  }: {
    eyebrow?: string;
    title: string;
    description: string;
    cardNumber: string;
    holderName: string;
    verifyLabel: string;
    verifyDisabled?: boolean;
    skipLabel?: string;
    status?: ProfileCardVerification;
    onVerify?: () => void;
    onSkip?: () => void;
  } = $props();

  const brandPresentation = $derived(getCardBrandPresentation(cardNumber));
</script>

<section class="profile-card-input-card">
  {#if eyebrow}
    <small>{eyebrow}</small>
  {/if}
  <strong>{title}</strong>
  <p>{description}</p>

  <label class="profile-payment-card profile-payment-card--editable">
    <lefine-box class="profile-payment-card__brand">
      <small>{brandPresentation.label}</small>
      <Icon icon={brandPresentation.icon} width="20" height="20" aria-hidden="true" />
    </lefine-box>
    <input
      class="profile-payment-card__number"
      type="text"
      bind:value={cardNumber}
      inputmode="numeric"
      maxlength="19"
      placeholder="0000 0000 0000 0000"
      aria-label="Bank card number"
    />
    <lefine-text>{holderName}</lefine-text>
  </label>

  <lefine-box class="profile-card-actions" data-has-skip={Boolean(skipLabel && onSkip)}>
    {#if skipLabel && onSkip}
      <button type="button" data-variant="ghost" onclick={onSkip}>
        {skipLabel}
      </button>
    {/if}
    <button type="button" data-variant="primary" onclick={onVerify} disabled={verifyDisabled}>
      {verifyLabel}
    </button>
  </lefine-box>

  {#if status}
    <lefine-box class="profile-card-status" data-status={status.status}>
      <strong>{status.bankName ?? 'Unknown bank'}</strong>
      <lefine-text>{status.countryName ?? 'Unknown country'} · BIN {status.bin}</lefine-text>
      {#if status.rejectionReason}
        <small>{status.rejectionReason}</small>
      {/if}
    </lefine-box>
  {/if}
</section>

<style>
  .profile-card-input-card,
  .profile-card-status {
    display: grid;
    gap: 0.9rem;
  }

  .profile-card-input-card > strong,
  .profile-card-input-card > p,
  .profile-card-input-card > small {
    margin: 0;
  }

  .profile-card-input-card > small {
    color: var(--kef-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .profile-card-input-card > strong {
    font-size: clamp(1.35rem, 2vw, 1.8rem);
    line-height: 1.05;
  }

  .profile-payment-card {
    display: grid;
    gap: 0.7rem;
    padding: 1.2rem 1.3rem;
    border-radius: 1.2rem;
    background:
      linear-gradient(
        135deg,
        color-mix(in oklab, var(--kef-color-primary) 18%, var(--kef-color-bg-card)),
        color-mix(in oklab, var(--kef-color-bg-card) 92%, var(--kef-color-bg))
      );
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 18%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
      0 18px 34px color-mix(in oklab, black 12%, transparent);
  }

  .profile-payment-card--editable {
    cursor: text;
  }

  .profile-payment-card__brand,
  .profile-card-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .profile-payment-card__brand {
    justify-content: space-between;
    color: var(--kef-color-muted);
  }

  .profile-payment-card__number {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--kef-color-text);
    box-shadow: none;
    font-family: inherit;
    line-height: 1.12;
    font-size: clamp(1.5rem, 3vw, 2rem);
    letter-spacing: 0.12em;
    font-weight: 600;
  }

  .profile-payment-card__number::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 92%, transparent);
    opacity: 1;
  }

  .profile-payment-card__number:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .profile-card-actions {
    justify-content: flex-end;
  }

  .profile-card-actions[data-has-skip='true'] {
    justify-content: space-between;
  }

  .profile-card-actions > button:last-child {
    min-width: 10rem;
  }

  .profile-card-status[data-status='verified'] {
    background: color-mix(in oklab, var(--kef-color-success) 16%, var(--kef-color-bg-card));
  }

  .profile-card-status[data-status='rejected'] {
    background: color-mix(in oklab, var(--kef-color-error) 12%, var(--kef-color-bg-card));
  }

  .profile-card-status {
    padding: 0.9rem 1rem;
    border-radius: 1rem;
  }

  @media (max-width: 980px) {
    .profile-card-actions,
    .profile-card-actions[data-has-skip='true'] {
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
    }

    .profile-card-actions > button:last-child {
      min-width: 0;
    }
  }
</style>

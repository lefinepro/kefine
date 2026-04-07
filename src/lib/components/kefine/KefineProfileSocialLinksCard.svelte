<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getCardBrandPresentation, resolveProfileAccountPresentation } from '$lib/profile/profile-accounts';
  import type { ProfileSocialLink } from '$lib/types/user';

  let {
    title,
    valuePlaceholder,
    cardPlaceholder = '0000 0000 0000 0000',
    emptyText = '',
    isOwner,
    links = $bindable<ProfileSocialLink[]>([]),
    cardNumber = $bindable(''),
    onRemove
  }: {
    title: string;
    valuePlaceholder: string;
    cardPlaceholder?: string;
    emptyText?: string;
    isOwner: boolean;
    links: ProfileSocialLink[];
    cardNumber?: string;
    onRemove?: (id: string) => void;
  } = $props();

  let failedFavicons = $state<Record<string, boolean>>({});

  function handleRemove(id: string) {
    links = links.filter((link) => link.id !== id);
    onRemove?.(id);
  }

  function markFaviconFailed(id: string) {
    failedFavicons = { ...failedFavicons, [id]: true };
  }

  const cardPresentation = $derived(getCardBrandPresentation(cardNumber));
</script>

<section class="profile-social-card">
  <lefine-box class="profile-social-card__head">
    <strong>{title}</strong>
  </lefine-box>

  <lefine-box class="profile-social-card__list">
    <lefine-box class="profile-social-card__row profile-social-card__row--card">
      <lefine-box class="profile-social-card__leading">
        <Icon icon={cardPresentation.icon} width="18" height="18" aria-hidden="true" />
      </lefine-box>
      <input bind:value={cardNumber} placeholder={cardPlaceholder} aria-label="Bank card number" />
    </lefine-box>

    {#each links as link (link.id)}
      {@const account = resolveProfileAccountPresentation(link.type, link.value, link.label)}
      <lefine-box class="profile-social-card__row">
        <lefine-box class="profile-social-card__leading">
          {#if account.faviconUrl && !failedFavicons[link.id]}
            <img
              class="profile-social-card__favicon"
              src={account.faviconUrl}
              alt=""
              width="18"
              height="18"
              onerror={() => markFaviconFailed(link.id)}
            />
          {:else}
            <Icon icon={account.icon} width="18" height="18" aria-hidden="true" />
          {/if}
        </lefine-box>
        <input bind:value={link.value} placeholder={valuePlaceholder} aria-label={valuePlaceholder} />
        {#if isOwner}
          <button type="button" data-variant="ghost" aria-label="Remove social link" onclick={() => handleRemove(link.id)}>×</button>
        {/if}
      </lefine-box>
    {/each}

    {#if links.length === 0 && emptyText}
      <p>{emptyText}</p>
    {/if}
  </lefine-box>

  {#if !isOwner && links.length > 0}
    <lefine-box class="profile-social-card__links">
      {#each links as link (link.id)}
        {@const account = resolveProfileAccountPresentation(link.type, link.value, link.label)}
        {#if account.href}
          <a href={account.href} rel="noreferrer" target="_blank">
            {#if account.faviconUrl && !failedFavicons[link.id]}
              <img
                class="profile-social-card__favicon"
                src={account.faviconUrl}
                alt=""
                width="16"
                height="16"
                onerror={() => markFaviconFailed(link.id)}
              />
            {:else}
              <Icon icon={account.icon} width="16" height="16" aria-hidden="true" />
            {/if}
            <lefine-text>{link.value}</lefine-text>
          </a>
        {:else}
          <lefine-box class="profile-social-card__chip">
            <Icon icon={account.icon} width="16" height="16" aria-hidden="true" />
            <lefine-text>{link.value}</lefine-text>
          </lefine-box>
        {/if}
      {/each}
    </lefine-box>
  {/if}
</section>

<style>
  .profile-social-card,
  .profile-social-card__list {
    display: grid;
    gap: 1rem;
  }

  .profile-social-card__head,
  .profile-social-card__row,
  .profile-social-card__links,
  .profile-social-card__leading {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .profile-social-card__head {
    justify-content: flex-start;
    position: relative;
    z-index: 2;
  }

  .profile-social-card__row {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  .profile-social-card__row--card {
    border-color: color-mix(in oklab, var(--kef-color-primary) 18%, transparent);
    background:
      linear-gradient(
        135deg,
        color-mix(in oklab, var(--kef-color-primary) 12%, var(--kef-color-bg-card)),
        color-mix(in oklab, var(--kef-color-bg-card) 92%, var(--kef-color-bg))
      );
  }

  .profile-social-card__leading {
    flex: 0 0 auto;
    width: 1.25rem;
    justify-content: center;
    color: var(--kef-color-muted);
  }

  .profile-social-card__favicon {
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }

  .profile-social-card__row input {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--kef-color-text);
    font-size: clamp(1.2rem, 2vw, 1.7rem);
    line-height: 1.15;
    box-shadow: none;
  }

  .profile-social-card__row input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    opacity: 1;
  }

  .profile-social-card__row input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .profile-social-card__links {
    flex-wrap: wrap;
  }

  .profile-social-card__links a,
  .profile-social-card__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  .profile-social-card a,
  .profile-social-card__chip,
  .profile-social-card p {
    color: inherit;
    margin: 0;
  }

  @media (max-width: 980px) {
    .profile-social-card__row {
      gap: 0.65rem;
    }
  }
</style>

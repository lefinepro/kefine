<script lang="ts">
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { resolveProfileAccountPresentation } from '$lib/profile/profile-accounts';
  import type { ProfileSocialLink } from '$lib/types/user';

  let {
    valuePlaceholder,
    emptyText = '',
    isOwner,
    links = $bindable<ProfileSocialLink[]>([]),
    onRemove
  }: {
    valuePlaceholder: string;
    emptyText?: string;
    isOwner: boolean;
    links: ProfileSocialLink[];
    onRemove?: (id: string) => void;
  } = $props();

  let failedFavicons = $state<Record<string, boolean>>({});
  const localeText = $derived($kefineLocaleText);

  function handleRemove(id: string) {
    links = links.filter((link) => link.id !== id);
    onRemove?.(id);
  }

  function markFaviconFailed(id: string) {
    failedFavicons = { ...failedFavicons, [id]: true };
  }
</script>

<lef-profile-social-card>
  <lef-profile-social-list>
    {#each links as link (link.id)}
      {@const account = resolveProfileAccountPresentation(link.type, link.value, link.label)}
      <lef-profile-social-row>
        <lef-profile-social-leading>
          {#if account.faviconUrl && !failedFavicons[link.id]}
            <img
              src={account.faviconUrl}
              alt=""
              width="18"
              height="18"
              onerror={() => markFaviconFailed(link.id)}
            />
          {:else}
            <Icon icon={account.icon} width="18" height="18" aria-hidden="true" />
          {/if}
        </lef-profile-social-leading>
        <input bind:value={link.value} placeholder={valuePlaceholder} aria-label={valuePlaceholder} />
        {#if isOwner}
          <button type="button" data-variant="ghost" aria-label={localeText.profile.removeSocialLink} onclick={() => handleRemove(link.id)}>×</button>
        {/if}
      </lef-profile-social-row>
    {/each}

    {#if links.length === 0 && emptyText}
      <p>{emptyText}</p>
    {/if}
  </lef-profile-social-list>

  {#if !isOwner && links.length > 0}
    <lef-profile-social-links>
      {#each links as link (link.id)}
        {@const account = resolveProfileAccountPresentation(link.type, link.value, link.label)}
        {#if account.href}
          <a href={account.href} rel="noreferrer" target="_blank">
            {#if account.faviconUrl && !failedFavicons[link.id]}
              <img
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
          <lef-profile-social-chip>
            <Icon icon={account.icon} width="16" height="16" aria-hidden="true" />
            <lefine-text>{link.value}</lefine-text>
          </lef-profile-social-chip>
        {/if}
      {/each}
    </lef-profile-social-links>
  {/if}
</lef-profile-social-card>

<style>
  lef-profile-social-card,
  lef-profile-social-list {
    display: grid;
    gap: 1rem;
  }

  lef-profile-social-row,
  lef-profile-social-links,
  lef-profile-social-leading {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  lef-profile-social-row {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  lef-profile-social-leading {
    flex: 0 0 auto;
    width: 1.25rem;
    justify-content: center;
    color: var(--kef-color-muted);
  }

  lef-profile-social-leading img,
  lef-profile-social-links img {
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }

  lef-profile-social-links img {
    width: 16px;
    height: 16px;
  }

  lef-profile-social-row input {
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

  lef-profile-social-row input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    opacity: 1;
  }

  lef-profile-social-row input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  lef-profile-social-links {
    flex-wrap: wrap;
  }

  lef-profile-social-links a,
  lef-profile-social-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  lef-profile-social-card a,
  lef-profile-social-chip,
  lef-profile-social-card p {
    color: inherit;
    margin: 0;
  }

  @media (max-width: 980px) {
    lef-profile-social-row {
      gap: 0.65rem;
    }
  }
</style>

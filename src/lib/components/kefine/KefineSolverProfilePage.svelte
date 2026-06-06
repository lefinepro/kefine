<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import KefineSolverProfileCard from '$lib/components/kefine/KefineSolverProfileCard.svelte';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { buildLocaleHomePath, localizeAppPath, readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';
  import {
    buildProfilePath,
    deriveWalletProfileHandle,
    ensureProfileForSession,
    getProfileByUsername,
    isDefaultActorHandle
  } from '$lib/profile/profile-storage';
  import {
    buildSolverProfilePath,
    ensureStoredSolverProfile,
    resolveSolverProfileConnection
  } from '$lib/profile/solver-profile';
  import type { Profile } from '$lib/types/user';

  const localeText = $derived($kefineLocaleText);
  const passkeySession = $derived($passkeySessionStore);
  const requestedHandle = $derived(page.params.handle ?? '');
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? 'en');
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));

  let profile = $state<Profile | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let unavailable = $state(false);
  let copyState = $state<'idle' | 'solver-token'>('idle');
  let profileLoadKey = $state('');

  const isOwner = $derived(Boolean(profile && viewerProfile && profile.id === viewerProfile.id));
  const solverConnection = $derived(resolveSolverProfileConnection(profile));
  const profilePath = $derived(
    profile
      ? localizeAppPath(buildProfilePath(profile.primaryHandle), activeLocale)
      : buildLocaleHomePath(activeLocale)
  );

  function buildDefaultActorProfile(): Profile | null {
    const handle = runtimeConfig.defaultActor.handle?.trim();
    if (!handle || !isDefaultActorHandle(requestedHandle, handle)) {
      return null;
    }

    const now = new Date().toISOString();
    return {
      id: `default-profile:${handle}`,
      userId: `default-user:${handle}`,
      username: handle,
      primaryHandle: handle,
      primaryHandleType: 'publickey',
      displayName: runtimeConfig.defaultActor.displayName?.trim() || handle.toUpperCase(),
      bio: '',
      isPublic: true,
      socialLinks: [],
      referralPercent: 10,
      bonusBalanceUsd: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  $effect(() => {
    if (!browser) {
      return;
    }

    const nextProfileLoadKey = [
      requestedHandle,
      authState.email ?? '',
      authState.address ?? '',
      authState.authType ?? '',
      passkeySession?.userId ?? ''
    ].join('|');

    if (nextProfileLoadKey === profileLoadKey) {
      return;
    }

    profileLoadKey = nextProfileLoadKey;
    void loadProfilePageState();
  });

  onMount(() => {
    if (!browser) {
      return;
    }

    hydrateAuthStateFromSession();
    loadPasskeySession();
  });

  async function loadProfilePageState() {
    if (!browser) {
      return;
    }

    const currentPasskeySession = passkeySession;
    const userId = currentPasskeySession?.userId || authState.userId?.trim() || authState.email?.trim().toLowerCase() || authState.address?.trim();
    const walletAddress = authState.address?.trim() || null;
    const walletHandle = walletAddress ? deriveWalletProfileHandle(walletAddress) : null;

    if (userId) {
      viewerProfile = ensureProfileForSession({
        storage: localStorage,
        userId,
        email: authState.email,
        displayName:
          currentPasskeySession?.username ||
          authState.displayName?.trim() ||
          authState.handle?.trim() ||
          authState.email?.split('@')[0] ||
          walletHandle ||
          authState.address ||
          'user',
        avatarUrl: undefined,
        authType: currentPasskeySession ? 'passkey' : authState.authType,
        walletAddress,
        walletAlias: null
      });
    } else {
      viewerProfile = null;
    }

    const storedProfile = getProfileByUsername(localStorage, requestedHandle) ?? buildDefaultActorProfile();
    profile = storedProfile;

    if (!storedProfile) {
      unavailable = true;
      return;
    }

    const ownerViewing = Boolean(viewerProfile && viewerProfile.id === storedProfile.id);
    if (!ownerViewing) {
      unavailable = true;
      return;
    }

    unavailable = false;

    const canonicalPath = buildSolverProfilePath(storedProfile.primaryHandle);
    const currentPath = buildSolverProfilePath(requestedHandle);
    if (canonicalPath !== currentPath) {
      await goto(localizeAppPath(canonicalPath, activeLocale), { replaceState: true });
    }
  }

  function createSolverProfile() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const updated = ensureStoredSolverProfile(localStorage, profile);
    if (updated) {
      profile = updated;
    }
  }

  async function copySolverToken() {
    if (!browser || !navigator.clipboard || !solverConnection.token) {
      return;
    }

    await navigator.clipboard.writeText(solverConnection.token);
    copyState = 'solver-token';
    window.setTimeout(() => {
      if (copyState === 'solver-token') {
        copyState = 'idle';
      }
    }, 1400);
  }
</script>

<svelte:head>
  <title>{profile ? `${localeText.profile.solverProfileTitle} | ${profile.displayName} | Lefine` : 'Solver profile | Lefine'}</title>
</svelte:head>

{#if unavailable}
  <section class="solver-profile-page">
    <article class="solver-profile-unavailable" data-testid="kefine-solver-profile-unavailable">
      <lefine-text class="solver-profile-unavailable__code">404</lefine-text>
      <h1>{localeText.profile.profileUnavailable}</h1>
      <p>{localeText.profile.hidden}</p>
      <a class="solver-profile-link" href={buildLocaleHomePath(activeLocale)}>
        <Icon icon="lucide:arrow-left" aria-hidden="true" />
        <lefine-text>{localeText.topbar.legalLinks.backToApp}</lefine-text>
      </a>
    </article>
  </section>
{:else if profile}
  <section class="solver-profile-page" data-testid="kefine-solver-profile-page">
    <nav class="solver-profile-nav" aria-label={localeText.profile.title}>
      <a class="solver-profile-link" href={profilePath}>
        <Icon icon="lucide:arrow-left" aria-hidden="true" />
        <lefine-text>@{profile.primaryHandle}</lefine-text>
      </a>
    </nav>

    <KefineSolverProfileCard
      text={localeText.profile}
      workspaceHandle={profile.primaryHandle}
      solverHandle={solverConnection.solverHandle}
      token={solverConnection.token}
      endpoint={solverConnection.inboxEndpoint}
      responsesEndpoint={solverConnection.responsesEndpoint}
      authHeader={solverConnection.authorizationHeader}
      created={solverConnection.created}
      copied={copyState === 'solver-token'}
      onCreate={createSolverProfile}
      onCopy={copySolverToken}
    />
  </section>
{/if}

<style>
  .solver-profile-page {
    width: min(76rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: clamp(5.5rem, 12vh, 7rem) 0 3rem;
    display: grid;
    gap: 1rem;
  }

  .solver-profile-nav {
    display: flex;
    justify-content: flex-start;
  }

  .solver-profile-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2.4rem;
    padding: 0.45rem 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 82%, transparent);
    color: var(--kef-color-text);
    font-weight: 650;
    text-decoration: none;
  }

  .solver-profile-link:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary) 30%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 10%, var(--kef-color-bg-card));
    text-decoration: none;
  }

  .solver-profile-link :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }

  .solver-profile-unavailable {
    display: grid;
    justify-items: start;
    gap: 1rem;
    min-height: min(34rem, calc(100vh - 10rem));
    padding: clamp(1.5rem, 4vw, 3rem);
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 22%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 92%, var(--kef-color-bg));
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
      0 24px 60px color-mix(in oklab, black 14%, transparent);
  }

  .solver-profile-unavailable__code {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 24%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 12%, transparent);
    color: var(--kef-color-text);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .solver-profile-unavailable h1,
  .solver-profile-unavailable p {
    margin: 0;
    max-width: 36rem;
  }

  .solver-profile-unavailable p {
    color: var(--kef-color-muted);
  }

  @media (max-width: 640px) {
    .solver-profile-page {
      width: min(100%, calc(100vw - 1rem));
      padding-top: 5rem;
    }
  }
</style>

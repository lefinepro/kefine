<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import KefineServiceEditorPage from '$lib/components/kefine/KefineServiceEditorPage.svelte';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import { deriveWalletProfileHandle, ensureProfileForSession, getProfileByUsername } from '$lib/profile/profile-storage';
  import type { Profile } from '$lib/types/user';

  const passkeySession = $derived($passkeySessionStore);
  let profile = $state<Profile | null>(null);
  const runtimeConfig = $derived(readBrowserPublicRuntimeConfig());

  $effect(() => {
    if (!browser) {
      return;
    }

    hydrateAuthStateFromSession();
    loadPasskeySession();

    const storedProfile = getProfileByUsername(localStorage, page.params.handle ?? '');
    const walletAddress = authState.address?.trim() || null;
    const walletHandle = walletAddress ? deriveWalletProfileHandle(walletAddress) : null;
    const userId = passkeySession?.userId || authState.userId?.trim() || authState.email?.trim().toLowerCase() || walletAddress;
    const viewerProfile = userId
      ? ensureProfileForSession({
          storage: localStorage,
          userId,
          email: authState.email,
          displayName: passkeySession?.username || authState.displayName?.trim() || authState.handle?.trim() || authState.email?.split('@')[0] || walletHandle || authState.address || 'user',
          avatarUrl: undefined,
          authType: passkeySession ? 'passkey' : authState.authType,
          walletAddress,
          walletAlias: null
        })
      : null;

    if (!storedProfile || !viewerProfile || storedProfile.id !== viewerProfile.id) {
      void goto(`/@${page.params.handle}`);
      return;
    }

    profile = storedProfile;
  });
</script>

{#if profile}
  <KefineServiceEditorPage profile={profile} craterBaseUrl={runtimeConfig.backend.craterBaseUrl} />
{/if}

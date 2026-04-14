<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import { buildCanonicalServicePath, deriveWalletProfileHandle, ensureProfileForSession, getProfileByUsername } from '$lib/profile/profile-storage';
  import { fetchTemplateByHandleAndSlug } from '$lib/templates/template-api';
  import type { Profile } from '$lib/types/user';

  const passkeySession = $derived($passkeySessionStore);
  let profile = $state<Profile | null>(null);
  let loadKey = $state('');
  const runtimeConfig = $derived(readBrowserPublicRuntimeConfig());

  $effect(() => {
    async function init() {
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

      const loaded = await fetchTemplateByHandleAndSlug(runtimeConfig.backend.craterBaseUrl, storedProfile.primaryHandle, page.params.slug ?? '');
      if (!loaded) {
        void goto(`/@${page.params.handle}`);
        return;
      }

      profile = storedProfile;
      void goto(buildCanonicalServicePath(storedProfile.primaryHandle, loaded.slug, runtimeConfig.defaultActor.handle), { replaceState: true });
    }

    if (!browser) {
      return;
    }

    hydrateAuthStateFromSession();
    loadPasskeySession();

    const nextLoadKey = [
      page.params.handle ?? '',
      page.params.slug ?? '',
      passkeySession?.userId ?? '',
      authState.email ?? '',
      authState.address ?? '',
      authState.authType ?? ''
    ].join('|');

    if (nextLoadKey === loadKey) {
      return;
    }

    loadKey = nextLoadKey;
    void init();
  });
</script>

<lef-service-redirect-page>
  <p>{profile ? 'Redirecting to the service page…' : 'Loading service…'}</p>
</lef-service-redirect-page>

<style>
  lef-service-redirect-page {
    display: block;
    width: min(42rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 6rem 0 2rem;
  }

  lef-service-redirect-page p {
    margin: 0;
    color: var(--kef-color-muted);
  }
</style>

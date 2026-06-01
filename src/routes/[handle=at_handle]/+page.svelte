<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import KefineProfileHeaderEditor from '$lib/components/kefine/KefineProfileHeaderEditor.svelte';
  import KefineProfileSocialLinksCard from '$lib/components/kefine/KefineProfileSocialLinksCard.svelte';
  import KefineProfileSetupDots from '$lib/components/kefine/KefineProfileSetupDots.svelte';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import { onMount } from 'svelte';
  import { disconnectAppKit } from '$lib/auth/appkit';
  import { authState, clearAuthState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { loadGeneratedPrivateKeyCookie } from '$lib/auth/publickey-cookie';
  import { clearPasskeySession, loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import { parseStoredOrders, type OrderView, type TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import { buildActorOrderPath, shortenAuthLabel } from '$lib/components/kefine/kefine-workspace-helpers';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { kefineLocale, kefineLocaleText, setKefineLocale, type KefineLocale } from '$lib/constants/kefine-locale';
  import {
    addProfileBonus,
    buildProfilePath,
    deriveWalletProfileHandle,
    ensureProfileForSession,
    followProfile,
    getProfileByUsername,
    isDefaultActorHandle,
    isFollowingProfile,
    normalizeProfileUsername,
    readProfiles,
    updateStoredProfile
  } from '$lib/profile/profile-storage';
  import type {
    Profile,
    ProfileMetadata,
    ProfileSocialLink
  } from '$lib/types/user';
  import { buildLocaleHomePath, localizeAppPath, readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';

  const localeText = $derived($kefineLocaleText);
  const passkeySession = $derived($passkeySessionStore);
  const BRAND_HOME_NAVIGATION_STORAGE_KEY = 'kefine-brand-home-navigation';
  const THEME_STORAGE_KEY = 'kefine-theme';

  let profile = $state<Profile | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let unavailable = $state(false);
  let following = $state(false);
  let publicTasks = $state<OrderView[]>([]);
  let ownerTasks = $state<OrderView[]>([]);
  let copyState = $state<'idle' | 'profile'>('idle');

  let displayName = $state('');
  let username = $state('');
  let bio = $state('');
  let isPublic = $state(false);
  let referralPercent = $state(10);
  let socialLinks = $state<ProfileSocialLink[]>([]);
  let sshPublicKey = $state('');
  let privateKey = $state('');
  let firstName = $state('');
  let surname = $state('');
  let leftNavExpanded = $state(false);
  let themeMode = $state<'light' | 'dark' | 'auto'>('auto');
  let systemPrefersDark = $state(false);

  const requestedHandle = $derived(page.params.handle ?? '');
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? 'en');
  const isOwner = $derived(Boolean(profile && viewerProfile && profile.id === viewerProfile.id));
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const canonicalProfilePath = $derived(profile ? localizeAppPath(buildProfilePath(profile.primaryHandle), activeLocale) : '');
  const setupMetadata = $derived((profile?.metadata ?? {}) as ProfileMetadata);
  const hasOwnerTasks = $derived((isOwner ? ownerTasks : publicTasks).length > 0);

  const hasIdentityStepCompleted = $derived(
    Boolean(firstName.trim() || surname.trim() || profile?.displayName.trim() || username.trim())
  );
  const hasCardStepCompleted = $derived(Boolean(profile?.cardVerification?.verifiedAt));
  const hasSocialStepCompleted = $derived(
    socialLinks.some((link) => Boolean(link.value.trim()))
  );
  const socialsStepHint = $derived(
    setupMetadata.cardBonusEligible && !hasSocialStepCompleted ? localeText.profile.socialBonusHint : ''
  );
  const profileSetupCompleted = $derived(
    setupMetadata.profileSetupCompleted === true || setupMetadata.profileSetupStep === 'done'
  );
  const onboardingStep = $derived.by(() => {
    if (!isOwner || !profile || profileSetupCompleted) {
      return null;
    }

    if (setupMetadata.profileSetupStep === 'socials') {
      return 'socials' as const;
    }

    if (setupMetadata.profileSetupStep === 'done') {
      return null;
    }

    return 'identity' as const;
  });
  const onboardingStepIndex = $derived(
    onboardingStep === 'identity' ? 1 : onboardingStep === 'socials' ? 2 : 2
  );
  const resolvedTheme = $derived(themeMode === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : themeMode);
  const isDarkTheme = $derived(resolvedTheme === 'dark');
  const topbarThemeActionLabel = $derived(themeMode === 'auto' ? localeText.topbar.theme.auto : isDarkTheme ? localeText.topbar.theme.dark : localeText.topbar.theme.light);

  function navigateToHomeFromBrand() {
    if (browser) {
      sessionStorage.setItem(BRAND_HOME_NAVIGATION_STORAGE_KEY, '1');
    }

    void goto(buildLocaleHomePath(activeLocale));
  }

  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: runtimeConfig.app.socialLinks.mastodon,
      icon: 'mastodon' as const
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: runtimeConfig.app.socialLinks.discord,
      icon: 'discord' as const
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: runtimeConfig.app.socialLinks.linkedin,
      icon: 'linkedin' as const
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: runtimeConfig.app.socialLinks.telegram,
      icon: 'telegram' as const
    },
    {
      id: 'github' as const,
      label: localeText.topbar.githubLabel,
      href: runtimeConfig.app.socialLinks.github,
      icon: 'github' as const
    }
  ]);
  const sidebarLegalLinks = $derived([
    {
      id: 'privacy' as const,
      label: localeText.topbar.legalLinks.privacy,
      href: localizeAppPath('/privacy', activeLocale)
    },
    {
      id: 'terms' as const,
      label: localeText.topbar.legalLinks.terms,
      href: localizeAppPath('/terms', activeLocale)
    }
  ]);
  function readProfileNameParts(currentProfile: Profile | null) {
    const metadata = (currentProfile?.metadata ?? {}) as ProfileMetadata;
    if (typeof metadata.firstName === 'string' && typeof metadata.surname === 'string') {
      return {
        firstName: metadata.firstName.trim(),
        surname: metadata.surname.trim()
      };
    }

    const parts = currentProfile?.displayName.trim().split(/\s+/).filter(Boolean) ?? [];
    return {
      firstName: parts[0] ?? '',
      surname: parts.slice(1).join(' ')
    };
  }

  function nextMetadata(current: Profile, patch: Partial<ProfileMetadata>): ProfileMetadata {
    return {
      ...((current.metadata ?? {}) as ProfileMetadata),
      ...patch
    };
  }

  function createEmptySocialLink(): ProfileSocialLink {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `social-${crypto.randomUUID()}` : `social-${Date.now()}`;
    return { id, type: 'website', label: 'Website', value: '' };
  }

  function getTaskUrl(order: OrderView): string {
    const handle = profile?.primaryHandle || profile?.username || requestedHandle;
    return localizeAppPath(buildActorOrderPath(handle, order.shareId ?? order.id), activeLocale);
  }

  function syncDraftStateFromProfile(nextProfile: Profile | null) {
    displayName = nextProfile?.displayName ?? '';
    username = nextProfile?.primaryHandle ?? '';
    bio = nextProfile?.bio ?? '';
    isPublic = nextProfile?.isPublic ?? false;
    referralPercent = nextProfile?.referralPercent ?? 10;
    socialLinks = nextProfile?.socialLinks.map((link) => ({ ...link })) ?? [];
    if (viewerProfile && nextProfile && viewerProfile.id === nextProfile.id && socialLinks.length === 0) {
      socialLinks = [createEmptySocialLink()];
    }
    sshPublicKey = typeof nextProfile?.metadata?.sshPublicKey === 'string' ? nextProfile.metadata.sshPublicKey : '';
    const nameParts = readProfileNameParts(nextProfile);
    firstName = nameParts.firstName;
    surname = nameParts.surname;
  }

  function syncPrivateKeyState() {
    privateKey = browser ? loadGeneratedPrivateKeyCookie() ?? '' : '';
  }

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

  let profileLoadKey = $state('');
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

    if (nextProfileLoadKey === '__never__' || nextProfileLoadKey === profileLoadKey) {
      return;
    }

    profileLoadKey = nextProfileLoadKey;
    void loadProfilePageState();
  });

  onMount(() => {
    if (!browser) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark = mediaQuery.matches;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    themeMode = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'auto' ? storedTheme : 'auto';
    const handleThemePreferenceChange = (event: MediaQueryListEvent) => {
      systemPrefersDark = event.matches;
    };
    mediaQuery.addEventListener('change', handleThemePreferenceChange);
    hydrateAuthStateFromSession();
    loadPasskeySession();
    syncPrivateKeyState();

    return () => {
      mediaQuery.removeEventListener('change', handleThemePreferenceChange);
    };
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    document.documentElement.setAttribute('data-kefine-theme', resolvedTheme);
    document.documentElement.setAttribute('lang', $kefineLocale);
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  });

  async function loadProfilePageState() {
    if (!browser) {
      return;
    }

    syncPrivateKeyState();

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
    syncDraftStateFromProfile(storedProfile);

    if (!storedProfile) {
      unavailable = true;
      return;
    }

    const ownerViewing = Boolean(viewerProfile && viewerProfile.id === storedProfile.id);
    if (!storedProfile.isPublic && !ownerViewing) {
      unavailable = true;
      return;
    }

    unavailable = false;
    following = viewerProfile ? isFollowingProfile(localStorage, viewerProfile.id, storedProfile.id) : false;

    const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
    ownerTasks = storedOrders.filter(
      (order) =>
        order.ownerProfileId === storedProfile.id &&
        (order.status === 'completed' || order.status === 'done' || order.isClosedCompleted === true)
    );
    publicTasks = ownerTasks.filter((order) => order.isPublicTask === true && order.status !== 'stopped');

    if (buildProfilePath(storedProfile.primaryHandle) !== buildProfilePath(requestedHandle)) {
      await goto(localizeAppPath(buildProfilePath(storedProfile.primaryHandle), activeLocale), { replaceState: true });
    }
  }

  function addSocialLink() {
    socialLinks = [...socialLinks, createEmptySocialLink()];
  }

  function removeSocialLink(id: string) {
    socialLinks = socialLinks.filter((link) => link.id !== id);
  }

  async function syncSshPublicKey(handle: string, publicKey: string) {
    if (!browser) {
      return;
    }

    const url = `/actor/${encodeURIComponent(handle)}/keys/ssh`;
    if (publicKey.trim()) {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: publicKey.trim()
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save SSH public key on the server.');
      }
      return;
    }

    const response = await fetch(url, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete SSH public key on the server.');
    }
  }

  async function copyLink(value: string, kind: 'profile') {
    if (!browser || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    copyState = kind;
    window.setTimeout(() => {
      if (copyState === kind) {
        copyState = 'idle';
      }
    }, 1400);
  }

  async function copyPrivateKey() {
    if (!privateKey.trim()) {
      return;
    }

    await copyLink(privateKey, 'profile');
  }

  function resolveNextUsername(current: Profile): string {
    const normalized = normalizeProfileUsername(username);
    const otherProfiles = readProfiles(localStorage).filter((item) => item.id !== current.id);
    const usernameTaken = otherProfiles.some((item) => (item.primaryHandle || item.username) === normalized);
    return usernameTaken ? current.primaryHandle : normalized;
  }

  function syncOwnedOrderHandles(profileId: string, nextHandle: string) {
    const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
    const nextOrders = storedOrders.map((order) =>
      order.ownerProfileId === profileId ? { ...order, ownerUsername: nextHandle } : order
    );
    localStorage.setItem('kefine-created-orders-v1', JSON.stringify(nextOrders));
  }

  async function navigateToProfileHandle(nextHandle: string) {
    const currentPath = localizeAppPath(buildProfilePath(requestedHandle), activeLocale);
    const nextPath = localizeAppPath(buildProfilePath(nextHandle), activeLocale);
    if (currentPath !== nextPath) {
      await goto(nextPath, { replaceState: true });
    }
  }

  async function saveProfile() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const nextHandle = resolveNextUsername(profile);
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      username: nextHandle,
      primaryHandle: nextHandle,
      displayName: fullName || current.displayName,
      bio: bio.trim(),
      isPublic,
      referralPercent: Math.max(0, Math.min(100, Math.round(referralPercent))),
      socialLinks: socialLinks
        .map((link) => ({
          ...link,
          label: link.label?.trim() || undefined,
          value: link.value.trim()
        }))
        .filter((link) => link.value),
      metadata: nextMetadata(current, {
        firstName: firstName.trim(),
        surname: surname.trim(),
        sshPublicKey: sshPublicKey.trim()
      })
    }));

    if (updated) {
      await syncSshPublicKey(updated.primaryHandle, sshPublicKey.trim());
      syncOwnedOrderHandles(updated.id, updated.primaryHandle);
      profile = updated;
      await navigateToProfileHandle(updated.primaryHandle);
      void loadProfilePageState();
    }
  }

  async function saveIdentityStep() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const displayNameParts = profile.displayName.trim().split(/\s+/).filter(Boolean);
    const normalizedFirstName = firstName.trim() || displayNameParts[0] || username.trim() || 'User';
    const normalizedSurname = surname.trim() || displayNameParts.slice(1).join(' ');
    const nextHandle = resolveNextUsername(profile);
    const fullName = `${normalizedFirstName} ${normalizedSurname}`.trim();
    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      username: nextHandle,
      primaryHandle: nextHandle,
      displayName: fullName,
      bio: bio.trim(),
      metadata: nextMetadata(current, {
        firstName: normalizedFirstName,
        surname: normalizedSurname,
        profileSetupStep: 'socials',
        profileSetupCompleted: false
      })
    }));

    if (updated) {
      syncOwnedOrderHandles(updated.id, updated.primaryHandle);
      profile = updated;
      firstName = normalizedFirstName;
      surname = normalizedSurname;
      username = updated.primaryHandle;
      displayName = updated.displayName;
      await navigateToProfileHandle(updated.primaryHandle);
      void loadProfilePageState();
    }
  }

  function goToOnboardingStep(step: 1 | 2) {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const profileSetupStep = step === 1 ? 'identity' : 'socials';
    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      metadata: nextMetadata(current, {
        profileSetupStep,
        profileSetupCompleted: false
      })
    }));

    if (updated) {
      profile = updated;
    }
  }

  function blockStepSubmitOnEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  function saveSocialLinksStep() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const nextSocialLinks = socialLinks
      .map((link) => ({
        ...link,
        label: link.label?.trim() || undefined,
        value: link.value.trim()
      }))
      .filter((link) => link.value);

    let updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      socialLinks: nextSocialLinks,
      cardVerification:
        nextSocialLinks.length > 0 &&
        current.metadata &&
        current.metadata.cardBonusEligible === true &&
        current.cardVerification &&
        !current.cardVerification.bonusGrantedAt
          ? {
              ...current.cardVerification,
              bonusGrantedAt: new Date().toISOString()
            }
          : current.cardVerification,
      metadata: nextMetadata(current, {
        profileSetupStep: 'done',
        profileSetupCompleted: true
      })
    }));

    if (
      updated &&
      nextSocialLinks.length > 0 &&
      setupMetadata.cardBonusEligible === true &&
      !profile.cardVerification?.bonusGrantedAt
    ) {
      updated = addProfileBonus({
        storage: localStorage,
        profileId: updated.id,
        amountUsd: 100,
        source: 'card-verification',
        note: 'Armenian bank card verification bonus'
      });
    }

    if (updated) {
      profile = updated;
      void goto(localizeAppPath(buildProfilePath(updated.primaryHandle), activeLocale), { replaceState: true });
    }
  }

  function toggleProfileVisibility() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const nextIsPublic = !isPublic;
    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      isPublic: nextIsPublic
    }));

    if (updated) {
      profile = updated;
      isPublic = updated.isPublic;
    }
  }

  function updateTaskRule(order: OrderView, mode: TaskAccessMode, patch: { enabled?: boolean; priceUsd?: number }) {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
    const nextOrders = storedOrders.map((item) => {
      if (item.id !== order.id) {
        return item;
      }

      return {
        ...item,
        accessRules: {
          ...item.accessRules,
          [mode]: {
            enabled: patch.enabled ?? item.accessRules?.[mode]?.enabled ?? false,
            priceUsd: patch.priceUsd ?? item.accessRules?.[mode]?.priceUsd ?? 0
          }
        }
      };
    });

    localStorage.setItem('kefine-created-orders-v1', JSON.stringify(nextOrders));
    void loadProfilePageState();
  }

  function updateTaskPublicState(orderId: string, nextIsPublic: boolean) {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
    localStorage.setItem(
      'kefine-created-orders-v1',
      JSON.stringify(
        storedOrders.map((item) => (item.id === orderId ? { ...item, isPublicTask: nextIsPublic } : item))
      )
    );
    void loadProfilePageState();
  }

  function followCurrentProfile() {
    if (!browser || !profile || !viewerProfile || viewerProfile.id === profile.id) {
      return;
    }

    followProfile(localStorage, viewerProfile.id, profile.id);
    void loadProfilePageState();
  }

  async function signOut() {
    try {
      await disconnectAppKit();
    } catch {
      // ignore
    }

    clearAuthState();
    clearPasskeySession();
    viewerProfile = null;
    await goto(buildLocaleHomePath(activeLocale));
  }
</script>

<svelte:head>
  <title>{profile ? `${profile.displayName} | Lefine` : 'Profile | Lefine'}</title>
</svelte:head>

{#if unavailable}
  <section class="profile-page">
    <article class="profile-unavailable">
      <lefine-text class="profile-unavailable__code">404</lefine-text>
      <h1>{localeText.profile.profileUnavailable}</h1>
      <p>{localeText.profile.hidden}</p>
      <a class="profile-unavailable__action" href={buildLocaleHomePath(activeLocale)}>{localeText.topbar.legalLinks.backToApp}</a>
    </article>
  </section>
{:else if profile}
  <section class="profile-page">
    <KefineTopbar
      brandLabel={localeText.brand.name}
      navigationLabel={localeText.topbar.quickActions}
      openSidebarLabel={localeText.topbar.openActionsMenu}
      collapseSidebarLabel={localeText.topbar.closeActionsMenu}
      dockLabel={localeText.topbar.dockLabel}
      socialLabel={localeText.topbar.socialLabel}
      legalLabel={localeText.topbar.legalLabel}
      mailLabel={localeText.topbar.mailLabel}
      themeLabel={topbarThemeActionLabel}
      themeMode={themeMode}
      themeAutoLabel={localeText.topbar.theme.auto}
      themeLightLabel={localeText.topbar.theme.light}
      themeDarkLabel={localeText.topbar.theme.dark}
      signInLabel={localeText.topbar.signIn}
      signedInLabel={localeText.topbar.signedIn}
      authenticatedLabel={viewerProfile ? shortenAuthLabel(`@${viewerProfile.primaryHandle}`) : null}
      authenticatedSecondaryLabel={null}
      authenticatedAvatarUrl={null}
      openProfileLabel={localeText.profile.title}
      isAuthenticated={Boolean(viewerProfile)}
      isDarkTheme={isDarkTheme}
      isExpanded={leftNavExpanded}
      locale={$kefineLocale}
      languageEnglishLabel={localeText.topbar.languageEnglish}
      languageRussianLabel={localeText.topbar.languageRussian}
      languageArmenianLabel={localeText.topbar.languageArmenian}
      searchLabel={localeText.topbar.searchLabel}
      searchPlaceholder={localeText.topbar.searchPlaceholder}
      searchResultsLabel={localeText.topbar.searchResultsLabel}
      searchEmptyLabel={localeText.topbar.searchEmptyLabel}
      searchOpenLabel={localeText.topbar.searchOpenLabel}
      searchHomeLabel={localeText.topbar.searchHomeLabel}
      searchHomeHref={buildLocaleHomePath(activeLocale)}
      socialLinks={sidebarSocialLinks}
      showSocialLinks={false}
      legalLinks={sidebarLegalLinks}
      onExpandedChange={(expanded) => { leftNavExpanded = expanded; }}
      onBrandClick={navigateToHomeFromBrand}
      onOpenEmailDialog={() => {
        if (browser) {
          window.location.assign(localizeAppPath(`/@${runtimeConfig.defaultActor.handle}`, activeLocale));
        }
      }}
      onThemeChange={(theme) => {
        themeMode = theme;
      }}
      onAuth={() => {
        if (isOwner) {
          void signOut();
        } else {
          void goto(buildLocaleHomePath(activeLocale));
        }
      }}
      onOpenProfile={() => {
        if (viewerProfile) {
          void goto(localizeAppPath(buildProfilePath(viewerProfile.primaryHandle), activeLocale));
        }
      }}
      onSignOut={() => {
        if (isOwner) {
          void signOut();
        } else {
          void goto(buildLocaleHomePath(activeLocale));
        }
      }}
      onAuthDoubleClick={() => {
        if (viewerProfile && viewerProfile.metadata?.profileSetupCompleted !== true) {
          void goto(localizeAppPath(buildProfilePath(viewerProfile.primaryHandle), activeLocale));
        }
      }}
      onLocale={(locale: KefineLocale) => {
        setKefineLocale(locale);
        void goto(buildLocaleHomePath(locale));
      }}
    />

    {#if !(isOwner && onboardingStep)}
      <KefineProfileHeaderEditor
        bind:firstName
        bind:surname
        bind:username
        isOwner={isOwner}
        isSetup={isOwner}
        displayName={profile.displayName}
        canonicalProfilePath={canonicalProfilePath}
        bio={bio}
        firstNameLabel={localeText.profile.firstName}
        surnameLabel={localeText.profile.surname}
        usernameLabel={localeText.profile.username}
        followLabel={!isOwner && viewerProfile ? (following ? localeText.profile.following : localeText.profile.follow) : ''}
        onFollow={followCurrentProfile}
        onFieldKeydown={blockStepSubmitOnEnter}
      />
    {/if}

    <lefine-box class:profile-layout={true} class:profile-layout--single={!hasOwnerTasks}>
      <lefine-box class="profile-main" class:profile-main--setup={isOwner && onboardingStep === 'identity'}>
        {#if isOwner && onboardingStep}
          {#if onboardingStep === 'identity'}
            <section class="profile-surface profile-step-surface profile-step-surface--identity">
              <KefineProfileHeaderEditor
                bind:firstName
                bind:surname
                bind:username
                isOwner={true}
                isSetup={true}
                isEmbedded={true}
                displayName={profile.displayName}
                canonicalProfilePath={canonicalProfilePath}
                bio={bio}
                firstNameLabel={localeText.profile.firstName}
                surnameLabel={localeText.profile.surname}
                usernameLabel={localeText.profile.username}
                onFieldKeydown={blockStepSubmitOnEnter}
              />
              <KefineProfileSetupDots currentStep={1} steps={[1, 2]} onSelect={(step) => goToOnboardingStep(step as 1 | 2)} />
              <textarea
                class="profile-identity-input"
                bind:value={bio}
                rows="6"
                placeholder="Write a short profile note: what you do, what kind of tasks you complete, and what people should expect from your page."
                onkeydown={blockStepSubmitOnEnter}
              ></textarea>
              <lefine-box class="profile-setup__footer profile-setup__footer--spread">
                <small>{localeText.profile.setupHint}</small>
                <button
                  type="button"
                  class="profile-setup__arrow"
                  aria-label={localeText.profile.continueToSocials}
                  disabled={!hasIdentityStepCompleted}
                  onclick={saveIdentityStep}
                >
                  <lefine-text>{localeText.profile.continueToSocials}</lefine-text>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 12h10m-4-4 4 4-4 4" />
                  </svg>
                </button>
              </lefine-box>
            </section>
          {:else if onboardingStep === 'socials'}
            <section class="profile-surface profile-step-surface">
              <KefineProfileHeaderEditor
                bind:firstName
                bind:surname
                bind:username
                isOwner={true}
                isSetup={true}
                isEmbedded={true}
                displayName={profile.displayName}
                canonicalProfilePath={canonicalProfilePath}
                bio={bio}
                firstNameLabel={localeText.profile.firstName}
                surnameLabel={localeText.profile.surname}
                usernameLabel={localeText.profile.username}
                onFieldKeydown={blockStepSubmitOnEnter}
              />
              <KefineProfileSetupDots currentStep={2} steps={[1, 2]} onSelect={(step) => goToOnboardingStep(step as 1 | 2)} />
              <lefine-box class="profile-links-head">
                <button type="button" class="profile-links-add" aria-label={localeText.profile.addLink} onclick={addSocialLink}>+</button>
                <strong>{localeText.profile.socialLinks}</strong>
              </lefine-box>
              <KefineProfileSocialLinksCard
                bind:links={socialLinks}
                valuePlaceholder={localeText.profile.socialUrl}
                emptyText={localeText.profile.onboardingSubtitle}
                isOwner={true}
              />
              {#if socialsStepHint}
                <small role="alert">{socialsStepHint}</small>
              {/if}
              <lefine-box class="profile-setup__footer">
                <button type="button" data-variant="primary" onclick={saveSocialLinksStep}>
                  {localeText.profile.finishSetup}
                </button>
              </lefine-box>
            </section>
          {/if}
        {:else}
          <article class="profile-surface profile-details">
            <lefine-box class="profile-section__head">
              <lefine-box>
                <strong>{localeText.profile.title}</strong>
                <p>{profileSetupCompleted && isOwner ? localeText.profile.setupDone : localeText.profile.subtitle}</p>
              </lefine-box>
              {#if isOwner}
                <button
                  type="button"
                  class="profile-visibility-toggle"
                  data-public={isPublic}
                  aria-label={isPublic ? localeText.profile.makePrivate : localeText.profile.makePublic}
                  onclick={toggleProfileVisibility}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {#if isPublic}
                      <path d="M7 10V8a5 5 0 0 1 10 0" />
                      <rect x="5" y="10" width="14" height="10" rx="2" ry="2" />
                    {:else}
                      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
                      <rect x="5" y="10" width="14" height="10" rx="2" ry="2" />
                    {/if}
                  </svg>
                  <lefine-text>{isPublic ? localeText.profile.publicStatus : localeText.profile.privateStatus}</lefine-text>
                </button>
              {/if}
            </lefine-box>

            <lefine-box class="profile-section">
              {#if isOwner}
                <lefine-box class="profile-visibility-note" data-public={isPublic}>
                  <strong>{isPublic ? localeText.profile.publicStatus : localeText.profile.privateStatus}</strong>
                  <p>{isPublic ? localeText.profile.publicHint : localeText.profile.privateHint}</p>
                </lefine-box>
              {/if}
              <label class="profile-field">
                <lefine-text>{localeText.profile.bio}</lefine-text>
                {#if isOwner}
                  <textarea bind:value={bio} rows="5"></textarea>
                {:else}
                  <textarea value={profile.bio || localeText.profile.subtitle} rows="5" disabled></textarea>
                {/if}
              </label>
            </lefine-box>

            <lefine-box class="profile-grid-two">
              <lefine-box class="profile-links-column">
                <lefine-box class="profile-links-head">
                  <button type="button" class="profile-links-add" aria-label={localeText.profile.addLink} onclick={addSocialLink}>+</button>
                  <strong>{localeText.profile.socialLinks}</strong>
                </lefine-box>
                <KefineProfileSocialLinksCard
                  bind:links={socialLinks}
                  valuePlaceholder={localeText.profile.socialUrl}
                  emptyText=""
                  {isOwner}
                />
              </lefine-box>

              {#if isOwner}
                <lefine-box class="profile-links-column">
                  <lefine-box class="profile-links-head">
                    <strong>{localeText.profile.secretData}</strong>
                  </lefine-box>
                  <label class="profile-field">
                    <lefine-text>{localeText.profile.sshPublicKey}</lefine-text>
                    <textarea bind:value={sshPublicKey} rows="6" placeholder={localeText.profile.sshPublicKeyHint}></textarea>
                  </label>
                  <label class="profile-field">
                    <lefine-box class="profile-secret-field-head">
                      <lefine-text>{localeText.profile.privateKey}</lefine-text>
                      <button type="button" data-variant="ghost" onclick={copyPrivateKey} disabled={!privateKey.trim()}>
                        {copyState === 'profile' ? localeText.profile.privateKeyCopied : localeText.profile.copyPrivateKey}
                      </button>
                    </lefine-box>
                    <textarea value={privateKey} rows="8" readonly placeholder={localeText.profile.privateKeyHint}></textarea>
                  </label>
                </lefine-box>
              {/if}

            </lefine-box>

            {#if isOwner}
              <footer class="profile-details__footer">
                <button type="button" data-variant="primary" onclick={saveProfile}>{localeText.profile.save}</button>
              </footer>
            {/if}
          </article>

        {/if}
      </lefine-box>

      {#if hasOwnerTasks}
        <aside class="profile-side">
          <article class="profile-surface profile-tasks">
            <lefine-box class="profile-section__head">
              <strong>{localeText.profile.lepos}</strong>
            </lefine-box>
            <lefine-box class="profile-task-list">
              {#each (isOwner ? ownerTasks : publicTasks) as order (order.id)}
                <article class="profile-task">
                  <lefine-box class="profile-task__head">
                    <lefine-box>
                      <strong>{order.title}</strong>
                      <p>{order.solver}</p>
                    </lefine-box>
                    <lefine-box class="profile-task__actions">
                      <a href={getTaskUrl(order)}>{localeText.profile.openTask}</a>
                    </lefine-box>
                  </lefine-box>

                  {#if isOwner}
                    <label class="profile-toggle">
                      <input
                        checked={order.isPublicTask === true}
                        type="checkbox"
                        onchange={(event) => updateTaskPublicState(order.id, (event.currentTarget as HTMLInputElement).checked)}
                      />
                      <lefine-text>{localeText.profile.publicTask}</lefine-text>
                    </label>

                    <lefine-box class="profile-rules">
                      {#each ([
                        ['view', localeText.profile.viewAccess],
                        ['watch', localeText.profile.watchAccess],
                        ['join', localeText.profile.joinAccess]
                      ] as const) as [mode, label]}
                        <lefine-box class="profile-rules__row">
                          <label class="profile-toggle">
                            <input
                              checked={order.accessRules?.[mode]?.enabled === true}
                              type="checkbox"
                              onchange={(event) =>
                                updateTaskRule(order, mode, { enabled: (event.currentTarget as HTMLInputElement).checked })}
                            />
                            <lefine-text>{label}</lefine-text>
                          </label>
                          <input
                            min="0"
                            step="1"
                            type="number"
                            value={order.accessRules?.[mode]?.priceUsd ?? 0}
                            onchange={(event) =>
                              updateTaskRule(order, mode, { priceUsd: Number((event.currentTarget as HTMLInputElement).value) })}
                          />
                        </lefine-box>
                      {/each}
                    </lefine-box>
                  {/if}
                </article>
              {:else}
                <p>{isOwner ? localeText.profile.noOwnerTasks : localeText.profile.noPublicTasks}</p>
              {/each}
            </lefine-box>
          </article>
        </aside>
      {/if}
    </lefine-box>

  </section>
{/if}

<style>
  .profile-page {
    width: min(76rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: clamp(4.5rem, 10vh, 6rem) 0 3rem;
    display: grid;
    gap: 1rem;
  }

  .profile-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.9fr);
    gap: 1rem;
    align-items: start;
  }

  .profile-layout--single {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile-main,
  .profile-side,
  .profile-unavailable,
  .profile-surface,
  .profile-section,
  .profile-task {
    display: grid;
    gap: 0.9rem;
  }

  .profile-surface,
  .profile-task {
    padding: 1.25rem;
    border-radius: 1.1rem;
    background: color-mix(in oklab, var(--kef-color-bg-card) 97%, var(--kef-color-bg));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
    box-shadow: 0 18px 40px color-mix(in oklab, black 18%, transparent);
  }

  .profile-unavailable {
    position: relative;
    overflow: hidden;
    justify-items: start;
    gap: 1rem;
    min-height: min(34rem, calc(100vh - 10rem));
    padding: clamp(1.5rem, 4vw, 3rem);
    border-radius: 1.6rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 22%, transparent);
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-color-primary) 18%, transparent), transparent 34%),
      radial-gradient(circle at right 18%, color-mix(in oklab, white 8%, transparent), transparent 22%),
      linear-gradient(180deg, color-mix(in oklab, var(--kef-color-bg-card) 94%, black 6%), color-mix(in oklab, var(--kef-color-bg) 48%, var(--kef-color-bg-card)));
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
      0 24px 60px color-mix(in oklab, black 22%, transparent);
  }

  .profile-unavailable::before {
    content: '';
    position: absolute;
    inset: auto -10% -28% auto;
    width: clamp(14rem, 28vw, 22rem);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in oklab, var(--kef-color-primary) 18%, transparent), transparent 68%);
    pointer-events: none;
  }

  .profile-unavailable__code {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 24%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 12%, transparent);
    color: color-mix(in oklab, white 72%, var(--kef-color-primary));
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .profile-unavailable h1,
  .profile-unavailable p {
    margin: 0;
    max-width: 36rem;
  }

  .profile-unavailable h1 {
    font-size: clamp(2rem, 5vw, 4.25rem);
    line-height: 0.94;
    letter-spacing: -0.05em;
  }

  .profile-unavailable p {
    color: var(--kef-color-muted);
    font-size: clamp(1rem, 1.6vw, 1.1rem);
    line-height: 1.6;
  }

  .profile-unavailable__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.9rem;
    padding: 0.75rem 1.1rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 22%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg) 36%, var(--kef-color-bg-card));
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 8%, transparent);
    color: var(--kef-color-text);
    text-decoration: none;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease;
  }

  .profile-unavailable__action:hover {
    transform: translateY(-1px);
    border-color: color-mix(in oklab, var(--kef-color-primary) 34%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 10%, var(--kef-color-bg-card));
  }

  .profile-section__head,
  .profile-task__head,
  .profile-task__actions,
  .profile-rules__row,
  .profile-toggle,
  .profile-details__footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .profile-section__head,
  .profile-task__head {
    justify-content: space-between;
  }

  .profile-visibility-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-bg) 44%, var(--kef-color-bg-card));
    color: var(--kef-color-text);
    cursor: pointer;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .profile-visibility-toggle svg {
    width: 1rem;
    height: 1rem;
    stroke: currentColor;
    stroke-width: 1.8;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .profile-visibility-toggle[data-public='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary) 28%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 12%, var(--kef-color-bg-card));
  }

  .profile-visibility-note {
    padding: 0.95rem 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  .profile-visibility-note[data-public='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary) 24%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary) 10%, var(--kef-color-bg-card));
  }

  .profile-visibility-note strong,
  .profile-visibility-note p {
    margin: 0;
  }

  .profile-visibility-note p {
    color: var(--kef-color-muted);
  }

  .profile-task__head p,
  .profile-section__head p {
    margin: 0;
  }

  .profile-section__head p {
    color: var(--kef-color-muted);
  }

  .profile-step-surface,
  .profile-details,
  .profile-tasks,
  .profile-task-list,
  .profile-links-column,
  .profile-grid-two,
  .profile-rules {
    display: grid;
    gap: 1rem;
  }

  .profile-links-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .profile-secret-field-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .profile-links-add {
    width: 2rem;
    height: 2rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    color: var(--kef-color-text);
    cursor: pointer;
    font-size: 1.15rem;
    line-height: 1;
  }

  .profile-grid-two {
    grid-template-columns: minmax(0, 1.08fr) minmax(18rem, 0.92fr);
    align-items: start;
  }

  .profile-main--setup {
    min-height: calc(100vh - 20rem);
  }

  .profile-step-surface {
    align-content: start;
  }

  .profile-step-surface--identity {
    position: relative;
    min-height: calc(100vh - 24rem);
    padding: 1.5rem 1.5rem 2rem;
  }

  .profile-identity-input {
    width: 100%;
    min-height: calc(100vh - 33rem);
    padding: 1.35rem 1.45rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary) 20%, transparent);
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--kef-color-bg) 56%, var(--kef-color-bg-card)), color-mix(in oklab, var(--kef-color-bg-card) 94%, var(--kef-color-bg)));
    color: var(--kef-color-text);
    resize: none;
    font-size: 1.05rem;
    line-height: 1.55;
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 6%, transparent),
      0 12px 28px color-mix(in oklab, black 10%, transparent);
  }

  .profile-identity-input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 48%, transparent);
    opacity: 1;
    font-size: 1.2rem;
    line-height: 1.5;
  }

  .profile-identity-input:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--kef-color-primary) 38%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
      0 0 0 4px color-mix(in oklab, var(--kef-color-primary) 12%, transparent);
  }

  .profile-setup__arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.7rem;
    min-height: 4rem;
    padding: 0 1.25rem 0 1.5rem;
    border: 0;
    border-radius: 999px;
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--kef-color-primary) 92%, white 8%), var(--kef-color-primary));
    color: #20150d;
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 22%, transparent),
      0 12px 24px color-mix(in oklab, var(--kef-color-primary) 26%, transparent);
    cursor: pointer;
  }

  .profile-setup__arrow lefine-text {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .profile-setup__arrow svg {
    width: 1.2rem;
    height: 1.2rem;
    stroke: currentColor;
    stroke-width: 1.8;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .profile-setup__arrow:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  .profile-field {
    display: grid;
    gap: 0.4rem;
  }

  .profile-field lefine-text,
  .profile-section__head strong,
  .profile-task__head strong {
    font-size: 0.94rem;
  }

  .profile-field textarea,
  .profile-rules__row input[type='number'] {
    width: 100%;
  }

  .profile-rules__row {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  .profile-setup__footer,
  .profile-details__footer {
    display: flex;
    justify-content: flex-start;
  }

  .profile-setup__footer--spread {
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .profile-setup__footer--spread small {
    color: var(--kef-color-muted);
    margin: 0;
    max-width: 38rem;
  }

  .profile-task__actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .profile-rules__row .profile-toggle {
    flex: 1 1 auto;
  }

  .profile-surface a,
  .profile-task a {
    color: inherit;
  }

  @media (max-width: 980px) {
    .profile-layout,
    .profile-layout--single,
    .profile-grid-two {
      grid-template-columns: 1fr;
    }

    .profile-task__head {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-main--setup {
      min-height: auto;
    }

    .profile-step-surface--identity,
    .profile-identity-input {
      min-height: auto;
    }

    .profile-setup__footer--spread {
      align-items: flex-start;
      flex-direction: column;
    }

    .profile-page {
      width: min(100%, calc(100vw - 1rem));
      padding-top: 5rem;
    }

    .profile-section__head {
      align-items: flex-start;
      flex-direction: column;
    }

  }
</style>

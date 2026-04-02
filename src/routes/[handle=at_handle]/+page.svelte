<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import KefineProfileHero from '$lib/components/kefine/KefineProfileHero.svelte';
  import KefineProfileSetupDots from '$lib/components/kefine/KefineProfileSetupDots.svelte';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import { onMount } from 'svelte';
  import { disconnectAppKit } from '$lib/auth/appkit';
  import { authState, clearAuthState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { clearPasskeySession, loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import { parseStoredOrders, type OrderView, type TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { getLocaleText, kefineLocale, setKefineLocale, type KefineLocale } from '$lib/constants/kefine-locale';
  import {
    addProfileBonus,
    buildProfilePath,
    deriveWalletProfileHandle,
    ensureProfileForSession,
    followProfile,
    getProfileByUsername,
    isFollowingProfile,
    normalizeProfileUsername,
    readProfiles,
    updateStoredProfile
  } from '$lib/profile/profile-storage';
  import type { Profile, ProfileMetadata } from '$lib/types/user';

  const localeText = $derived(getLocaleText($kefineLocale));
  const passkeySession = $derived($passkeySessionStore);

  let profile = $state<Profile | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let unavailable = $state(false);
  let following = $state(false);
  let publicTasks = $state<OrderView[]>([]);
  let ownerTasks = $state<OrderView[]>([]);
  let copyState = $state<'idle' | 'profile' | 'task'>('idle');

  let displayName = $state('');
  let username = $state('');
  let bio = $state('');
  let isPublic = $state(false);
  let referralPercent = $state(10);
  let socialLinks = $state<Array<{ id: string; label: string; url: string }>>([]);
  let cardNumber = $state('');
  let firstName = $state('');
  let surname = $state('');
  let leftNavExpanded = $state(false);
  let isDarkTheme = $state(false);

  const requestedHandle = $derived(page.params.handle ?? '');
  const isOwner = $derived(Boolean(profile && viewerProfile && profile.id === viewerProfile.id));
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const canonicalProfilePath = $derived(profile ? buildProfilePath(profile.primaryHandle) : '');
  const setupMetadata = $derived((profile?.metadata ?? {}) as ProfileMetadata);
  const hasOwnerTasks = $derived((isOwner ? ownerTasks : publicTasks).length > 0);

  const hasIdentityStepCompleted = $derived(Boolean(firstName.trim()));
  const hasCardStepCompleted = $derived(Boolean(profile?.cardVerification?.verifiedAt));
  const hasSocialStepCompleted = $derived(
    socialLinks.some((link) => Boolean(link.label.trim() && link.url.trim()))
  );
  const socialsStepHint = $derived(
    setupMetadata.cardBonusEligible
      ? hasSocialStepCompleted
        ? ''
        : localeText.profile.socialBonusHint
      : localeText.profile.socialOptionalHint
  );
  const profileSetupCompleted = $derived(
    setupMetadata.profileSetupCompleted === true || setupMetadata.profileSetupStep === 'done'
  );
  const onboardingStep = $derived.by(() => {
    if (!isOwner || !profile || profileSetupCompleted) {
      return null;
    }

    if (setupMetadata.profileSetupStep === 'card') {
      return 'card' as const;
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
    onboardingStep === 'identity' ? 1 : onboardingStep === 'card' ? 2 : onboardingStep === 'socials' ? 3 : 3
  );
  const topbarThemeActionLabel = $derived(
    isDarkTheme ? localeText.topbar.theme.switchToLight : localeText.topbar.theme.switchToDark
  );
  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: runtimeConfig.app.socialLinks.mastodon,
      icon: 'mdi:mastodon'
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: runtimeConfig.app.socialLinks.discord,
      icon: 'mdi:discord'
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: runtimeConfig.app.socialLinks.linkedin,
      icon: 'mdi:linkedin'
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: runtimeConfig.app.socialLinks.telegram,
      icon: 'mdi:telegram'
    }
  ]);
  const sidebarLegalLinks = $derived([
    {
      id: 'privacy' as const,
      label: localeText.topbar.legalLinks.privacy,
      href: '/privacy'
    },
    {
      id: 'terms' as const,
      label: localeText.topbar.legalLinks.terms,
      href: '/terms'
    },
    {
      id: 'company' as const,
      label: localeText.topbar.legalLinks.company,
      href: '/legal-information'
    }
  ]);
  const cardDigits = $derived(cardNumber.replace(/\D+/g, '').slice(0, 16));
  const cardPreview = $derived(
    Array.from({ length: 16 }, (_, index) => cardDigits[index] ?? '0')
      .join('')
      .replace(/(.{4})/g, '$1 ')
      .trim()
  );
  const cardHolderPreview = $derived(`${firstName.trim()} ${surname.trim()}`.trim() || profile?.displayName || 'LEFINE');

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

  $effect(() => {
    displayName = profile?.displayName ?? '';
    username = profile?.primaryHandle ?? '';
    bio = profile?.bio ?? '';
    isPublic = profile?.isPublic ?? false;
    referralPercent = profile?.referralPercent ?? 10;
    socialLinks = profile?.socialLinks.map((link) => ({ ...link })) ?? [];
    cardNumber = '';
    const nameParts = readProfileNameParts(profile);
    firstName = nameParts.firstName;
    surname = nameParts.surname;
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    const dependencyKey = [
      requestedHandle,
      authState.email ?? '',
      authState.address ?? '',
      authState.authType ?? '',
      passkeySession?.userId ?? ''
    ].join('|');

    if (dependencyKey === '__never__') {
      return;
    }

    void loadProfilePageState();
  });

  onMount(() => {
    if (!browser) {
      return;
    }

    isDarkTheme = document.documentElement.dataset.kefineTheme === 'dark';
    hydrateAuthStateFromSession();
    loadPasskeySession();
  });

  async function loadProfilePageState() {
    if (!browser) {
      return;
    }

    const currentPasskeySession = passkeySession;
    const userId = currentPasskeySession?.userId || authState.email?.trim().toLowerCase() || authState.address?.trim();
    const walletAddress = authState.address?.trim() || null;
    const walletHandle = walletAddress ? deriveWalletProfileHandle(walletAddress) : null;

    if (userId) {
      viewerProfile = ensureProfileForSession({
        storage: localStorage,
        userId,
        email: authState.email,
        displayName:
          currentPasskeySession?.username ||
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

    const storedProfile = getProfileByUsername(localStorage, requestedHandle);
    profile = storedProfile;

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
      await goto(buildProfilePath(storedProfile.primaryHandle), { replaceState: true });
    }
  }

  function addSocialLink() {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `social-${crypto.randomUUID()}` : `social-${Date.now()}`;
    socialLinks = [...socialLinks, { id, label: '', url: '' }];
  }

  function removeSocialLink(id: string) {
    socialLinks = socialLinks.filter((link) => link.id !== id);
  }

  async function copyLink(value: string, kind: 'profile' | 'task') {
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
    const nextPath = buildProfilePath(nextHandle);
    if (buildProfilePath(requestedHandle) !== nextPath) {
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
          label: link.label.trim(),
          url: link.url.trim()
        }))
        .filter((link) => link.label && link.url),
      metadata: nextMetadata(current, {
        firstName: firstName.trim(),
        surname: surname.trim()
      })
    }));

    if (updated) {
      syncOwnedOrderHandles(updated.id, updated.primaryHandle);
      profile = updated;
      await navigateToProfileHandle(updated.primaryHandle);
      void loadProfilePageState();
    }
  }

  async function saveIdentityStep() {
    if (!browser || !profile || !isOwner || !firstName.trim()) {
      return;
    }

    const nextHandle = resolveNextUsername(profile);
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      username: nextHandle,
      primaryHandle: nextHandle,
      displayName: fullName,
      bio: bio.trim(),
      metadata: nextMetadata(current, {
        firstName: firstName.trim(),
        surname: surname.trim(),
        profileSetupStep: 'card',
        profileSetupCompleted: false
      })
    }));

    if (updated) {
      syncOwnedOrderHandles(updated.id, updated.primaryHandle);
      profile = updated;
      username = updated.primaryHandle;
      displayName = updated.displayName;
      await navigateToProfileHandle(updated.primaryHandle);
      void loadProfilePageState();
    }
  }

  function goToOnboardingStep(step: 1 | 2 | 3) {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const profileSetupStep = step === 1 ? 'identity' : step === 2 ? 'card' : 'socials';
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

  function skipCardStep() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      metadata: nextMetadata(current, {
        profileSetupStep: 'socials',
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

  function toggleProfileTheme() {
    if (!browser) {
      return;
    }

    isDarkTheme = !isDarkTheme;
    document.documentElement.dataset.kefineTheme = isDarkTheme ? 'dark' : 'light';
    localStorage.setItem('kefine-theme', isDarkTheme ? 'dark' : 'light');
  }

  async function verifyProfileCard() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const digits = cardNumber.replace(/\D+/g, '');
    if (digits.length < 6) {
      return;
    }

    const response = await fetch('/api/profile/bin-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardNumber: digits })
    }).catch(() => null);

    if (!response) {
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          bin?: string;
          scheme?: string | null;
          cardType?: string | null;
          bankName?: string | null;
          countryAlpha2?: string | null;
          countryName?: string | null;
          isArmenianBank?: boolean;
          bonusEligible?: boolean;
          error?: string;
        }
      | null;

    if (!payload || payload.error) {
      return;
    }

    const verifiedAt = new Date().toISOString();
    let updated = updateStoredProfile(localStorage, profile.id, (current) => ({
      ...current,
      cardVerification: {
        status: payload.bonusEligible ? 'verified' : 'rejected',
        bin: payload.bin ?? digits.slice(0, 8),
        last4: digits.slice(-4),
        scheme: payload.scheme ?? undefined,
        cardType: payload.cardType ?? undefined,
        bankName: payload.bankName ?? undefined,
        countryAlpha2: payload.countryAlpha2 ?? undefined,
        countryName: payload.countryName ?? undefined,
        isArmenianBank: payload.isArmenianBank === true,
        verifiedAt,
        bonusGrantedAt: current.cardVerification?.bonusGrantedAt,
        rejectionReason: payload.bonusEligible ? undefined : 'Card is not tied to an Armenian bank allowlist issuer.'
      },
      metadata: nextMetadata(current, {
        profileSetupStep: 'socials',
        profileSetupCompleted: false,
        cardBonusEligible: payload.bonusEligible === true
      })
    }));

    if (updated) {
      profile = updated;
      void loadProfilePageState();
    }
  }

  function saveSocialLinksStep() {
    if (!browser || !profile || !isOwner) {
      return;
    }

    const nextSocialLinks = socialLinks
      .map((link) => ({
        ...link,
        label: link.label.trim(),
        url: link.url.trim()
      }))
      .filter((link) => link.label && link.url);

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
      void goto(buildProfilePath(updated.primaryHandle), { replaceState: true });
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
    await goto('/');
  }
</script>

<svelte:head>
  <title>{profile ? `${profile.displayName} | Lefine` : 'Profile | Lefine'}</title>
</svelte:head>

{#if unavailable}
  <section class="profile-page">
    <article class="profile-surface">
      <h1>{localeText.profile.profileUnavailable}</h1>
      <p>{localeText.profile.hidden}</p>
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
      githubLabel={localeText.topbar.githubLabel}
      githubUrl={runtimeConfig.app.githubUrl}
      themeLabel={topbarThemeActionLabel}
      signInLabel={localeText.topbar.signIn}
      signedInLabel={localeText.topbar.signedIn}
      authenticatedLabel={viewerProfile ? `@${viewerProfile.primaryHandle}` : null}
      authenticatedSecondaryLabel={null}
      authenticatedAvatarUrl={null}
      isAuthenticated={Boolean(viewerProfile)}
      isDarkTheme={isDarkTheme}
      isExpanded={leftNavExpanded}
      locale={$kefineLocale}
      languageEnglishLabel={localeText.topbar.languageEnglish}
      languageRussianLabel={localeText.topbar.languageRussian}
      languageArmenianLabel={localeText.topbar.languageArmenian}
      socialLinks={sidebarSocialLinks}
      legalLinks={sidebarLegalLinks}
      onToggleExpand={() => { leftNavExpanded = !leftNavExpanded; }}
      onBrandClick={() => { void goto('/'); }}
      onOpenEmailDraft={() => {
        if (browser) {
          window.location.href = 'mailto:hello@lefine.pro';
        }
      }}
      onOpenEmailDialog={() => {
        if (browser) {
          window.location.href = 'mailto:hello@lefine.pro';
        }
      }}
      onTheme={toggleProfileTheme}
      onAuth={() => {
        if (isOwner) {
          void signOut();
        } else {
          void goto('/');
        }
      }}
      onLocale={(locale: KefineLocale) => { setKefineLocale(locale); }}
    />

    {#if !(isOwner && onboardingStep)}
      <KefineProfileHero
        bind:firstName
        bind:surname
        bind:username
        isOwner={isOwner}
        isSetup={false}
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
              <KefineProfileHero
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
              <KefineProfileSetupDots currentStep={1} onSelect={goToOnboardingStep} />
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
                  aria-label={localeText.profile.continueToCard}
                  disabled={!hasIdentityStepCompleted}
                  onclick={saveIdentityStep}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 12h10m-4-4 4 4-4 4" />
                  </svg>
                </button>
              </lefine-box>
            </section>
          {:else if onboardingStep === 'card'}
            <section class="profile-surface profile-step-surface profile-step-surface--card">
              <KefineProfileHero
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
              <lefine-box class="profile-step-dots-wrap">
                <KefineProfileSetupDots currentStep={2} onSelect={goToOnboardingStep} />
              </lefine-box>
              <lefine-box class="profile-card-stage">
                <article class="profile-bonus-copy">
                  <small>{localeText.profile.cardStepTitle}</small>
                  <h2>{localeText.profile.bonusTitle}</h2>
                  <p>{localeText.profile.bonusText}</p>
                </article>

                <article class="profile-card-form">
                  <label class="profile-payment-card profile-payment-card--editable">
                    <small>Bank card</small>
                    <input
                      class="profile-payment-card__number"
                      type="text"
                      bind:value={cardNumber}
                      inputmode="numeric"
                      maxlength="19"
                      placeholder="0000 0000 0000 0000"
                    />
                    <lefine-text>{cardHolderPreview}</lefine-text>
                  </label>
                  <lefine-box class="profile-card-actions">
                    <button type="button" data-variant="ghost" onclick={skipCardStep}>
                      {localeText.profile.skipCard}
                    </button>
                    <button type="button" data-variant="primary" onclick={verifyProfileCard}>
                      {localeText.profile.verifyCard}
                    </button>
                  </lefine-box>
                  {#if profile.cardVerification}
                    <lefine-box class="profile-card-status" data-status={profile.cardVerification.status}>
                      <strong>{profile.cardVerification.bankName ?? 'Unknown bank'}</strong>
                      <lefine-text>{profile.cardVerification.countryName ?? 'Unknown country'} · BIN {profile.cardVerification.bin}</lefine-text>
                      {#if profile.cardVerification.rejectionReason}
                        <small>{profile.cardVerification.rejectionReason}</small>
                      {/if}
                    </lefine-box>
                  {/if}
                </article>
              </lefine-box>
            </section>
          {:else if onboardingStep === 'socials'}
            <section class="profile-surface profile-step-surface">
              <KefineProfileHero
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
              <KefineProfileSetupDots currentStep={3} onSelect={goToOnboardingStep} />
              <lefine-box class="profile-section__head">
                <lefine-box>
                  <strong>{localeText.profile.socialLinks}</strong>
                  <p>{localeText.profile.onboardingSubtitle}</p>
                </lefine-box>
                <button type="button" data-variant="ghost" onclick={addSocialLink}>{localeText.profile.addLink}</button>
              </lefine-box>
                <lefine-box class="profile-links">
                  {#each socialLinks as link (link.id)}
                    <lefine-box class="profile-links__row">
                    <input class="profile-onboarding-input" bind:value={link.label} placeholder={localeText.profile.socialLabel} />
                    <input class="profile-onboarding-input" bind:value={link.url} placeholder={localeText.profile.socialUrl} />
                    <button type="button" data-variant="ghost" onclick={() => removeSocialLink(link.id)}>×</button>
                  </lefine-box>
                {/each}
              </lefine-box>
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
                <lefine-text>{localeText.profile.displayName}</lefine-text>
                {#if isOwner}
                  <input type="text" bind:value={displayName} maxlength="64" />
                {:else}
                  <input type="text" value={profile.displayName} disabled />
                {/if}
              </label>
              <label class="profile-field">
                <lefine-text>{localeText.profile.bio}</lefine-text>
                {#if isOwner}
                  <textarea bind:value={bio} rows="5"></textarea>
                {:else}
                  <textarea value={profile.bio || localeText.profile.subtitle} rows="5" disabled></textarea>
                {/if}
              </label>
              <lefine-box class="profile-grid-two">
                <label class="profile-field">
                  <lefine-text>{localeText.profile.firstName}</lefine-text>
                  <input type="text" bind:value={firstName} disabled={!isOwner} />
                </label>
                <label class="profile-field">
                  <lefine-text>{localeText.profile.surname}</lefine-text>
                  <input type="text" bind:value={surname} disabled={!isOwner} />
                </label>
              </lefine-box>
              <lefine-box class="profile-grid-two">
                <label class="profile-field">
                  <lefine-text>{localeText.profile.referralPercent}</lefine-text>
                  {#if isOwner}
                    <input bind:value={referralPercent} min="0" max="100" step="1" type="number" />
                  {:else}
                    <input value={profile.referralPercent} disabled />
                  {/if}
                </label>
                <lefine-box class="profile-field">
                  <lefine-text>{localeText.profile.publicToggle}</lefine-text>
                  <input type="text" value={isPublic ? localeText.profile.publicStatus : localeText.profile.privateStatus} disabled />
                </lefine-box>
              </lefine-box>
            </lefine-box>

            <lefine-box class="profile-grid-two">
              <section class="profile-section">
                <lefine-box class="profile-section__head">
                  <strong>{localeText.profile.socialLinks}</strong>
                  {#if isOwner}
                    <button type="button" data-variant="ghost" onclick={addSocialLink}>{localeText.profile.addLink}</button>
                  {/if}
                </lefine-box>

                {#if isOwner}
                  <lefine-box class="profile-links">
                    {#each socialLinks as link (link.id)}
                      <lefine-box class="profile-links__row">
                        <input bind:value={link.label} placeholder={localeText.profile.socialLabel} />
                        <input bind:value={link.url} placeholder={localeText.profile.socialUrl} />
                        <button type="button" data-variant="ghost" onclick={() => removeSocialLink(link.id)}>×</button>
                      </lefine-box>
                    {/each}
                  </lefine-box>
                {:else if profile.socialLinks.length > 0}
                  <lefine-box class="profile-links-list">
                    {#each profile.socialLinks as link (link.id)}
                      <a href={link.url} rel="noreferrer" target="_blank">{link.label}</a>
                    {/each}
                  </lefine-box>
                {:else}
                  <p>{localeText.profile.noPublicTasks}</p>
                {/if}
              </section>

              <section class="profile-section">
                <small>{localeText.profile.cardStepTitle}</small>
                <strong>{localeText.profile.bonusTitle}</strong>
                <p>{localeText.profile.bonusText}</p>
                <lefine-box class="profile-balance">
                  <strong>{localeText.profile.bonusBalance}</strong>
                  <lefine-text>${profile.bonusBalanceUsd.toFixed(2)}</lefine-text>
                </lefine-box>
              </section>
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
              <strong>{localeText.profile.closedTasks}</strong>
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
                      <a href={`/shared/tasks/${order.shareId ?? encodeURIComponent(order.id)}`}>{localeText.profile.openTask}</a>
                      <button
                        type="button"
                        data-variant="ghost"
                        onclick={() =>
                          copyLink(
                            browser
                              ? `${window.location.origin}/shared/tasks/${order.shareId ?? encodeURIComponent(order.id)}`
                              : `/shared/tasks/${order.shareId ?? encodeURIComponent(order.id)}`,
                            'task'
                          )}
                      >
                        {copyState === 'task' ? localeText.profile.taskCopied : localeText.profile.shareTask}
                      </button>
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
  .profile-surface,
  .profile-section,
  .profile-task,
  .profile-balance,
  .profile-card-status {
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

  .profile-section__head,
  .profile-task__head,
  .profile-task__actions,
  .profile-links__row,
  .profile-rules__row,
  .profile-toggle,
  .profile-links-list,
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

  .profile-bonus-copy,
  .profile-card-form {
    display: grid;
    gap: 0.4rem;
  }

  .profile-bonus-copy h2,
  .profile-bonus-copy p,
  .profile-task__head p,
  .profile-section__head p {
    margin: 0;
  }

  .profile-section__head p,
  .profile-bonus-copy small {
    color: var(--kef-color-muted);
  }

  .profile-step-surface,
  .profile-details,
  .profile-tasks,
  .profile-task-list,
  .profile-links,
  .profile-rules {
    display: grid;
    gap: 1rem;
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

  .profile-step-surface--card {
    align-content: start;
  }

  .profile-step-dots-wrap {
    display: flex;
    justify-content: center;
    padding-top: 0.1rem;
  }

  .profile-card-stage {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    gap: 1rem;
    align-items: start;
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
    width: 4rem;
    height: 4rem;
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

  .profile-onboarding-field {
    padding: 0.4rem 0;
    border-bottom: 1px solid color-mix(in oklab, var(--kef-color-text) 12%, transparent);
  }

  .profile-onboarding-field lefine-text {
    color: var(--kef-color-muted);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .profile-field lefine-text,
  .profile-section__head strong,
  .profile-task__head strong {
    font-size: 0.94rem;
  }

  .profile-field input,
  .profile-field textarea,
  .profile-links__row input,
  .profile-rules__row input[type='number'],
  .profile-card-form input {
    width: 100%;
  }

  .profile-bonus-copy,
  .profile-card-form,
  .profile-links__row,
  .profile-rules__row {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg) 45%, var(--kef-color-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 8%, transparent);
  }

  .profile-card-form {
    align-content: start;
    gap: 1rem;
  }

  .profile-card-actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
  }

  .profile-card-actions > button {
    flex: 1 1 0;
  }

  .profile-step-surface--card .profile-bonus-copy {
    align-content: center;
  }

  .profile-step-surface--card .profile-card-form {
    width: 100%;
    margin: 0;
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

  .profile-payment-card small,
  .profile-payment-card lefine-text {
    color: var(--kef-color-muted);
  }

  .profile-payment-card strong,
  .profile-payment-card__number {
    font-size: clamp(1.5rem, 3vw, 2rem);
    letter-spacing: 0.12em;
    font-weight: 600;
  }

  .profile-payment-card--editable {
    cursor: text;
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

  .profile-card-form .profile-field input,
  .profile-onboarding-input {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--kef-color-text);
    font-size: clamp(1.2rem, 2vw, 1.7rem);
    line-height: 1.15;
    box-shadow: none;
  }

  .profile-card-form .profile-field input::placeholder,
  .profile-onboarding-input::placeholder {
    color: color-mix(in oklab, var(--kef-color-text) 54%, transparent);
    opacity: 1;
  }

  .profile-card-form .profile-field input:focus,
  .profile-onboarding-input:focus {
    outline: none;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .profile-balance {
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-primary) 10%, var(--kef-color-bg-card));
  }

  .profile-card-status[data-status='verified'] {
    background: color-mix(in oklab, var(--kef-color-success) 16%, var(--kef-color-bg-card));
  }

  .profile-card-status[data-status='rejected'] {
    background: color-mix(in oklab, var(--kef-color-error) 12%, var(--kef-color-bg-card));
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

  .profile-links-list {
    flex-wrap: wrap;
  }

  .profile-surface a,
  .profile-task a {
    color: inherit;
  }

  @media (max-width: 980px) {
    .profile-layout,
    .profile-layout--single,
    .profile-grid-two,
    .profile-grid-two--card {
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

    .profile-step-surface--card .profile-card-form,
    .profile-step-surface--card .profile-bonus-copy {
      width: 100%;
    }

    .profile-card-stage {
      grid-template-columns: 1fr;
    }

    .profile-card-actions {
      flex-direction: column;
    }

  }
</style>

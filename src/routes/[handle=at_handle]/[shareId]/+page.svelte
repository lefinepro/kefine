<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import KefineServiceEditorPage from '$lib/components/kefine/KefineServiceEditorPage.svelte';
  import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
  import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';
  import type { KefineLocaleText } from '$lib/constants/kefine-locale';
  import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import { parseStoredOrders } from '$lib/components/kefine/kefine-workflow';
  import { fetchTemplateByHandleAndSlug } from '$lib/templates/template-api';
  import type { OrderView, TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import type { Profile, ProfileTemplate } from '$lib/types/user';
  import {
    buildProfilePath,
    buildCanonicalServicePath,
    ensureProfileForSession,
    getGrantedTaskAccessKinds,
    getProfileByUsername,
    grantTaskAccess,
    isDefaultActorHandle
  } from '$lib/profile/profile-storage';

  const localeText: KefineLocaleText =
    (typeof document !== 'undefined' && document.documentElement.lang === 'ru' ? KEFINE_TEXT_RU : KEFINE_TEXT_EN) as
      unknown as KefineLocaleText;
  const passkeySession = $derived($passkeySessionStore);

  let order = $state<OrderView | null>(null);
  let ownerProfile = $state<Profile | null>(null);
  let template = $state<ProfileTemplate | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let grantedKinds = $state<TaskAccessMode[]>([]);
  let unavailable = $state(false);
  let redirectingTemplate = $state(false);
  let loadKey = $state('');
  const runtimeConfig = $derived(readBrowserPublicRuntimeConfig());
  const isOwnerTemplateView = $derived(Boolean(template && ownerProfile && viewerProfile && ownerProfile.id === viewerProfile.id));
  const canSeeFullTask = $derived(
    order
      ? viewerProfile?.id === order.ownerProfileId ||
          grantedKinds.includes('view') ||
          order.accessRules?.view?.enabled !== true
      : false
  );

  function matchesTaskSegment(orderItem: OrderView, segment: string, ownerProfileId: string): boolean {
    if (orderItem.ownerProfileId !== ownerProfileId) {
      return false;
    }

    const normalizedSegment = segment.trim();
    if (!normalizedSegment) {
      return false;
    }

    const shareId = orderItem.shareId?.trim();
    const orderId = orderItem.id.trim();
    return (
      shareId === normalizedSegment ||
      orderId === normalizedSegment ||
      encodeURIComponent(shareId ?? '') === normalizedSegment ||
      encodeURIComponent(orderId) === normalizedSegment ||
      orderId.endsWith(`/${normalizedSegment}`) ||
      (shareId?.endsWith(`/${normalizedSegment}`) ?? false)
    );
  }

  function buildDefaultActorProfile(): Profile | null {
    const handle = runtimeConfig.defaultActor.handle?.trim();
    if (!handle || !isDefaultActorHandle(page.params.handle ?? '', handle)) {
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

  onMount(() => {
    async function init() {
      if (!browser) {
        return;
      }

      hydrateAuthStateFromSession();
      loadPasskeySession();
      unavailable = false;
      redirectingTemplate = false;
      order = null;
      template = null;
      grantedKinds = [];
      ownerProfile = getProfileByUsername(localStorage, page.params.handle ?? '') ?? buildDefaultActorProfile();
      if (!ownerProfile) {
        unavailable = true;
        return;
      }

      const walletAddress = authState.address?.trim() || null;
      const userId = passkeySession?.userId || authState.userId?.trim() || authState.email?.trim().toLowerCase() || walletAddress;
      viewerProfile = userId
        ? ensureProfileForSession({
            storage: localStorage,
            userId,
            email: authState.email,
            displayName: passkeySession?.username || authState.displayName?.trim() || authState.handle?.trim() || authState.email?.split('@')[0] || authState.address || 'user',
            avatarUrl: undefined,
            authType: passkeySession ? 'passkey' : authState.authType,
            walletAddress: authState.address,
            walletAlias: null
          })
        : null;

      template = await fetchTemplateByHandleAndSlug(runtimeConfig.backend.craterBaseUrl, ownerProfile.primaryHandle, page.params.shareId ?? '');
      if (template && viewerProfile?.id === ownerProfile.id) {
        return;
      }

      if (template && (template.visibility ?? (template.isPublished ? 'public' : 'private')) === 'public') {
        redirectingTemplate = true;
        void goto(buildCanonicalServicePath(ownerProfile.primaryHandle, template.slug, runtimeConfig.defaultActor.handle), { replaceState: true });
        return;
      }

      const ownerProfileId = ownerProfile.id;
      const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
      const sharedOrder =
        storedOrders.find(
          (item) => matchesTaskSegment(item, page.params.shareId ?? '', ownerProfileId)
        ) ?? null;

      if (!sharedOrder) {
        unavailable = true;
        return;
      }

      order = sharedOrder;
      if (!userId || !sharedOrder.ownerProfileId || !viewerProfile) {
        return;
      }

      grantedKinds = getGrantedTaskAccessKinds({
        storage: localStorage,
        orderId: sharedOrder.id,
        ownerProfileId: sharedOrder.ownerProfileId,
        buyerProfileId: viewerProfile.id
      });
    }

    const nextLoadKey = [
      page.params.handle ?? '',
      page.params.shareId ?? '',
      authState.email ?? '',
      authState.address ?? '',
      authState.authType ?? '',
      passkeySession?.userId ?? ''
    ].join('|');

    if (nextLoadKey === loadKey) {
      return;
    }

    loadKey = nextLoadKey;
    void init();
  });

  function grant(kind: TaskAccessMode) {
    if (!browser || !order || !viewerProfile || !order.ownerProfileId) {
      return;
    }

    grantTaskAccess({
      storage: localStorage,
      orderId: order.id,
      ownerProfileId: order.ownerProfileId,
      buyerProfileId: viewerProfile.id,
      kind,
      priceUsd: order.accessRules?.[kind]?.priceUsd ?? 0
    });

    grantedKinds = getGrantedTaskAccessKinds({
      storage: localStorage,
      orderId: order.id,
      ownerProfileId: order.ownerProfileId,
      buyerProfileId: viewerProfile.id
    });
  }
</script>

<svelte:head>
  <title>{template ? `${template.title} | Lefine` : order ? `${order.title} | Lefine` : 'Task | Lefine'}</title>
</svelte:head>

{#if isOwnerTemplateView && template && ownerProfile}
  <KefineServiceEditorPage profile={ownerProfile} craterBaseUrl={runtimeConfig.backend.craterBaseUrl} service={template} />
{:else if redirectingTemplate}
  <lef-shared-task-page>
    <lef-shared-task-card>
      <h1>{template?.title ?? 'Service'}</h1>
      <p>Redirecting to Lefine…</p>
    </lef-shared-task-card>
  </lef-shared-task-page>
{:else}
  <lef-shared-task-page>
    {#if unavailable}
      <lef-shared-task-card>
        <h1>{localeText.profile.profileUnavailable}</h1>
        <p>{localeText.profile.noPublicTasks}</p>
      </lef-shared-task-card>
    {:else if order}
      <lef-shared-task-card>
        <lef-shared-task-head>
          <h1>{order.title}</h1>
          {#if ownerProfile}
            <a href={buildProfilePath(ownerProfile.primaryHandle || ownerProfile.username)}>{ownerProfile.displayName}</a>
          {/if}
        </lef-shared-task-head>
        <p>{canSeeFullTask ? order.description : `${localeText.profile.buyView} to unlock the full task details.`}</p>
        <lef-shared-task-meta>
          <lefine-text>{order.solver}</lefine-text>
          <lefine-text>{order.status}</lefine-text>
          {#if order.estimatedCost !== undefined}
            <lefine-text>${order.estimatedCost.toFixed(2)}</lefine-text>
          {/if}
        </lef-shared-task-meta>
      </lef-shared-task-card>

      <lef-shared-task-card>
        <h2>{localeText.profile.publicTasks}</h2>
        <lef-shared-task-access>
          {#each ([
            ['view', localeText.profile.buyView],
            ['watch', localeText.profile.buyWatch],
            ['join', localeText.profile.buyJoin]
          ] as const) as [kind, label]}
            {#if order.accessRules?.[kind]?.enabled}
              <button
                type="button"
                data-variant={grantedKinds.includes(kind) ? 'ghost' : 'primary'}
                onclick={() => grant(kind)}
              >
                {grantedKinds.includes(kind)
                  ? `${localeText.profile.accessGranted}: ${label}`
                  : `${label} · $${(order.accessRules?.[kind]?.priceUsd ?? 0).toFixed(0)}`}
            </button>
          {/if}
        {/each}
        </lef-shared-task-access>
      </lef-shared-task-card>
    {/if}
  </lef-shared-task-page>
{/if}

<style>
  lef-shared-task-page {
    display: grid;
    width: min(46rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 6rem 0 2rem;
    display: grid;
    gap: 1rem;
  }

  lef-shared-task-card,
  lef-shared-task-access {
    display: grid;
    gap: 0.75rem;
  }

  lef-shared-task-card {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white);
    box-shadow: 0 14px 24px color-mix(in oklab, var(--lefine-text) 5%, transparent);
  }

  lef-shared-task-head,
  lef-shared-task-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  lef-shared-task-card h1,
  lef-shared-task-card h2,
  lef-shared-task-card p {
    margin: 0;
  }
</style>

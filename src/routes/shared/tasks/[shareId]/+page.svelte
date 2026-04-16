<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
  import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';
  import { parseStoredOrders } from '$lib/components/kefine/kefine-workflow';
  import type { OrderView, TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import type { KefineLocaleText } from '$lib/constants/kefine-locale';
  import type { Profile } from '$lib/types/user';
  import {
    ensureProfileForSession,
    getGrantedTaskAccessKinds,
    grantTaskAccess,
    getProfileById,
    buildProfilePath
  } from '$lib/profile/profile-storage';
  import { localizeAppPath, readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';

  const localeText: KefineLocaleText =
    (typeof document !== 'undefined' && document.documentElement.lang === 'ru' ? KEFINE_TEXT_RU : KEFINE_TEXT_EN) as
      unknown as KefineLocaleText;

  let order = $state<OrderView | null>(null);
  let ownerProfile = $state<Profile | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let grantedKinds = $state<TaskAccessMode[]>([]);
  let unavailable = $state(false);
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? 'en');
  const canSeeFullTask = $derived(
    order
      ? viewerProfile?.id === order.ownerProfileId ||
          grantedKinds.includes('view') ||
          order.accessRules?.view?.enabled !== true
      : false
  );

  onMount(() => {
    if (!browser) {
      return;
    }

    hydrateAuthStateFromSession();
    const storedOrders = parseStoredOrders(localStorage.getItem('kefine-created-orders-v1'), localeText);
    const sharedOrder =
      storedOrders.find((item) => item.shareId === page.params.shareId) ||
      storedOrders.find((item) => encodeURIComponent(item.id) === page.params.shareId);

    if (!sharedOrder) {
      unavailable = true;
      return;
    }

    order = sharedOrder;
    ownerProfile = sharedOrder.ownerProfileId ? getProfileById(localStorage, sharedOrder.ownerProfileId) : null;

    const userId = authState.userId?.trim() || authState.email?.trim().toLowerCase() || authState.address?.trim();
    if (!userId || !sharedOrder.ownerProfileId) {
      return;
    }

    viewerProfile = ensureProfileForSession({
      storage: localStorage,
      userId,
      email: authState.email,
      displayName: authState.displayName?.trim() || authState.handle?.trim() || authState.email?.split('@')[0] || authState.address || 'user',
      avatarUrl: undefined,
      authType: authState.authType,
      walletAddress: authState.address,
      walletAlias: null
    });
    grantedKinds = getGrantedTaskAccessKinds({
      storage: localStorage,
      orderId: sharedOrder.id,
      ownerProfileId: sharedOrder.ownerProfileId,
      buyerProfileId: viewerProfile.id
    });
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
  <title>{order ? `${order.title} | Lefine` : 'Task | Lefine'}</title>
</svelte:head>

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
          <a href={localizeAppPath(buildProfilePath(ownerProfile.primaryHandle || ownerProfile.username), activeLocale)}>{ownerProfile.displayName}</a>
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

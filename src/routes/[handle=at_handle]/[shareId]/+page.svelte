<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { authState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
  import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';
  import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import { parseStoredOrders } from '$lib/components/kefine/kefine-workflow';
  import { fetchTemplateByHandleAndSlug } from '$lib/templates/template-api';
  import type { OrderView, TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import type { Profile, ProfileTemplate } from '$lib/types/user';
  import {
    buildProfilePath,
    ensureProfileForSession,
    getGrantedTaskAccessKinds,
    getProfileByUsername,
    grantTaskAccess
  } from '$lib/profile/profile-storage';

  const localeText =
    typeof document !== 'undefined' && document.documentElement.lang === 'ru' ? KEFINE_TEXT_RU : KEFINE_TEXT_EN;

  let order = $state<OrderView | null>(null);
  let ownerProfile = $state<Profile | null>(null);
  let template = $state<ProfileTemplate | null>(null);
  let viewerProfile = $state<Profile | null>(null);
  let grantedKinds = $state<TaskAccessMode[]>([]);
  let unavailable = $state(false);
  let redirectingTemplate = $state(false);
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

  onMount(() => {
    async function init() {
    if (!browser) {
      return;
    }

    hydrateAuthStateFromSession();
    ownerProfile = getProfileByUsername(localStorage, page.params.handle ?? '');
    if (!ownerProfile) {
      unavailable = true;
      return;
    }

    const runtimeConfig = readBrowserPublicRuntimeConfig();
    template = await fetchTemplateByHandleAndSlug(runtimeConfig.backend.craterBaseUrl, ownerProfile.primaryHandle, page.params.shareId ?? '');
    if (template?.isPublished) {
      redirectingTemplate = true;
      void goto(
        `/?templateHandle=${encodeURIComponent(ownerProfile.primaryHandle)}&templateSlug=${encodeURIComponent(template.slug)}`,
        { replaceState: true }
      );
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

    const userId = authState.email?.trim().toLowerCase() || authState.address?.trim();
    if (!userId || !sharedOrder.ownerProfileId) {
      return;
    }

    viewerProfile = ensureProfileForSession({
      storage: localStorage,
      userId,
      email: authState.email,
      displayName: authState.email?.split('@')[0] || authState.address || 'user',
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
    }

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

{#if redirectingTemplate}
  <section class="shared-task-page">
    <article class="shared-task-card">
      <h1>{template?.title ?? 'Template'}</h1>
      <p>Redirecting to Lefine…</p>
    </article>
  </section>
{:else}
  <section class="shared-task-page">
    {#if unavailable}
      <article class="shared-task-card">
        <h1>{localeText.profile.profileUnavailable}</h1>
        <p>{localeText.profile.noPublicTasks}</p>
      </article>
    {:else if order}
      <article class="shared-task-card">
        <header>
          <h1>{order.title}</h1>
          {#if ownerProfile}
            <a href={buildProfilePath(ownerProfile.primaryHandle || ownerProfile.username)}>{ownerProfile.displayName}</a>
          {/if}
        </header>
        <p>{canSeeFullTask ? order.description : `${localeText.profile.buyView} to unlock the full task details.`}</p>
        <lefine-box class="shared-task-meta">
          <lefine-text>{order.solver}</lefine-text>
          <lefine-text>{order.status}</lefine-text>
          {#if order.estimatedCost !== undefined}
            <lefine-text>${order.estimatedCost.toFixed(2)}</lefine-text>
          {/if}
        </lefine-box>
      </article>

      <article class="shared-task-card">
        <h2>{localeText.profile.publicTasks}</h2>
        <lefine-box class="shared-task-access">
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
        </lefine-box>
      </article>
    {/if}
  </section>
{/if}

<style>
  .shared-task-page {
    width: min(46rem, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 6rem 0 2rem;
    display: grid;
    gap: 1rem;
  }

  .shared-task-card,
  .shared-task-access {
    display: grid;
    gap: 0.75rem;
  }

  .shared-task-card {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white);
    box-shadow: 0 14px 24px color-mix(in oklab, var(--lefine-text) 5%, transparent);
  }

  .shared-task-card header,
  .shared-task-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  .shared-task-card h1,
  .shared-task-card h2,
  .shared-task-card p {
    margin: 0;
  }
</style>

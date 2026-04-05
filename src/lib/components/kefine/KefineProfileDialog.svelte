<script lang="ts">
  import { browser } from '$app/environment';
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';
  import KefineProfileSocialLinksCard from '$lib/components/kefine/KefineProfileSocialLinksCard.svelte';
  import type { ProfileSocialLink } from '$lib/types/user';
  import type { OrderView, TaskAccessMode } from '$lib/components/kefine/kefine-workflow';
  import type { Profile } from '$lib/types/user';

  type Labels = {
    title: string;
    subtitle: string;
    username: string;
    displayName: string;
    bio: string;
    publicToggle: string;
    socialLinks: string;
    socialLabel: string;
    socialUrl: string;
    addLink: string;
    save: string;
    signOut: string;
    shareProfile: string;
    openPublicProfile: string;
    closedTasks: string;
    publicTask: string;
    viewAccess: string;
    watchAccess: string;
    joinAccess: string;
    cardTitle: string;
    cardHint: string;
    cardNumber: string;
    verifyCard: string;
    bonusBalance: string;
    referralPercent: string;
    profileCopied: string;
    taskCopied: string;
    shareTask: string;
  };

  let {
    open,
    profile,
    tasks,
    profileUrl,
    taskShareBaseUrl,
    labels,
    onClose,
    onSave,
    onSignOut,
    onVerifyCard,
    onUpdateTask
  }: {
    open: boolean;
    profile: Profile | null;
    tasks: OrderView[];
    profileUrl: string;
    taskShareBaseUrl: string;
    labels: Labels;
    onClose: () => void;
    onSave: (payload: {
      username: string;
      displayName: string;
      bio: string;
      isPublic: boolean;
      referralPercent: number;
      socialLinks: ProfileSocialLink[];
    }) => void;
    onSignOut: () => void;
    onVerifyCard: (cardNumber: string) => Promise<void> | void;
    onUpdateTask: (
      orderId: string,
      patch: Partial<Pick<OrderView, 'isPublicTask' | 'accessRules'>>
    ) => void;
  } = $props();

  let username = $state('');
  let displayName = $state('');
  let bio = $state('');
  let isPublic = $state(false);
  let referralPercent = $state(10);
  let socialLinks = $state<ProfileSocialLink[]>([]);
  let cardNumber = $state('');
  let copyStatus = $state<'idle' | 'profile' | 'task'>('idle');

  $effect(() => {
    username = profile?.username ?? '';
    displayName = profile?.displayName ?? '';
    bio = profile?.bio ?? '';
    isPublic = profile?.isPublic ?? false;
    referralPercent = profile?.referralPercent ?? 10;
    socialLinks = profile?.socialLinks.map((link) => ({ ...link })) ?? [];
    cardNumber = '';
  });

  function addSocialLink() {
    socialLinks = [...socialLinks, { id: `social-${crypto.randomUUID()}`, type: 'website', label: 'Website', value: '' }];
  }

  function removeSocialLink(id: string) {
    socialLinks = socialLinks.filter((link) => link.id !== id);
  }

  async function copyLink(value: string, kind: 'profile' | 'task') {
    if (!browser || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    copyStatus = kind;
    setTimeout(() => {
      if (copyStatus === kind) {
        copyStatus = 'idle';
      }
    }, 1400);
  }

  function updateTaskRule(order: OrderView, mode: TaskAccessMode, patch: { enabled?: boolean; priceUsd?: number }) {
    const nextRules = {
      ...order.accessRules,
      [mode]: {
        enabled: patch.enabled ?? order.accessRules?.[mode]?.enabled ?? false,
        priceUsd: patch.priceUsd ?? order.accessRules?.[mode]?.priceUsd ?? 0
      }
    };

    onUpdateTask(order.id, {
      accessRules: nextRules
    });
  }

  function submitProfile() {
    onSave({
      username,
      displayName,
      bio,
      isPublic,
      referralPercent,
      socialLinks: socialLinks
        .map((link) => ({
          ...link,
          label: link.label?.trim() || undefined,
          value: link.value.trim()
        }))
        .filter((link) => link.value)
    });
  }
</script>

<KefineModal open={open} onClose={onClose} closeLabel="Close" width="min(58rem, calc(100vw - 2rem))">
  <kefine-profile-dialog>
    <kefine-profile-header>
      <lefine-box>
        <h2>{labels.title}</h2>
        <p>{labels.subtitle}</p>
      </lefine-box>
      <kefine-profile-header-actions>
        <button type="button" data-variant="ghost" onclick={() => copyLink(profileUrl, 'profile')}>
          {copyStatus === 'profile' ? labels.profileCopied : labels.shareProfile}
        </button>
        <a href={profileUrl} target="_blank" rel="noreferrer">{labels.openPublicProfile}</a>
      </kefine-profile-header-actions>
    </kefine-profile-header>

    {#if profile}
      <kefine-profile-grid>
        <kefine-profile-card>
          <label>
            <lefine-text>{labels.username}</lefine-text>
            <input bind:value={username} maxlength="32" />
          </label>
          <label>
            <input bind:value={displayName} maxlength="64" aria-label={labels.displayName} />
          </label>
          <label>
            <lefine-text>{labels.bio}</lefine-text>
            <textarea bind:value={bio} rows="4"></textarea>
          </label>
          <label>
            <lefine-text>{labels.referralPercent}</lefine-text>
            <input bind:value={referralPercent} min="0" max="100" step="1" type="number" />
          </label>
          <kefine-profile-toggle>
            <input bind:checked={isPublic} type="checkbox" />
            <lefine-text>{labels.publicToggle}</lefine-text>
          </kefine-profile-toggle>
          <kefine-profile-balance>
            <strong>{labels.bonusBalance}</strong>
            <lefine-text>${profile.bonusBalanceUsd.toFixed(2)}</lefine-text>
          </kefine-profile-balance>
        </kefine-profile-card>

        <kefine-profile-card>
          <KefineProfileSocialLinksCard
            bind:links={socialLinks}
            title={labels.socialLinks}
            valuePlaceholder={labels.socialUrl}
            emptyText=""
            isOwner={true}
          />
        </kefine-profile-card>

        <kefine-profile-card>
          <kefine-profile-card-head>
            <strong>{labels.cardTitle}</strong>
          </kefine-profile-card-head>
          <p>{labels.cardHint}</p>
          <kefine-profile-verify>
            <input bind:value={cardNumber} inputmode="numeric" placeholder={labels.cardNumber} />
            <button type="button" data-variant="primary" onclick={() => onVerifyCard(cardNumber)}>
              {labels.verifyCard}
            </button>
          </kefine-profile-verify>
          {#if profile.cardVerification}
            <kefine-card-status data-status={profile.cardVerification.status}>
              <strong>{profile.cardVerification.bankName ?? 'Unknown bank'}</strong>
              <lefine-text>
                {profile.cardVerification.countryName ?? 'Unknown country'} · BIN {profile.cardVerification.bin}
              </lefine-text>
              {#if profile.cardVerification.rejectionReason}
                <small>{profile.cardVerification.rejectionReason}</small>
              {/if}
            </kefine-card-status>
          {/if}
        </kefine-profile-card>
      </kefine-profile-grid>

      <kefine-profile-card>
        <kefine-profile-card-head>
          <strong>{labels.closedTasks}</strong>
        </kefine-profile-card-head>
        <kefine-profile-tasks>
          {#each tasks as order (order.id)}
            <kefine-profile-task>
              <kefine-profile-task-head>
                <lefine-box>
                  <strong>{order.title}</strong>
                  <p>{order.solver}</p>
                </lefine-box>
                <kefine-profile-task-actions>
                  <button
                    type="button"
                    data-variant="ghost"
                    onclick={() => copyLink(`${taskShareBaseUrl}/${order.shareId ?? encodeURIComponent(order.id)}`, 'task')}
                  >
                    {copyStatus === 'task' ? labels.taskCopied : labels.shareTask}
                  </button>
                </kefine-profile-task-actions>
              </kefine-profile-task-head>
              <kefine-profile-toggle>
                <input
                  checked={order.isPublicTask === true}
                  type="checkbox"
                  onchange={(event) =>
                    onUpdateTask(order.id, { isPublicTask: (event.currentTarget as HTMLInputElement).checked })}
                />
                <lefine-text>{labels.publicTask}</lefine-text>
              </kefine-profile-toggle>
              <kefine-profile-rules>
                {#each ([
                  ['view', labels.viewAccess],
                  ['watch', labels.watchAccess],
                  ['join', labels.joinAccess]
                ] as const) as [mode, label]}
                  <kefine-profile-rules-row>
                    <kefine-profile-toggle>
                      <input
                        checked={order.accessRules?.[mode]?.enabled === true}
                        type="checkbox"
                        onchange={(event) =>
                          updateTaskRule(order, mode, { enabled: (event.currentTarget as HTMLInputElement).checked })}
                      />
                      <lefine-text>{label}</lefine-text>
                    </kefine-profile-toggle>
                    <input
                      min="0"
                      step="1"
                      type="number"
                      value={order.accessRules?.[mode]?.priceUsd ?? 0}
                      onchange={(event) =>
                        updateTaskRule(order, mode, { priceUsd: Number((event.currentTarget as HTMLInputElement).value) })}
                    />
                  </kefine-profile-rules-row>
                {/each}
              </kefine-profile-rules>
            </kefine-profile-task>
          {/each}
        </kefine-profile-tasks>
      </kefine-profile-card>

      <kefine-profile-footer>
        <button type="button" data-variant="ghost" onclick={onSignOut}>{labels.signOut}</button>
        <button type="button" data-variant="primary" onclick={submitProfile}>{labels.save}</button>
      </kefine-profile-footer>
    {/if}
  </kefine-profile-dialog>
</KefineModal>

<style>
  kefine-profile-dialog {
    display: grid;
    gap: 1rem;
  }

  kefine-profile-header,
  kefine-profile-header-actions,
  kefine-profile-card-head,
  kefine-profile-footer,
  kefine-profile-task-head,
  kefine-profile-task-actions,
  kefine-profile-verify,
  kefine-profile-rules-row,
  kefine-profile-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  kefine-profile-header,
  kefine-profile-task-head,
  kefine-profile-card-head {
    justify-content: space-between;
  }

  kefine-profile-header h2,
  kefine-profile-header p,
  kefine-profile-task-head p {
    margin: 0;
  }

  kefine-profile-grid,
  kefine-profile-tasks {
    display: grid;
    gap: 0.9rem;
  }

  kefine-profile-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  kefine-profile-card,
  kefine-profile-task {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white);
    box-shadow: 0 12px 24px color-mix(in oklab, var(--lefine-text) 4%, transparent);
  }

  kefine-profile-card label {
    display: grid;
    gap: 0.35rem;
  }

  kefine-profile-balance {
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem 0.9rem;
    border-radius: 0.85rem;
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
  }

  kefine-profile-verify,
  kefine-profile-rules-row {
    align-items: stretch;
  }

  kefine-profile-verify input,
  kefine-profile-rules-row input[type='number'] {
    width: 100%;
  }

  kefine-card-status {
    display: grid;
    gap: 0.18rem;
    padding: 0.85rem 0.9rem;
    border-radius: 0.85rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 70%, transparent);
  }

  kefine-card-status[data-status='verified'] {
    background: color-mix(in oklab, var(--kef-success) 16%, var(--kef-bg-card));
  }

  kefine-card-status[data-status='rejected'] {
    background: color-mix(in oklab, var(--kef-error) 14%, var(--kef-bg-card));
  }

  kefine-profile-rules {
    display: grid;
    gap: 0.55rem;
  }

  kefine-profile-rules-row kefine-profile-toggle {
    flex: 1 1 auto;
  }

  kefine-profile-task-actions {
    justify-content: flex-end;
  }

  @media (max-width: 860px) {
    kefine-profile-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

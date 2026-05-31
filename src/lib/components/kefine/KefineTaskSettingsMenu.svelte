<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { normalizeProfileResourceSlug } from '$lib/profile/profile-handles';
  import type { OrderRepository, OrderView, RepositoryGitAclRule, RepositoryGitSettings } from './kefine-workflow';

  let {
    order,
    repositoriesEnabled = true,
    onApply
  }: {
    order: OrderView | null;
    repositoriesEnabled?: boolean;
    onApply: (patch: Partial<Pick<OrderView, 'title' | 'description' | 'taskIcon' | 'shareId' | 'isPublicTask' | 'vcsEnabled' | 'repository'>> & {
      gitSettings?: RepositoryGitSettings;
    }) => void | Promise<void>;
  } = $props();

  let menuOpen = $state(false);
  let aclDialogOpen = $state(false);
  let rootElement = $state<HTMLElement | null>(null);
  let titleDraft = $state('');
  let slugDraft = $state('');
  let isPublicDraft = $state(false);
  let vcsEnabledDraft = $state(false);
  let exchangeRunDefaultDraft = $state(true);
  let aclRulesDraft = $state<RepositoryGitAclRule[]>([]);

  const gitGroups = [
    { id: 'admin', label: 'Admin' },
    { id: 'exchange', label: 'Exchange' },
    { id: 'agents', label: 'Agents' },
    { id: 'authenticated', label: 'Authenticated' }
  ] as const;

  function createRule(branchPattern = '*', allowedGroups: RepositoryGitAclRule['allowedGroups'] = ['exchange']): RepositoryGitAclRule {
    return {
      id: globalThis.crypto?.randomUUID?.() || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      branchPattern,
      allowedGroups: [...allowedGroups]
    };
  }

  function fallbackGitSettings(repository: OrderRepository | undefined, isPublicRepo: boolean): RepositoryGitSettings {
    return {
      exchangeRunDefault: true,
      exchangeActor: repository?.gitSettings?.exchangeActor || 'feed@problemsets.lefine.pro',
      agentSourceUrl: repository?.gitSettings?.agentSourceUrl || 'https://problemsets.lefine.pro/subscribers',
      aclRules: [
        createRule('main', ['admin']),
        createRule('*', isPublicRepo ? ['authenticated'] : ['exchange'])
      ]
    };
  }

  function syncDrafts() {
    titleDraft = order?.title?.trim() || '';
    slugDraft = order?.shareId?.trim() && order.shareId !== order.id ? order.shareId.trim() : '';
    isPublicDraft = order?.isPublicTask === true;
    vcsEnabledDraft = order?.vcsEnabled === true || Boolean(order?.repository);

    const settings = order?.repository?.gitSettings || fallbackGitSettings(order?.repository, isPublicDraft);
    exchangeRunDefaultDraft = settings.exchangeRunDefault;
    aclRulesDraft =
      settings.aclRules.length > 0
        ? settings.aclRules.map((rule) => ({ ...rule, allowedGroups: [...rule.allowedGroups] }))
        : fallbackGitSettings(order?.repository, isPublicDraft).aclRules;
  }

  function closeMenu() {
    aclDialogOpen = false;
    menuOpen = false;
  }

  function toggleMenu() {
    if (!order) {
      return;
    }

    if (!menuOpen) {
      syncDrafts();
    }

    menuOpen = !menuOpen;
  }

  function openAclDialog() {
    aclDialogOpen = true;
  }

  function closeAclDialog() {
    aclDialogOpen = false;
  }

  function addAclRule() {
    aclRulesDraft = [...aclRulesDraft, createRule()];
  }

  function removeAclRule(ruleId: string) {
    aclRulesDraft = aclRulesDraft.filter((rule) => rule.id !== ruleId);
  }

  function updateAclBranch(ruleId: string, branchPattern: string) {
    aclRulesDraft = aclRulesDraft.map((rule) => (rule.id === ruleId ? { ...rule, branchPattern } : rule));
  }

  function toggleAclGroup(ruleId: string, group: RepositoryGitAclRule['allowedGroups'][number], enabled: boolean) {
    aclRulesDraft = aclRulesDraft.map((rule) => {
      if (rule.id !== ruleId) {
        return rule;
      }

      const allowedGroups = enabled
        ? [...new Set([...rule.allowedGroups, group])]
        : rule.allowedGroups.filter((item) => item !== group);

      return { ...rule, allowedGroups };
    });
  }

  function applySettings() {
    if (!order) {
      return;
    }

    const normalizedSlug = normalizeProfileResourceSlug(slugDraft);
    const normalizedTitle = titleDraft.trim() || order.title;
    const normalizedDescription =
      order.description?.trim() && order.description.trim() === order.title.trim() && normalizedTitle !== order.title.trim()
        ? ''
        : undefined;
    const existingRepository = order.repository;
    const fallbackSettings = fallbackGitSettings(existingRepository, isPublicDraft);
    const gitSettings: RepositoryGitSettings = {
      exchangeRunDefault: exchangeRunDefaultDraft,
      exchangeActor: existingRepository?.gitSettings?.exchangeActor || fallbackSettings.exchangeActor,
      agentSourceUrl: existingRepository?.gitSettings?.agentSourceUrl || fallbackSettings.agentSourceUrl,
      aclRules: aclRulesDraft
        .map((rule) => ({
          ...rule,
          branchPattern: rule.branchPattern.trim() || '*',
          allowedGroups: [...new Set(rule.allowedGroups)].filter((group) => group.length > 0)
        }))
        .filter((rule) => rule.allowedGroups.length > 0)
    };

    onApply({
      title: normalizedTitle,
      ...(normalizedDescription !== undefined ? { description: normalizedDescription } : {}),
      shareId: normalizedSlug || order.id,
      isPublicTask: isPublicDraft,
      vcsEnabled: vcsEnabledDraft,
      gitSettings,
      ...(existingRepository
        ? {
            repository: {
              ...existingRepository,
              gitSettings
            }
          }
        : {})
    });
    closeMenu();
  }

  function createGitRepo() {
    if (!order) {
      return;
    }

    vcsEnabledDraft = true;
    applySettings();
  }

  $effect(() => {
    if (!browser || !menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!rootElement?.contains(target)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  });
</script>

<kefine-task-settings bind:this={rootElement}>
  <button
    type="button"
    data-part="settings-trigger"
    onclick={toggleMenu}
    aria-haspopup="dialog"
    aria-expanded={menuOpen}
    disabled={!order}
    title="Task settings"
  >
    <Icon icon="mdi:cog-outline" width="18" height="18" aria-hidden="true" />
  </button>

  {#if menuOpen && order}
    <kefine-task-settings-dialog role="presentation">
      <kefine-task-settings-backdrop></kefine-task-settings-backdrop>
      <kefine-task-settings-popover role="dialog" aria-modal="true" aria-label="Task settings">
        <kefine-task-settings-section>
          <kefine-task-settings-head>
            <strong>Settings</strong>
            <button type="button" data-part="icon-close" onclick={closeMenu} aria-label="Close settings">
              <Icon icon="mdi:close" width="18" height="18" aria-hidden="true" />
            </button>
          </kefine-task-settings-head>
          {#if repositoriesEnabled && !vcsEnabledDraft && !order.repository}
            <button type="button" data-part="secondary" data-kind="create-repo" onclick={createGitRepo}>
              <Icon icon="mdi:source-repository" width="16" height="16" aria-hidden="true" />
              <lefine-text>Create git repo</lefine-text>
            </button>
          {/if}
          <label data-part="field">
            <lefine-text>Name</lefine-text>
            <input bind:value={titleDraft} type="text" placeholder="Task name" />
          </label>
          <label data-part="field">
            <lefine-text>Slug</lefine-text>
            <input
              bind:value={slugDraft}
              type="text"
              placeholder="task-name"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
            />
          </label>
          <label data-part="toggle">
            <input bind:checked={isPublicDraft} type="checkbox" />
            <lefine-text>Make public</lefine-text>
          </label>
          {#if repositoriesEnabled}
            <label data-part="toggle">
              <input bind:checked={vcsEnabledDraft} type="checkbox" />
              <lefine-text>Enable VCS</lefine-text>
            </label>
          {/if}

          {#if repositoriesEnabled && vcsEnabledDraft}
            <kefine-task-settings-git>
              <strong>Git access</strong>
              <label data-part="toggle">
                <input bind:checked={exchangeRunDefaultDraft} type="checkbox" />
                <lefine-text>Push runs exchange issue</lefine-text>
              </label>

              <kefine-task-settings-summary>
                <lefine-text>{aclRulesDraft.length} access rules configured</lefine-text>
                <button type="button" data-part="secondary" onclick={openAclDialog}>Edit access rules</button>
              </kefine-task-settings-summary>
            </kefine-task-settings-git>
          {/if}

          <button type="button" data-part="apply" onclick={applySettings}>Save</button>
        </kefine-task-settings-section>
      </kefine-task-settings-popover>

      {#if aclDialogOpen}
        <kefine-task-settings-dialog role="presentation" data-layer="nested">
          <kefine-task-settings-backdrop></kefine-task-settings-backdrop>
          <kefine-task-settings-popover role="dialog" aria-modal="true" aria-label="Git access rules">
            <kefine-task-settings-section>
              <kefine-task-settings-head>
                <strong>Git access rules</strong>
                <button type="button" data-part="icon-close" onclick={closeAclDialog} aria-label="Close access rules">
                  <Icon icon="mdi:close" width="18" height="18" aria-hidden="true" />
                </button>
              </kefine-task-settings-head>

              <kefine-task-settings-acl>
                {#each aclRulesDraft as rule}
                  <kefine-task-settings-acl-row>
                    <label data-part="field">
                      <lefine-text>Branch</lefine-text>
                      <input
                        value={rule.branchPattern}
                        type="text"
                        placeholder="main or feature/*"
                        oninput={(event) => updateAclBranch(rule.id, (event.currentTarget as HTMLInputElement).value)}
                      />
                    </label>

                    <kefine-task-settings-groups>
                      {#each gitGroups as group}
                        <label data-part="toggle" data-compact="true">
                          <input
                            checked={rule.allowedGroups.includes(group.id)}
                            type="checkbox"
                            onchange={(event) => toggleAclGroup(rule.id, group.id, (event.currentTarget as HTMLInputElement).checked)}
                          />
                          <lefine-text>{group.label}</lefine-text>
                        </label>
                      {/each}
                    </kefine-task-settings-groups>

                    <button type="button" data-part="secondary" onclick={() => removeAclRule(rule.id)}>Remove</button>
                  </kefine-task-settings-acl-row>
                {/each}
                <button type="button" data-part="secondary" onclick={addAclRule}>Add rule</button>
              </kefine-task-settings-acl>
            </kefine-task-settings-section>
          </kefine-task-settings-popover>
        </kefine-task-settings-dialog>
      {/if}
    </kefine-task-settings-dialog>
  {/if}
</kefine-task-settings>

<style>
  kefine-task-settings {
    position: relative;
    display: inline-flex;
  }

  button[data-part='settings-trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.35rem;
    height: 2.35rem;
    padding: 0;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 84%, transparent);
  }

  kefine-task-settings-dialog {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  kefine-task-settings-backdrop {
    position: absolute;
    inset: 0;
    background: color-mix(in oklab, #1a120d 46%, transparent);
    backdrop-filter: blur(3px);
  }

  kefine-task-settings-popover {
    position: relative;
    z-index: 1;
    width: min(32rem, calc(100vw - 2rem));
    max-width: calc(100vw - 2rem);
    max-height: min(44rem, calc(100vh - 2rem));
    overflow: auto;
    padding: 0.95rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 82%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 97%, white 3%);
    box-shadow: 0 1rem 2.5rem color-mix(in oklab, #3d2815 16%, transparent);
    box-sizing: border-box;
  }

  kefine-task-settings-section,
  kefine-task-settings-git,
  kefine-task-settings-acl {
    display: grid;
    gap: 0.75rem;
  }

  kefine-task-settings-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  kefine-task-settings-summary lefine-text {
    color: color-mix(in oklab, var(--lefine-text, #453323) 72%, transparent);
    font-size: 0.88rem;
  }

  kefine-task-settings-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  kefine-task-settings-section strong {
    font-size: 0.9rem;
  }

  kefine-task-settings-acl-row {
    display: grid;
    gap: 0.6rem;
    padding: 0.65rem;
    border-radius: 0.8rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 72%, transparent);
  }

  kefine-task-settings-groups {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.85rem;
  }

  label[data-part='field'] {
    display: grid;
    gap: 0.35rem;
  }

  label[data-part='field'] lefine-text,
  label[data-part='toggle'] lefine-text {
    font-size: 0.92rem;
    font-weight: 600;
  }

  label[data-part='field'] input {
    min-width: 0;
    min-height: 2.45rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 88%, white 12%);
    color: inherit;
    font: inherit;
  }

  label[data-part='toggle'] {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  label[data-part='toggle'][data-compact='true'] {
    gap: 0.4rem;
  }

  button[data-part='apply'],
  button[data-part='secondary'],
  button[data-part='icon-close'] {
    min-height: 2.4rem;
    padding: 0.55rem 0.8rem;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 14%, white);
    color: inherit;
    font: inherit;
    font-weight: 600;
  }

  button[data-part='secondary'] {
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 90%, white 10%);
  }

  button[data-part='icon-close'] {
    min-width: 2.4rem;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 90%, white 10%);
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='settings-trigger'],
  :global(:root[data-kefine-theme='dark']) kefine-task-settings-popover,
  :global(:root[data-kefine-theme='dark']) label[data-part='field'] input,
  :global(:root[data-kefine-theme='dark']) button[data-part='apply'],
  :global(:root[data-kefine-theme='dark']) button[data-part='secondary'],
  :global(:root[data-kefine-theme='dark']) kefine-task-settings-acl-row {
    color: #eadcc7;
    border-color: color-mix(in oklab, #d3a45c 36%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 92%, #3a2818 8%);
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='apply'] {
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 18%, var(--kef-bg-card, #22170f));
  }
</style>

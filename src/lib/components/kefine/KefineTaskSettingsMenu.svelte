<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { normalizeProfileResourceSlug } from '$lib/profile/profile-handles';
  import type { OrderRepository, OrderView, RepositoryGitAclRule, RepositoryGitSettings } from './kefine-workflow';

  let {
    order,
    onApply
  }: {
    order: OrderView | null;
    onApply: (patch: Partial<Pick<OrderView, 'shareId' | 'isPublicTask' | 'vcsEnabled' | 'repository'>> & { gitSettings?: RepositoryGitSettings }) => void | Promise<void>;
  } = $props();

  let menuOpen = $state(false);
  let rootElement = $state<HTMLElement | null>(null);
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
      exchangeActor: repository?.gitSettings?.exchangeActor || 'feed@exchange.lefine.pro',
      agentSourceUrl: repository?.gitSettings?.agentSourceUrl || 'https://exchange.lefine.pro/subscribers',
      aclRules: [
        createRule('main', ['admin']),
        createRule('*', isPublicRepo ? ['authenticated'] : ['exchange'])
      ]
    };
  }

  function syncDrafts() {
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
    <kefine-task-settings-popover role="dialog" aria-label="Task settings">
      <kefine-task-settings-section>
        <strong>Settings</strong>
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
        <label data-part="toggle">
          <input bind:checked={vcsEnabledDraft} type="checkbox" />
          <lefine-text>Enable VCS</lefine-text>
        </label>

        {#if vcsEnabledDraft}
          <kefine-task-settings-git>
            <strong>Git access</strong>
            <label data-part="toggle">
              <input bind:checked={exchangeRunDefaultDraft} type="checkbox" />
              <lefine-text>Push runs exchange issue</lefine-text>
            </label>
            <p data-part="hint">
              Exchange actor: @{order.repository?.gitSettings?.exchangeActor || 'feed@exchange.lefine.pro'}
            </p>
            <p data-part="hint">
              Agents source: {order.repository?.gitSettings?.agentSourceUrl || 'https://exchange.lefine.pro/subscribers'}
            </p>
            <p data-part="hint">
              Push override: <code>git push -o exchange-run=0</code> or <code>-o exchange-run=1</code>
            </p>

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
          </kefine-task-settings-git>
        {/if}

        <button type="button" data-part="apply" onclick={applySettings}>Save</button>
      </kefine-task-settings-section>
    </kefine-task-settings-popover>
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

  kefine-task-settings-popover {
    position: absolute;
    top: calc(100% + 0.55rem);
    right: 0;
    z-index: 15;
    width: min(26rem, calc(100vw - 1rem));
    max-width: calc(100vw - 1rem);
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

  p[data-part='hint'] {
    margin: 0;
    font-size: 0.82rem;
    color: color-mix(in oklab, var(--lefine-text, #453323) 68%, transparent);
  }

  button[data-part='apply'],
  button[data-part='secondary'] {
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

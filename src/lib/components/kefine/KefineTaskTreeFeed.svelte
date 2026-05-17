<script lang="ts">
  import Icon from '@iconify/svelte';
  import KefineTaskCloneMenu from '$lib/components/kefine/KefineTaskCloneMenu.svelte';
  import KefineTaskSettingsMenu from '$lib/components/kefine/KefineTaskSettingsMenu.svelte';
  import KefineRichTaskEditorDialog from '$lib/components/kefine/KefineRichTaskEditorDialog.svelte';
  import {
    appendTaskNodeBranchInsert,
    appendTaskNodeComment,
    appendTaskNodeCommentWithMetadata,
    appendTaskNodeInsert,
    composeBranchInsertSource,
    buildQueuedTaskRoot,
    buildTaskThreadNodes,
    replaceTaskNodeInsert,
    resolveTaskDocumentContent,
    resolveTaskNodeComment,
    replaceTaskNodeComment,
    type TaskBranchPlacement,
    type TaskBranchVisibility,
    type TaskThreadNode
  } from '$lib/components/kefine/kefine-task-feed';
  import { browser } from '$app/environment';
  import type { OrderView } from '$lib/components/kefine/kefine-workflow';
  import type { TaskCloneFormat } from '$lib/components/kefine/kefine-task-clone';
  import type { EditorDraftState, EditorMentionCandidate } from '$lib/components/kefine/KefineRichTaskEditorDialog.svelte';

  let {
    currentOrder,
    queuedOrders = [],
    labels,
    canSaveCloneLocally = false,
    canManageTask = false,
    commentSubmittingStepId = null,
    onSubmitStepComment,
    onSaveDocument,
    onExportClone,
    onSaveCloneLocally,
    onUpdateTaskSettings,
    onPauseSearch,
    onResumeSearch
  }: {
    currentOrder: OrderView | null;
    queuedOrders?: OrderView[];
    labels: {
      boardTitle: string;
    leaveComment: string;
    saving: string;
    apply: string;
    richEditorDescription: string;
    interimResult?: string;
    finalResult?: string;
    resultTitle?: string;
    expandBranch?: string;
    collapseBranch?: string;
    showHiddenBranches?: string;
    hideBranches?: string;
    editCode?: string;
    createBranch?: string;
    createBranchLeft?: string;
    createBranchHidden?: string;
    commentAction?: string;
    inlineCodeEditHint?: string;
  };
    canSaveCloneLocally?: boolean;
    canManageTask?: boolean;
    commentSubmittingStepId?: string | null;
    onSubmitStepComment?: ((stepId: string, content: string) => Promise<void> | void) | null;
    onSaveDocument?: ((content: string) => Promise<void> | void) | null;
    onExportClone?: ((format: TaskCloneFormat) => void) | null;
    onSaveCloneLocally?: ((runLocally: boolean) => void) | null;
    onUpdateTaskSettings?: ((patch: Partial<Pick<OrderView, 'title' | 'description' | 'taskIcon' | 'shareId' | 'isPublicTask' | 'vcsEnabled' | 'repository'>> & {
      gitSettings?: import('./kefine-workflow').RepositoryGitSettings;
    }) => void | Promise<void>) | null;
    onPauseSearch?: (() => void | Promise<void>) | null;
    onResumeSearch?: (() => void | Promise<void>) | null;
  } = $props();

  let commentDrafts = $state<Record<string, string>>({});
  let commentMentionDrafts = $state<Record<string, EditorDraftState['mentions']>>({});
  let openCommentComposerId = $state<string | null>(null);
  type ThreadCommentAction = 'comment' | 'file' | 'tag' | 'vcs' | 'insert' | 'branch' | 'edit';
  let commentMetaActionByNodeId = $state<Record<
    string,
    ThreadCommentAction
  >>({});
  let systemInstructionEnabledByNodeId = $state<Record<string, boolean>>({});
  let hoveredRailNodeId = $state<string | null>(null);
  let collapsedNodeById = $state<Record<string, boolean>>({});
  let hiddenBranchVisibleByNodeId = $state<Record<string, boolean>>({});
  let branchPlacementDraftByNodeId = $state<Record<string, TaskBranchPlacement>>({});
  let branchVisibilityDraftByNodeId = $state<Record<string, TaskBranchVisibility>>({});
  let planEditorOpen = $state(false);
  let planDraft = $state('');
  type ThreadUiStorageState = { collapsed: Record<string, boolean>; hiddenVisible: Record<string, boolean> };

  const THREAD_UI_STORAGE_KEY = 'kefine-task-thread-ui-v1';
  const threadUiStorageKey = $derived.by(() => currentOrder?.id ? `${THREAD_UI_STORAGE_KEY}:${currentOrder.id}` : null);

  function resolveThreadUiStorageState(rawValue: string | null): ThreadUiStorageState {
    if (!rawValue) {
      return { collapsed: {}, hiddenVisible: {} };
    }

    try {
      const parsed = JSON.parse(rawValue) as ThreadUiStorageState;
      return {
        collapsed: parsed?.collapsed && typeof parsed.collapsed === 'object' ? parsed.collapsed : {},
        hiddenVisible: parsed?.hiddenVisible && typeof parsed.hiddenVisible === 'object' ? parsed.hiddenVisible : {}
      };
    } catch {
      return { collapsed: {}, hiddenVisible: {} };
    }
  }

  function isNodeCollapsed(nodeId: string): boolean {
    return collapsedNodeById[nodeId] === true;
  }

  function isHiddenBranchNodeVisible(nodeId: string): boolean {
    return hiddenBranchVisibleByNodeId[nodeId] === true;
  }

  function shouldRenderBranchNode(nodeId: string, childNode: TaskThreadNode): boolean {
    if (childNode.branchVisibility !== 'hidden') {
      return true;
    }

    return isHiddenBranchNodeVisible(nodeId);
  }

  function hasHiddenChildren(node: TaskThreadNode): boolean {
    return (node.children ?? []).some((child) => child.branchVisibility === 'hidden');
  }

  function visibleChildren(node: TaskThreadNode): TaskThreadNode[] {
    if (isNodeCollapsed(node.id)) {
      return [];
    }

    return (node.children ?? []).filter((child) => shouldRenderBranchNode(node.id, child));
  }

  function visibleLeftChildren(node: TaskThreadNode): TaskThreadNode[] {
    return visibleChildren(node).filter((child) => child.branchPlacement === 'left');
  }

  function visibleNormalChildren(node: TaskThreadNode): TaskThreadNode[] {
    return visibleChildren(node).filter((child) => child.branchPlacement !== 'left');
  }

  function toggleCollapsedNode(nodeId: string): void {
    collapsedNodeById = {
      ...collapsedNodeById,
      [nodeId]: !isNodeCollapsed(nodeId)
    };
  }

  function toggleHiddenBranches(nodeId: string): void {
    hiddenBranchVisibleByNodeId = {
      ...hiddenBranchVisibleByNodeId,
      [nodeId]: !isHiddenBranchNodeVisible(nodeId)
    };
  }

  function setBranchDrafts(nodeId: string, placement: TaskBranchPlacement, visibility: TaskBranchVisibility): void {
    branchPlacementDraftByNodeId = {
      ...branchPlacementDraftByNodeId,
      [nodeId]: placement
    };
    branchVisibilityDraftByNodeId = {
      ...branchVisibilityDraftByNodeId,
      [nodeId]: visibility
    };
  }

  function defaultExpandLabel(node: TaskThreadNode): string {
    return isNodeCollapsed(node.id) ? (labels.expandBranch ?? 'Expand branch') : (labels.collapseBranch ?? 'Collapse branch');
  }

  function hiddenBranchesLabel(node: TaskThreadNode): string {
    return isHiddenBranchNodeVisible(node.id)
      ? (labels.hideBranches ?? 'Hide hidden branches')
      : (labels.showHiddenBranches ?? 'Show hidden branches');
  }

  function editorPlaceholder(node: TaskThreadNode): string {
    const action = commentMetaActionByNodeId[node.id];
    if (action === 'branch') {
      return labels.createBranch ?? 'Create branch';
    }
    if (action === 'edit') {
      return labels.inlineCodeEditHint ?? 'Edit code block';
    }
    return labels.leaveComment ?? 'Comment';
  }

  function openPlanEditor(): void {
    planDraft = currentOrder?.document?.content || resolveTaskDocumentContent(currentOrder);
    planEditorOpen = true;
  }

  function closePlanEditor(): void {
    planEditorOpen = false;
    planDraft = '';
  }

  async function savePlanEditor(): Promise<void> {
    if (!onSaveDocument || !currentOrder || !planDraft.trim()) {
      return;
    }

    await onSaveDocument(planDraft);
    closePlanEditor();
  }

  $effect(() => {
    if (!browser || !threadUiStorageKey) {
      return;
    }

    const persisted = resolveThreadUiStorageState(globalThis.localStorage.getItem(threadUiStorageKey));
    collapsedNodeById = persisted.collapsed;
    hiddenBranchVisibleByNodeId = persisted.hiddenVisible;
  });

  $effect(() => {
    if (!browser || !threadUiStorageKey) {
      return;
    }

    globalThis.localStorage.setItem(
      threadUiStorageKey,
      JSON.stringify({
        collapsed: collapsedNodeById,
        hiddenVisible: hiddenBranchVisibleByNodeId
      } as ThreadUiStorageState)
    );
  });

  const nextOrders = $derived.by(() =>
    queuedOrders.filter((order) => !currentOrder || order.id !== currentOrder.id).map((order) => buildQueuedTaskRoot(order, labels))
  );
  const currentThread = $derived(buildTaskThreadNodes(currentOrder, labels));
  const taskMonogram = $derived.by(() => {
    const icon = currentOrder?.taskIcon?.trim();
    if (icon) {
      return icon;
    }
    const source = currentOrder?.title?.trim() || labels.boardTitle.trim();
    const match = source.match(/[A-Za-zА-Яа-яԱ-Ֆա-ֆ0-9]/u);
    return (match?.[0] ?? source.charAt(0) ?? 'T').toUpperCase();
  });
  const mentionCandidates = $derived.by<EditorMentionCandidate[]>(() => {
    const nextCandidates: EditorMentionCandidate[] = [];
    const exchangeHandle =
      currentOrder?.repository?.gitSettings?.exchangeActor?.trim() ||
      currentOrder?.actorHandle?.trim() ||
      currentOrder?.ownerUsername?.trim() ||
      '';

    if (exchangeHandle) {
      nextCandidates.push({
        id: `actor:${exchangeHandle.replace(/^@+/, '')}`,
        label: exchangeHandle.startsWith('@') ? exchangeHandle : `@${exchangeHandle}`,
        value: '@workspace',
        kind: 'actor',
        targetKind: 'actor'
      });
    }

    const solverLabel =
      currentOrder?.solverHandle?.trim() ||
      currentOrder?.executors?.[0]?.handle?.trim() ||
      currentOrder?.solverName?.trim() ||
      currentOrder?.executors?.[0]?.name?.trim() ||
      '';

    if (solverLabel) {
      nextCandidates.push({
        id: `solver:${solverLabel.replace(/^@+/, '')}`,
        label: solverLabel.startsWith('@') ? solverLabel : solverLabel,
        value: '@solver',
        kind: 'solver',
        targetKind: 'solver'
      });
    }

    return nextCandidates;
  });

  function nodeTone(node: TaskThreadNode): string {
    if (node.mode === 'loading') return 'loading';
    if (node.state === 'completed') return 'completed';
    if (node.state === 'active') return 'active';
    return 'upcoming';
  }

  function openCommentComposer(nodeId: string): void {
    openCommentComposerId = nodeId;
    commentMetaActionByNodeId = {
      ...commentMetaActionByNodeId,
      [nodeId]: 'comment'
    };
  }

  function openCommentComposerWithAction(nodeId: string, action: ThreadCommentAction): void {
    openCommentComposerId = nodeId;
    commentMetaActionByNodeId = {
      ...commentMetaActionByNodeId,
      [nodeId]: action
    };
  }

  function ensureEditableDraft(node: TaskThreadNode, action: ThreadCommentAction = 'comment'): void {
    if (commentDrafts[node.id] !== undefined) {
      return;
    }

    if (action === 'edit' && node.editableSource !== undefined) {
      commentDrafts = {
        ...commentDrafts,
        [node.id]: node.editableSource
      };
      return;
    }

    const exchangeInstruction = currentOrder && isExchangeSearchNode(node) ? resolveTaskNodeComment(currentOrder, exchangeInstructionNodeKey(currentOrder)) : '';
    if (exchangeInstruction) {
      commentDrafts = {
        ...commentDrafts,
        [node.id]: exchangeInstruction
      };
      commentMentionDrafts = {
        ...commentMentionDrafts,
        [node.id]: []
      };
      systemInstructionEnabledByNodeId = {
        ...systemInstructionEnabledByNodeId,
        [node.id]: true
      };
      return;
    }

    if (!isBackendStepNode(node) && node.comments?.length) {
      commentDrafts = {
        ...commentDrafts,
        [node.id]: node.comments[node.comments.length - 1]?.content ?? ''
      };
      return;
    }

    commentDrafts = {
      ...commentDrafts,
      [node.id]: ''
    };
  }

  function openNodeCommentComposer(node: TaskThreadNode): void {
    ensureEditableDraft(node);
    openCommentComposer(node.id);
  }

  function openNodeCommentComposerWithAction(node: TaskThreadNode, action: ThreadCommentAction): void {
    const nextPlacement = branchPlacementDraftByNodeId[node.id] ?? 'normal';
    const nextVisibility = branchVisibilityDraftByNodeId[node.id] ?? 'visible';
    if (action === 'branch') {
      setBranchDrafts(node.id, nextPlacement, nextVisibility);
    }

    ensureEditableDraft(node, action);
    openCommentComposerWithAction(node.id, action);
  }

  function openNodeBranchComposer(node: TaskThreadNode, placement: TaskBranchPlacement, visibility: TaskBranchVisibility): void {
    setBranchDrafts(node.id, placement, visibility);
    openNodeCommentComposerWithAction(node, 'branch');
  }

  function closeNodeComposer(node: TaskThreadNode): void {
    commentDrafts = {
      ...commentDrafts,
      [node.id]: ''
    };
    commentMentionDrafts = {
      ...commentMentionDrafts,
      [node.id]: []
    };
    commentMetaActionByNodeId = {
      ...commentMetaActionByNodeId,
      [node.id]: 'comment'
    };
    openCommentComposerId = null;
  }

  function handleNodeActivate(node: TaskThreadNode, event: MouseEvent | KeyboardEvent): void {
    if (!node.commentable) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, label')) {
      return;
    }

    openNodeCommentComposer(node);
  }

  function handleNodeKeydown(node: TaskThreadNode, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleNodeActivate(node, event);
  }

  function isCommentSubmitting(node: TaskThreadNode): boolean {
    if (!commentSubmittingStepId) {
      return false;
    }

    return commentSubmittingStepId === node.stepId || commentSubmittingStepId === node.id;
  }

  function isBackendStepNode(node: TaskThreadNode): boolean {
    return Boolean(
      node.stepId &&
      currentOrder &&
      node.stepId !== `${currentOrder.id}-exchange-search` &&
      node.stepId !== `${currentOrder.id}-description` &&
      node.stepId !== `${currentOrder.id}-waiting-result`
    );
  }

  async function submitComment(node: TaskThreadNode): Promise<void> {
    const content = commentDrafts[node.id]?.trim();
    if (!content || !node.commentable) {
      return;
    }

    const action = commentMetaActionByNodeId[node.id] || 'comment';

    if ((action === 'insert' || action === 'branch') && onSaveDocument && currentOrder) {
      const nextContent = action === 'branch'
        ? appendTaskNodeBranchInsert(
          currentOrder,
          node.stepId || node.id,
          content,
          {
            placement: branchPlacementDraftByNodeId[node.id] ?? 'normal',
            visibility: branchVisibilityDraftByNodeId[node.id] ?? 'visible'
          }
        )
        : appendTaskNodeInsert(
          currentOrder,
          node.stepId || node.id,
          content
        );
      await onSaveDocument(nextContent);
    } else if (action === 'edit' && onSaveDocument && currentOrder && node.stepId) {
      const shouldPreserveBranchMarker =
        Boolean(node.branchLabel) ||
        node.branchPlacement === 'left' ||
        node.branchVisibility === 'hidden';
      const editedContent = composeBranchInsertSource(
        content,
        {
        placement: node.branchPlacement ?? 'normal',
        visibility: node.branchVisibility ?? 'visible'
      },
        shouldPreserveBranchMarker
      );
      const nextContent = replaceTaskNodeInsert(currentOrder, node.stepId, editedContent);
      await onSaveDocument(nextContent);
    } else if (action === 'comment' && currentOrder && isExchangeSearchNode(node) && systemInstructionEnabledByNodeId[node.id] === true && onSaveDocument) {
      const nextContent = replaceTaskNodeComment(currentOrder, exchangeInstructionNodeKey(currentOrder), content);
      await onSaveDocument(nextContent);
    } else if (isBackendStepNode(node) && onSubmitStepComment && node.stepId) {
      await onSubmitStepComment(node.stepId, content);
    } else if (onSaveDocument && currentOrder) {
      const mentions = commentMentionDrafts[node.id]?.length ? commentMentionDrafts[node.id] : undefined;
      const nextContent = node.comments?.length
        ? replaceTaskNodeComment(currentOrder, node.stepId || node.id, content, mentions)
        : mentions?.length
          ? appendTaskNodeCommentWithMetadata(currentOrder, node.stepId || node.id, { content, mentions })
          : appendTaskNodeComment(currentOrder, node.stepId || node.id, content);
      await onSaveDocument(nextContent);
    } else {
      return;
    }

    commentDrafts = {
      ...commentDrafts,
      [node.id]: ''
    };
    commentMentionDrafts = {
      ...commentMentionDrafts,
      [node.id]: []
    };
    systemInstructionEnabledByNodeId = {
      ...systemInstructionEnabledByNodeId,
      [node.id]: false
    };
    commentMetaActionByNodeId = {
      ...commentMetaActionByNodeId,
      [node.id]: 'comment'
    };
    openCommentComposerId = null;
  }

  function updateCommentDraft(nodeId: string, value: string): void {
    commentDrafts = {
      ...commentDrafts,
      [nodeId]: value
    };
  }

  function updateCommentEditorState(nodeId: string, state: EditorDraftState): void {
    updateCommentDraft(nodeId, state.value);
    commentMentionDrafts = {
      ...commentMentionDrafts,
      [nodeId]: state.mentions
    };
  }

  function toggleSystemInstruction(nodeId: string, enabled: boolean): void {
    systemInstructionEnabledByNodeId = {
      ...systemInstructionEnabledByNodeId,
      [nodeId]: enabled
    };
  }

  function isExchangeSearchNode(node: TaskThreadNode): boolean {
    return Boolean(currentOrder && node.stepId === `${currentOrder.id}-exchange-search`);
  }

  function exchangeInstructionNodeKey(order: OrderView): string {
    return `${order.id}-exchange-system-instruction`;
  }

  function canPauseSearch(node: TaskThreadNode): boolean {
    return Boolean(
      onPauseSearch &&
      currentOrder &&
      isExchangeSearchNode(node) &&
      currentOrder.status !== 'stopped' &&
      currentOrder.status !== 'completed' &&
      currentOrder.status !== 'done'
    );
  }

  function canResumeSearch(node: TaskThreadNode): boolean {
    return Boolean(
      onResumeSearch &&
      currentOrder &&
      isExchangeSearchNode(node) &&
      currentOrder.status === 'stopped'
    );
  }

  function showRailAction(node: TaskThreadNode): boolean {
    return Boolean(
      (canPauseSearch(node) && hoveredRailNodeId === node.id) ||
      canResumeSearch(node)
    );
  }

  function railActionIcon(node: TaskThreadNode): string {
    if (canResumeSearch(node)) {
      return hoveredRailNodeId === node.id ? 'mdi:play' : 'mdi:pause';
    }

    return 'mdi:pause';
  }

  function railActionLabel(node: TaskThreadNode): string {
    if (canResumeSearch(node)) {
      return hoveredRailNodeId === node.id ? 'Resume exchange search' : 'Exchange search paused';
    }

    return 'Pause exchange search';
  }

  function handleRailAction(node: TaskThreadNode): void {
    if (canResumeSearch(node)) {
      if (hoveredRailNodeId !== node.id) {
        return;
      }

      void onResumeSearch?.();
      return;
    }

    if (canPauseSearch(node)) {
      void onPauseSearch?.();
    }
  }

  function showNodeActions(node: TaskThreadNode): boolean {
    return Boolean(node.commentable);
  }

</script>

  {#snippet threadNode(node: TaskThreadNode, index: number, child = false, queued = false)}
  <kefine-thread-node
    data-tone={nodeTone(node)}
    data-mode={node.mode}
    data-child={child ? 'true' : undefined}
    data-branch-placement={node.branchPlacement}
    data-queued={queued ? 'true' : undefined}
    data-commentable={node.commentable ? 'true' : undefined}
    data-comment-open={openCommentComposerId === node.id ? 'true' : undefined}
    data-testid={`kefine-task-node-${node.id}`}
    style={`--node-delay:${index * 85}ms`}
  >
    <kefine-thread-rail
      aria-hidden="true"
      onmouseenter={() => {
        hoveredRailNodeId = node.id;
      }}
      onmouseleave={() => {
        if (hoveredRailNodeId === node.id) {
          hoveredRailNodeId = null;
        }
      }}
    >
      <kefine-thread-dot
        data-action-visible={showRailAction(node) ? 'true' : undefined}
        data-paused={child && node.state === 'upcoming' ? 'true' : undefined}
      ></kefine-thread-dot>
      {#if child && node.state === 'upcoming'}
        <lefine-box data-part="rail-dot-static" aria-hidden="true">
          <Icon icon="mdi:pause" width="14" height="14" aria-hidden="true" />
        </lefine-box>
      {/if}
      {#if showRailAction(node)}
        <button
          type="button"
          data-part="rail-dot-action"
          aria-label={railActionLabel(node)}
          title={railActionLabel(node)}
          data-resumable={canResumeSearch(node) ? 'true' : undefined}
          data-hovered={hoveredRailNodeId === node.id ? 'true' : undefined}
          onclick={() => handleRailAction(node)}
        >
          <Icon icon={railActionIcon(node)} width="14" height="14" aria-hidden="true" />
        </button>
      {/if}
    </kefine-thread-rail>
    <kefine-thread-copy
      data-clickable={node.commentable ? 'true' : undefined}
      data-testid={`kefine-task-node-copy-${node.id}`}
      role="button"
      aria-disabled={node.commentable ? undefined : 'true'}
      tabindex={node.commentable ? 0 : undefined}
        aria-label={node.commentable ? `Open actions for ${node.title}` : undefined}
        onclick={(event: MouseEvent) => handleNodeActivate(node, event)}
        onkeydown={(event: KeyboardEvent) => handleNodeKeydown(node, event)}
      >
      <kefine-thread-line>
        {#if node.branchLabel}
          <kefine-thread-branch-badge>{node.branchLabel}</kefine-thread-branch-badge>
        {/if}
        <kefine-thread-line-copy>
          {#if node.children?.length}
            <button
              type="button"
              data-part="branch-toggle"
              data-testid={`kefine-thread-branch-toggle-${node.id}`}
              aria-expanded={!isNodeCollapsed(node.id)}
              aria-label={defaultExpandLabel(node)}
              onclick={(event: MouseEvent) => {
                event.stopPropagation();
                toggleCollapsedNode(node.id);
              }}
            >
              <Icon
                icon={isNodeCollapsed(node.id) ? 'mdi:chevron-right' : 'mdi:chevron-down'}
                width="14"
                height="14"
                aria-hidden="true"
              />
              <lefine-text>{defaultExpandLabel(node)}</lefine-text>
            </button>
          {/if}
          <strong>{node.title}</strong>
          {#if node.meta}
            <lefine-text>{node.meta}</lefine-text>
          {/if}
        </kefine-thread-line-copy>
      </kefine-thread-line>
      {#if node.detail}
        <p>{node.detail}</p>
      {/if}

      {#if node.mode === 'block' && node.blocks?.length}
        <kefine-thread-blocks>
          {#each node.blocks as block}
            <kefine-thread-block data-type={block.type}>
              {#if block.title}
                <strong>{block.title}</strong>
              {/if}
              {#if block.type === 'code' || block.type === 'diff' || block.type === 'output'}
                <pre>{block.content.trim()}</pre>
              {:else if block.href}
                <a href={block.href} target="_blank" rel="noreferrer">{block.title || block.href}</a>
                {#if block.content}
                  <p>{block.content.trim()}</p>
                {/if}
              {:else}
                <p>{block.content.trim()}</p>
              {/if}
            </kefine-thread-block>
          {/each}
        </kefine-thread-blocks>
      {/if}

      {#if node.comments?.length}
        <kefine-thread-comments>
          {#each node.comments as comment}
            <kefine-thread-comment>
              <strong>{comment.authorName || comment.authorHandle || 'Comment'}</strong>
              <p>{comment.content}</p>
            </kefine-thread-comment>
          {/each}
        </kefine-thread-comments>
      {/if}

      {#if showNodeActions(node)}
        <kefine-thread-comment-entry>
          <kefine-thread-comment-plus-menu>
            <button
              type="button"
              data-part="comment-trigger-action"
              data-kind="comment"
              aria-label={labels.commentAction ?? 'Comment'}
              data-testid={`kefine-thread-action-comment-${node.id}`}
              onclick={() => openNodeCommentComposerWithAction(node, 'comment')}
            >
              <Icon icon="mdi:comment-text-outline" width="16" height="16" aria-hidden="true" />
              <lefine-text>{labels.commentAction ?? 'Comment'}</lefine-text>
            </button>
            <button
              type="button"
              data-part="comment-trigger-action"
              data-kind="branch"
              aria-label={labels.createBranch ?? 'Create branch'}
              data-testid={`kefine-thread-action-branch-${node.id}`}
              onclick={(event: MouseEvent) => {
                event.stopPropagation();
                openNodeBranchComposer(node, 'normal', 'visible');
              }}
            >
              <Icon icon="mdi:source-branch" width="16" height="16" aria-hidden="true" />
              <lefine-text>{labels.createBranch ?? 'Create branch'}</lefine-text>
            </button>
            <button
              type="button"
              data-part="comment-trigger-action"
              data-kind="branch"
              data-variant="left"
              aria-label={labels.createBranchLeft ?? 'Create left branch'}
              data-testid={`kefine-thread-action-branch-left-${node.id}`}
              onclick={(event: MouseEvent) => {
                event.stopPropagation();
                openNodeBranchComposer(node, 'left', 'visible');
              }}
            >
              <Icon icon="mdi:source-branch" width="16" height="16" aria-hidden="true" />
              <lefine-text>{labels.createBranchLeft ?? 'Create left branch'}</lefine-text>
            </button>
            <button
              type="button"
              data-part="comment-trigger-action"
              data-kind="branch"
              data-variant="hidden"
              aria-label={labels.createBranchHidden ?? 'Create hidden branch'}
              data-testid={`kefine-thread-action-branch-hidden-${node.id}`}
              onclick={(event: MouseEvent) => {
                event.stopPropagation();
                openNodeBranchComposer(node, 'normal', 'hidden');
              }}
            >
              <Icon icon="mdi:eye-off" width="16" height="16" aria-hidden="true" />
              <lefine-text>{labels.createBranchHidden ?? 'Create hidden branch'}</lefine-text>
            </button>
            {#if node.editableSource !== undefined}
            <button
              type="button"
              data-part="comment-trigger-action"
              data-kind="edit"
              aria-label={labels.editCode ?? 'Edit code'}
              data-testid={`kefine-thread-action-edit-${node.id}`}
              onclick={(event: MouseEvent) => {
                event.stopPropagation();
                openNodeCommentComposerWithAction(node, 'edit');
              }}
              >
                <Icon icon="mdi:file-edit" width="16" height="16" aria-hidden="true" />
                <lefine-text>{labels.editCode ?? 'Edit code'}</lefine-text>
              </button>
            {/if}
          </kefine-thread-comment-plus-menu>

          {#if openCommentComposerId === node.id && ['branch', 'edit'].includes(commentMetaActionByNodeId[node.id] ?? 'comment')}
            <kefine-thread-inline-node-editor data-testid={`kefine-branch-editor-${node.id}`}>
              <KefineRichTaskEditorDialog
                open={true}
                compact={true}
                singleLine={true}
                submitOnEnter={true}
                enableMeta={false}
                mentionCandidates={mentionCandidates}
                autoOpenTagEditor={false}
                autoOpenFilePicker={false}
                value={commentDrafts[node.id] ?? ''}
                description={labels.richEditorDescription}
                placeholder={editorPlaceholder(node)}
                onApply={(nextValue) => updateCommentDraft(node.id, nextValue)}
                onStateChange={(state) => updateCommentEditorState(node.id, state)}
                onSubmit={() => void submitComment(node)}
                onCancel={() => closeNodeComposer(node)}
              />
              {#if isCommentSubmitting(node)}
                <lefine-text>{labels.saving}</lefine-text>
              {/if}
            </kefine-thread-inline-node-editor>
          {/if}

          {#if openCommentComposerId === node.id && !['insert', 'branch', 'edit'].includes(commentMetaActionByNodeId[node.id] ?? 'comment')}
            <kefine-thread-comment-form data-testid={`kefine-thread-comment-form-${node.id}`}>
              <KefineRichTaskEditorDialog
                open={true}
                compact={true}
                enableMeta={false}
                mentionCandidates={mentionCandidates}
                autoOpenTagEditor={commentMetaActionByNodeId[node.id] === 'tag'}
                autoOpenFilePicker={commentMetaActionByNodeId[node.id] === 'file'}
                value={commentDrafts[node.id] ?? ''}
                description={labels.richEditorDescription}
                placeholder={editorPlaceholder(node)}
                onApply={(nextValue) => updateCommentDraft(node.id, nextValue)}
                onStateChange={(state) => updateCommentEditorState(node.id, state)}
              />
              <kefine-thread-comment-actions>
                {#if isCommentSubmitting(node)}
                  <lefine-text>{labels.saving}</lefine-text>
                {/if}
                {#if isExchangeSearchNode(node)}
                  <label data-part="comment-system-toggle">
                    <input
                      type="checkbox"
                      checked={systemInstructionEnabledByNodeId[node.id] === true}
                      onchange={(event) => toggleSystemInstruction(node.id, (event.currentTarget as HTMLInputElement).checked)}
                    />
                    <lefine-text>System instruction</lefine-text>
                  </label>
                {/if}
                <button
                  type="button"
                  disabled={isCommentSubmitting(node) || !(commentDrafts[node.id] ?? '').trim()}
                  data-kind="apply-comment"
                  data-testid={`kefine-thread-action-apply-${node.id}`}
                  onclick={() => void submitComment(node)}
                >
                  {labels.apply}
                </button>
              </kefine-thread-comment-actions>
            </kefine-thread-comment-form>
          {/if}
          {#if hasHiddenChildren(node)}
            <button
              type="button"
              data-part="hidden-branch-toggle"
              data-testid={`kefine-thread-hidden-toggle-${node.id}`}
              aria-label={hiddenBranchesLabel(node)}
              onclick={() => {
                toggleHiddenBranches(node.id);
              }}
            >
              <Icon icon={isHiddenBranchNodeVisible(node.id) ? 'mdi:eye' : 'mdi:eye-off'} width="14" height="14" aria-hidden="true" />
              <lefine-text>{hiddenBranchesLabel(node)}</lefine-text>
            </button>
          {/if}
        </kefine-thread-comment-entry>

        <kefine-thread-next-step>
          <button
            type="button"
            data-part="next-step-trigger"
            aria-label="Add task below"
            title="Add task below"
            data-testid={`kefine-thread-action-next-step-${node.id}`}
            onclick={() => openNodeCommentComposerWithAction(node, 'insert')}
          >
            <Icon icon="mdi:plus" width="18" height="18" aria-hidden="true" />
          </button>

          {#if openCommentComposerId === node.id && commentMetaActionByNodeId[node.id] === 'insert'}
            <kefine-thread-inline-node-editor data-testid={`kefine-inline-next-step-editor-${node.id}`}>
              <KefineRichTaskEditorDialog
                open={true}
                compact={true}
                singleLine={true}
                submitOnEnter={true}
                enableMeta={false}
                mentionCandidates={mentionCandidates}
                autoOpenTagEditor={false}
                autoOpenFilePicker={false}
                value={commentDrafts[node.id] ?? ''}
                description={labels.richEditorDescription}
                placeholder={editorPlaceholder(node)}
                onApply={(nextValue) => updateCommentDraft(node.id, nextValue)}
                onStateChange={(state) => updateCommentEditorState(node.id, state)}
                onSubmit={() => void submitComment(node)}
                onCancel={() => closeNodeComposer(node)}
              />
              {#if isCommentSubmitting(node)}
                <lefine-text>{labels.saving}</lefine-text>
              {/if}
            </kefine-thread-inline-node-editor>
          {/if}
        </kefine-thread-next-step>
      {/if}
    </kefine-thread-copy>

        {#if node.children?.length}
        <kefine-thread-branch
          role="group"
          aria-label={`Children of ${node.title}`}
          data-testid={`kefine-thread-branch-${node.id}`}
          data-branch-placement={node.branchPlacement ?? 'normal'}
          data-branch-mode={isNodeCollapsed(node.id) ? 'collapsed' : 'expanded'}
        >
          {#if visibleLeftChildren(node).length}
            <kefine-thread-branch
              role="group"
              aria-label={`Left placement children of ${node.title}`}
              data-testid={`kefine-thread-branch-left-${node.id}`}
              data-placement="left"
            >
              {#each visibleLeftChildren(node) as child, childIndex (child.id)}
                {@render threadNode(child, index + childIndex + 1, true)}
              {/each}
            </kefine-thread-branch>
          {/if}

          {#if visibleNormalChildren(node).length}
            <kefine-thread-branch
              role="group"
              aria-label={`Normal children of ${node.title}`}
              data-testid={`kefine-thread-branch-normal-${node.id}`}
              data-placement="normal"
            >
              {#each visibleNormalChildren(node) as child, childIndex (child.id)}
                {@render threadNode(child, index + childIndex + 1, true)}
              {/each}
            </kefine-thread-branch>
          {/if}
        </kefine-thread-branch>
      {/if}
  </kefine-thread-node>
{/snippet}

<kefine-thread-stage>
  <kefine-thread-head>
    <kefine-thread-title>
      <lefine-text data-part="task-monogram" aria-hidden="true">{taskMonogram}</lefine-text>
      <h2><strong>{currentOrder?.title || labels.boardTitle}</strong></h2>
    </kefine-thread-title>
    <kefine-thread-head-actions>
      {#if commentSubmittingStepId}
        <kefine-thread-status>{labels.saving}</kefine-thread-status>
      {/if}
      {#if currentOrder && onSaveDocument}
        <button type="button" data-part="plan-edit-trigger" aria-label="Edit PLAN.org" title="Edit PLAN.org" onclick={openPlanEditor}>
          <Icon icon="mdi:file-tree-outline" width="18" height="18" aria-hidden="true" />
          <lefine-text>PLAN.org</lefine-text>
        </button>
      {/if}
      {#if currentOrder && onExportClone}
        <KefineTaskCloneMenu
          order={currentOrder}
          canSaveLocally={canSaveCloneLocally}
          onExport={onExportClone}
          onSaveLocally={onSaveCloneLocally ?? undefined}
        />
      {/if}
      {#if currentOrder && onUpdateTaskSettings}
        <KefineTaskSettingsMenu order={currentOrder} onApply={onUpdateTaskSettings} />
      {/if}
    </kefine-thread-head-actions>
  </kefine-thread-head>

  <kefine-thread
    data-testid={`kefine-thread-${currentOrder?.id ?? 'empty'}`}
    aria-label={currentOrder?.title || labels.boardTitle}
  >
    {#each currentThread as node, index}
      {@render threadNode(node, index)}
    {/each}

    {#each nextOrders as root, rootIndex}
      {@render threadNode(root, currentThread.length + rootIndex, false, true)}
    {/each}
  </kefine-thread>

  {#if planEditorOpen && currentOrder}
    <kefine-plan-editor role="dialog" aria-modal="true" aria-label="Edit PLAN.org">
      <kefine-plan-editor-panel>
        <kefine-plan-editor-head>
          <strong>PLAN.org</strong>
          <button type="button" data-part="icon-close" aria-label="Close PLAN.org editor" onclick={closePlanEditor}>
            <Icon icon="mdi:close" width="18" height="18" aria-hidden="true" />
          </button>
        </kefine-plan-editor-head>
        <KefineRichTaskEditorDialog
          open={true}
          compact={false}
          enableMeta={false}
          mentionCandidates={mentionCandidates}
          value={planDraft}
          description={labels.richEditorDescription}
          placeholder="* Plan"
          onApply={(nextValue) => {
            planDraft = nextValue;
          }}
        />
        <kefine-plan-editor-actions>
          <button type="button" data-kind="secondary" onclick={closePlanEditor}>Cancel</button>
          <button type="button" data-kind="primary" disabled={!planDraft.trim()} onclick={() => void savePlanEditor()}>
            {labels.apply}
          </button>
        </kefine-plan-editor-actions>
      </kefine-plan-editor-panel>
    </kefine-plan-editor>
  {/if}
</kefine-thread-stage>

<style>
  kefine-thread-stage {
    display: grid;
    gap: 1rem;
    width: min(100%, 52rem);
    margin: 0 auto;
  }

  kefine-thread-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  kefine-thread-title {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  kefine-thread-title h2 {
    margin: 0;
    font-size: inherit;
    font-weight: 700;
    line-height: 1.3;
  }

  kefine-thread-head-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  button[data-part='plan-edit-trigger'] {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.2rem;
    padding: 0 0.7rem;
    border-radius: 0.55rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 36%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #fff8ef) 92%, white 8%);
    color: var(--lefine-text, #2e2317);
    font: inherit;
    font-weight: 700;
  }

  kefine-plan-editor {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: color-mix(in oklab, #20150e 48%, transparent);
  }

  kefine-plan-editor-panel {
    display: grid;
    gap: 1rem;
    width: min(100%, 58rem);
    max-height: min(92vh, 60rem);
    overflow: auto;
    padding: 1rem;
    border-radius: 0.8rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 42%, transparent);
    background: var(--kef-bg-card, #fff8ef);
    box-shadow: 0 1rem 3rem color-mix(in oklab, #000 24%, transparent);
  }

  kefine-plan-editor-head,
  kefine-plan-editor-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  kefine-plan-editor-actions {
    justify-content: flex-end;
  }

  kefine-plan-editor button {
    min-height: 2.2rem;
    border-radius: 0.55rem;
    border: 1px solid color-mix(in oklab, var(--kef-line-strong, #b69a77) 36%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #fff8ef) 92%, white 8%);
    color: var(--lefine-text, #2e2317);
    font: inherit;
    font-weight: 700;
  }

  kefine-plan-editor button[data-kind='primary'] {
    padding: 0 0.9rem;
    background: #2f5d50;
    color: #fffaf0;
  }

  kefine-thread-head strong {
    display: block;
    font-size: clamp(1.35rem, 2vw, 2.1rem);
    line-height: 1.08;
    letter-spacing: -0.02em;
  }

  kefine-thread-head [data-part='task-monogram'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 1.95rem;
    height: 1.95rem;
    border-radius: 0.52rem;
    border: 1px solid color-mix(in oklab, #c79a57 42%, transparent);
    background: linear-gradient(180deg, color-mix(in oklab, #f2dfb4 84%, white), color-mix(in oklab, #d0a364 84%, #c4934c));
    color: #3b2819;
    font-size: 0.94rem;
    font-weight: 800;
    line-height: 1;
    box-shadow: 0 0.35rem 0.9rem color-mix(in oklab, #000 10%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-head [data-part='task-monogram'] {
    border-color: color-mix(in oklab, #d7ad68 48%, transparent);
    background: linear-gradient(180deg, color-mix(in oklab, #f3dfb0 88%, #6f4d25), color-mix(in oklab, #b9853e 88%, #5d4020));
    color: #20150e;
  }

  kefine-thread-status {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.86rem;
    font-weight: 600;
  }

  kefine-thread {
    display: grid;
    gap: 0.2rem;
  }

  kefine-thread-node {
    --kef-thread-rail-width: 1.35rem;
    --kef-thread-column-gap: 0.95rem;
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: var(--kef-thread-rail-width) minmax(0, 1fr);
    gap: var(--kef-thread-column-gap);
    padding: 0 0 1.2rem;
    opacity: 0;
    transform: translateY(0.45rem);
    animation: kefine-thread-rise 0.48s var(--kef-ease-soft, ease) forwards;
    animation-delay: var(--node-delay, 0ms);
  }

  kefine-thread-node[data-child='true'] {
    padding-left: 0.35rem;
  }

  kefine-thread-node[data-comment-open='true'] {
    z-index: 8;
  }

  kefine-thread-rail {
    position: relative;
    display: flex;
    justify-content: center;
  }

  kefine-thread-rail::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: -1.2rem;
    width: 1px;
    background: color-mix(in oklab, var(--kef-line, #d5bf91) 72%, transparent);
  }

  kefine-thread-node:last-child > kefine-thread-rail::before,
  kefine-thread-branch > kefine-thread-node:last-child > kefine-thread-rail::before {
    bottom: 0.2rem;
  }

  kefine-thread-dot {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    width: 1rem;
    height: 1rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, #a77c38 54%, #e9d4a6);
    background: radial-gradient(circle at 30% 30%, #f6e7bd, #d8b16f);
    box-shadow: 0 0 0 0.2rem color-mix(in oklab, var(--kef-bg, #f7ecd4) 92%, transparent);
    margin-top: 0.08rem;
  }

  button[data-part='rail-dot-action'] {
    position: absolute;
    top: 0.08rem;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    min-width: 1rem;
    min-height: 1rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: color-mix(in oklab, #6b4518 88%, #fff4df);
    font: inherit;
  }

  button[data-part='rail-dot-action']:hover {
    color: color-mix(in oklab, var(--kef-primary, #b97a28) 82%, #fff4df);
  }

  button[data-part='rail-dot-action'][data-resumable='true']:not([data-hovered='true']) {
    cursor: default;
  }

  kefine-thread-dot::after {
    content: '';
    position: absolute;
    inset: 0.16rem;
    border-radius: 999px;
    background: color-mix(in oklab, #fff7e5 82%, #d8b16f);
  }

  kefine-thread-dot[data-paused='true']::after {
    display: none;
  }

  [data-part='rail-dot-static'] {
    position: absolute;
    top: 0.08rem;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    min-width: 1rem;
    min-height: 1rem;
    color: color-mix(in oklab, #3e250d 94%, #c58b41);
    pointer-events: none;
  }

  kefine-thread-node[data-tone='completed'] kefine-thread-dot {
    border-color: color-mix(in oklab, #708f42 45%, #d8d8b4);
    background: radial-gradient(circle at 30% 30%, #edf2d8, #a9be74);
  }

  kefine-thread-node[data-tone='completed'] kefine-thread-dot::after {
    inset: 0;
    display: grid;
    place-items: center;
    color: #f5f9ee;
    font-size: 0.6rem;
    font-weight: 800;
    content: '✓';
  }

  kefine-thread-node[data-tone='active'] kefine-thread-dot,
  kefine-thread-node[data-tone='loading'] kefine-thread-dot {
    border-color: color-mix(in oklab, #d3a45c 72%, #f6e7bd);
    background: radial-gradient(circle at 30% 30%, #fff1c9, #d8a657);
    box-shadow:
      0 0 0 0.22rem color-mix(in oklab, var(--kef-bg, #f7ecd4) 90%, transparent),
      0 0 0.7rem color-mix(in oklab, #d8a657 22%, transparent);
  }

  kefine-thread-node[data-tone='active'] kefine-thread-dot::after,
  kefine-thread-node[data-tone='loading'] kefine-thread-dot::after {
    background: conic-gradient(
      from 0deg,
      color-mix(in oklab, #8f5d1d 98%, #fbe8bc) 0deg 220deg,
      transparent 210deg 360deg
    );
    animation: kefine-thread-dot-spin 1.1s linear infinite;
  }

  kefine-thread-node[data-tone='active'] kefine-thread-dot[data-action-visible='true']::after,
  kefine-thread-node[data-tone='loading'] kefine-thread-dot[data-action-visible='true']::after {
    display: none;
  }

  kefine-thread-copy {
    display: grid;
    gap: 0.55rem;
    min-width: 0;
  }

  kefine-thread-copy[data-clickable='true'] {
    cursor: pointer;
    margin: -0.3rem -0.45rem -0.4rem;
    padding: 0.3rem 0.45rem 0.4rem;
    border-radius: 0.95rem;
    transition: background-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
  }

  kefine-thread-copy[data-clickable='true']:hover {
    background: color-mix(in oklab, var(--kef-bg-hover, #eadcbc) 46%, transparent);
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--kef-primary, #b97a28) 12%, transparent);
  }

  kefine-thread-copy[data-clickable='true']:active {
    transform: translateY(1px);
  }

  kefine-thread-copy[data-clickable='true']:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--kef-primary, #b97a28) 36%, transparent);
    outline-offset: 0.2rem;
    border-radius: 0.95rem;
    background: color-mix(in oklab, var(--kef-bg-hover, #eadcbc) 36%, transparent);
  }

  kefine-thread-line {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.7rem;
  }

  kefine-thread-branch-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-height: 1.4rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-primary, #b97a28) 24%, transparent);
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 10%, white);
    color: color-mix(in oklab, var(--kef-primary, #8d5e1f) 88%, #4f3d30);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  kefine-thread-line-copy {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.55rem;
    min-width: 0;
  }

  kefine-thread-line strong {
    font-size: 0.98rem;
    line-height: 1.25;
  }

  kefine-thread-line lefine-text {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  kefine-thread-copy > p,
  kefine-thread-block p,
  kefine-thread-comment p {
    margin: 0;
    color: color-mix(in oklab, var(--lefine-text, #453323) 84%, transparent);
    line-height: 1.5;
  }

  kefine-thread-blocks,
  kefine-thread-comments,
  kefine-thread-branch {
    display: grid;
    gap: 0.7rem;
  }

  kefine-thread-node > kefine-thread-branch {
    grid-column: 1 / -1;
    margin-top: 0.15rem;
  }

  kefine-thread-node[data-child='true'][data-branch-placement='left'] {
    margin-left: -1.15rem;
  }

  kefine-thread-node > kefine-thread-branch[data-branch-placement='left'] {
    margin-left: -1.3rem;
    margin-right: 1rem;
  }

  kefine-thread-branch[data-placement='left'] {
    margin-left: -1.1rem;
  }

  kefine-thread-block,
  kefine-thread-comment {
    display: grid;
    gap: 0.45rem;
    padding: 0.85rem 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 92%, white 8%);
    box-shadow: 0 0.65rem 1.4rem color-mix(in oklab, #a88654 10%, transparent);
  }

  kefine-thread-block strong,
  kefine-thread-comment strong {
    font-size: 0.84rem;
    color: color-mix(in oklab, var(--lefine-text, #453323) 72%, transparent);
  }

  kefine-thread-block pre {
    margin: 0;
    overflow-x: auto;
    font: 0.82rem/1.55 'Fira Mono', monospace;
    white-space: pre-wrap;
  }

  kefine-thread-block a {
    color: color-mix(in oklab, #8d5e1f 88%, var(--lefine-text, #453323));
    text-decoration: none;
  }

  kefine-thread-comment-entry {
    position: relative;
    z-index: 2;
    display: grid;
    gap: 0.6rem;
    margin-top: 0.1rem;
  }

  kefine-thread-next-step {
    position: relative;
    display: grid;
    align-items: flex-start;
    gap: 0.55rem;
    justify-self: start;
    width: min(100%, 34rem);
  }

  button[data-part='next-step-trigger'] {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    justify-self: start;
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    margin-top: 0.15rem;
    padding: 0;
    border: 1px dashed color-mix(in oklab, var(--kef-border, #e0c999) 80%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 78%, white 22%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 78%, transparent);
    font: inherit;
    box-shadow: 0 0 0 0.18rem color-mix(in oklab, var(--kef-bg, #f7ecd4) 92%, transparent);
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft);
  }

  button[data-part='next-step-trigger']:hover {
    border-color: color-mix(in oklab, var(--kef-primary, #b97a28) 34%, var(--kef-border, #e0c999));
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 8%, white);
  }

  kefine-thread-comment-plus-menu {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  kefine-thread-comment-entry [data-part='comment-trigger-action'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2.1rem;
    padding: 0.4rem 0.8rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 86%, white 14%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 82%, transparent);
    font: inherit;
    font-size: 0.86rem;
    font-weight: 500;
    line-height: 1;
  }

  kefine-thread-comment-entry [data-part='comment-trigger-action']:hover {
    border-color: color-mix(in oklab, var(--kef-primary, #b97a28) 28%, var(--kef-border, #e0c999));
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 6%, white);
  }

  kefine-thread-inline-node-editor {
    display: grid;
    gap: 0.35rem;
    width: min(100%, 34rem);
    margin-top: 0.1rem;
  }

  kefine-thread-inline-node-editor lefine-text {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.8rem;
    font-weight: 600;
  }

  :global(kefine-thread-inline-node-editor kefine-rich-editor) {
    gap: 0;
    padding: 0;
  }

  :global(kefine-thread-inline-node-editor kefine-rich-editor-toolbar) {
    display: none;
  }

  :global(kefine-thread-inline-node-editor kefine-rich-editor-surface) {
    min-height: 2.75rem;
    border-radius: 0.72rem;
    border-color: color-mix(in oklab, var(--kef-border, #e0c999) 74%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 74%, white 26%);
    box-shadow: none;
  }

  :global(kefine-thread-inline-node-editor lefine-box[data-part='editor-host']) {
    min-height: 2.65rem;
    padding: 0.55rem 0.7rem;
  }

  :global(kefine-thread-inline-node-editor textarea[data-part='source']) {
    height: 2.65rem;
    min-height: 0;
    padding: 0.6rem 0.7rem;
  }

  kefine-thread-comment-form {
    position: relative;
    z-index: 7;
    display: grid;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    border-radius: 1rem;
    background: var(--kef-bg-card, #f7ecd4);
    box-shadow: 0 1rem 2.4rem color-mix(in oklab, #000 14%, transparent);
  }

  kefine-thread-comment-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  kefine-thread-comment-actions [data-part='comment-system-toggle'] {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: auto;
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.82rem;
    font-weight: 600;
  }

  kefine-thread-comment-actions [data-part='comment-system-toggle'] input {
    accent-color: var(--kef-primary, #b97a28);
  }

  kefine-thread-comment-actions lefine-text {
    color: var(--lefine-text-soft, #6d5a49);
    font-size: 0.8rem;
    font-weight: 600;
  }

  kefine-thread-comment-actions button {
    min-height: 2.2rem;
    padding: 0.45rem 0.95rem;
    border: 1px solid color-mix(in oklab, var(--kef-primary, #b97a28) 30%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 10%, white);
    color: color-mix(in oklab, var(--kef-primary, #b97a28) 88%, #4f3d30);
    font: inherit;
    font-weight: 600;
  }

  kefine-thread-comment-actions button:disabled {
    opacity: 0.58;
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-dot {
    border-color: color-mix(in oklab, #d3a45c 78%, #f3deb4);
    background: radial-gradient(circle at 30% 30%, #f3dfb0, #b9853e);
    box-shadow: 0 0 0 0.2rem color-mix(in oklab, var(--kef-bg, #16110d) 82%, #3a2817 18%);
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='rail-dot-action'] {
    color: #2a1808;
  }

  :global(:root[data-kefine-theme='dark']) button[data-part='next-step-trigger'] {
    border-color: color-mix(in oklab, #d3a45c 36%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 92%, #3a2818 8%);
    color: #eadcc7;
    box-shadow: 0 0 0 0.18rem color-mix(in oklab, var(--kef-bg, #16110d) 84%, #3a2817 16%);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-comment-entry [data-part='comment-trigger-action'] {
    border-color: color-mix(in oklab, #d3a45c 30%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 88%, #3a2818 12%);
    color: #eadcc7;
  }

  :global(:root[data-kefine-theme='dark'] kefine-thread-inline-node-editor kefine-rich-editor-surface) {
    border-color: color-mix(in oklab, #d3a45c 30%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, var(--kef-bg-card, #22170f) 88%, #3a2818 12%);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-comment-form {
    background: var(--kef-bg-card, #22170f);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-branch-badge {
    border-color: color-mix(in oklab, #d3a45c 34%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, #d3a45c 16%, #2a1b10);
    color: #f4dfba;
  }

  button[data-part='next-step-trigger'] :global(svg),
  kefine-thread-comment-entry [data-part='comment-trigger-action'] :global(svg) {
    display: block;
    flex: 0 0 auto;
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-node[data-tone='active'] kefine-thread-dot,
  :global(:root[data-kefine-theme='dark']) kefine-thread-node[data-tone='loading'] kefine-thread-dot {
    border-color: color-mix(in oklab, #f0c980 82%, #6b4822);
    background: radial-gradient(circle at 30% 30%, #ffe8b3, #c88a38);
    box-shadow:
      0 0 0 0.22rem color-mix(in oklab, var(--kef-bg, #16110d) 80%, #3a2817 20%),
      0 0 0.8rem color-mix(in oklab, #f0c980 24%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-node[data-tone='active'] kefine-thread-dot::after,
  :global(:root[data-kefine-theme='dark']) kefine-thread-node[data-tone='loading'] kefine-thread-dot::after {
    background: conic-gradient(
      from 0deg,
      #4a2c0d 0deg 220deg,
      #fff3d6 220deg 270deg,
      transparent 270deg 360deg
    );
  }

  @keyframes kefine-thread-rise {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes kefine-thread-dot-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>

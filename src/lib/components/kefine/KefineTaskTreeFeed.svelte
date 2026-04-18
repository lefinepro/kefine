<script lang="ts">
  import Icon from '@iconify/svelte';
  import KefineTaskCloneMenu from '$lib/components/kefine/KefineTaskCloneMenu.svelte';
  import KefineTaskSettingsMenu from '$lib/components/kefine/KefineTaskSettingsMenu.svelte';
  import KefineRichTaskEditorDialog from '$lib/components/kefine/KefineRichTaskEditorDialog.svelte';
  import {
    appendTaskNodeComment,
    buildQueuedTaskRoot,
    buildTaskThreadNodes,
    replaceTaskNodeComment,
    type TaskThreadNode
  } from '$lib/components/kefine/kefine-task-feed';
  import type { OrderView } from '$lib/components/kefine/kefine-workflow';
  import type { TaskCloneFormat } from '$lib/components/kefine/kefine-task-clone';

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
    onUpdateTaskSettings
  }: {
    currentOrder: OrderView | null;
    queuedOrders?: OrderView[];
    labels: {
      boardTitle: string;
      leaveComment: string;
      saving: string;
      apply: string;
      richEditorDescription: string;
    };
    canSaveCloneLocally?: boolean;
    canManageTask?: boolean;
    commentSubmittingStepId?: string | null;
    onSubmitStepComment?: ((stepId: string, content: string) => Promise<void> | void) | null;
    onSaveDocument?: ((content: string) => Promise<void> | void) | null;
    onExportClone?: ((format: TaskCloneFormat) => void) | null;
    onSaveCloneLocally?: ((runLocally: boolean) => void) | null;
    onUpdateTaskSettings?: ((patch: Partial<Pick<OrderView, 'shareId' | 'isPublicTask'>>) => void) | null;
  } = $props();

  let commentDrafts = $state<Record<string, string>>({});
  let openCommentComposerId = $state<string | null>(null);
  let commentMetaActionByNodeId = $state<Record<string, 'comment' | 'file' | 'tag'>>({});

  const nextOrders = $derived.by(() =>
    queuedOrders.filter((order) => !currentOrder || order.id !== currentOrder.id).map(buildQueuedTaskRoot)
  );
  const currentThread = $derived(buildTaskThreadNodes(currentOrder));
  const taskMonogram = $derived.by(() => {
    const source = currentOrder?.title?.trim() || labels.boardTitle.trim();
    const match = source.match(/[A-Za-zА-Яа-яԱ-Ֆա-ֆ0-9]/u);
    return (match?.[0] ?? source.charAt(0) ?? 'T').toUpperCase();
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

  function openCommentComposerWithAction(nodeId: string, action: 'comment' | 'file' | 'tag'): void {
    openCommentComposerId = nodeId;
    commentMetaActionByNodeId = {
      ...commentMetaActionByNodeId,
      [nodeId]: action
    };
  }

  function ensureEditableDraft(node: TaskThreadNode): void {
    if (commentDrafts[node.id] !== undefined) {
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

  function openNodeCommentComposerWithAction(node: TaskThreadNode, action: 'comment' | 'file' | 'tag'): void {
    ensureEditableDraft(node);
    openCommentComposerWithAction(node.id, action);
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

    if (isBackendStepNode(node) && onSubmitStepComment && node.stepId) {
      await onSubmitStepComment(node.stepId, content);
    } else if (onSaveDocument && currentOrder) {
      const nextContent = node.comments?.length
        ? replaceTaskNodeComment(currentOrder, node.stepId || node.id, content)
        : appendTaskNodeComment(currentOrder, node.stepId || node.id, content);
      await onSaveDocument(nextContent);
    } else {
      return;
    }

    commentDrafts = {
      ...commentDrafts,
      [node.id]: ''
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
</script>

{#snippet threadNode(node: TaskThreadNode, index: number, child = false)}
  <kefine-thread-node
    data-tone={nodeTone(node)}
    data-mode={node.mode}
    data-child={child ? 'true' : undefined}
    data-commentable={node.commentable ? 'true' : undefined}
    data-comment-open={openCommentComposerId === node.id ? 'true' : undefined}
    style={`--node-delay:${index * 85}ms`}
  >
    <kefine-thread-rail aria-hidden="true">
      <kefine-thread-dot></kefine-thread-dot>
    </kefine-thread-rail>
    <kefine-thread-copy
      data-clickable={node.commentable ? 'true' : undefined}
      role={node.commentable ? 'button' : undefined}
      onclick={(event: MouseEvent) => handleNodeActivate(node, event)}
      onkeydown={(event: KeyboardEvent) => handleNodeKeydown(node, event)}
    >
      <kefine-thread-line>
        <strong>{node.title}</strong>
        {#if node.meta}
          <lefine-text>{node.meta}</lefine-text>
        {/if}
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

      {#if node.commentable}
        <kefine-thread-comment-entry>
          {#if openCommentComposerId === node.id}
            <kefine-thread-comment-plus-menu>
              <button
                type="button"
                data-part="comment-trigger"
                aria-label={labels.leaveComment}
                title={labels.leaveComment}
                onclick={() => openNodeCommentComposerWithAction(node, 'comment')}
              >
                <Icon icon="mdi:plus" width="18" height="18" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-part="comment-trigger-action"
                onclick={() => openNodeCommentComposerWithAction(node, 'file')}
              >
                <Icon icon="mdi:paperclip" width="16" height="16" aria-hidden="true" />
                <lefine-text>Add file</lefine-text>
              </button>
              <button
                type="button"
                data-part="comment-trigger-action"
                onclick={() => openNodeCommentComposerWithAction(node, 'tag')}
              >
                <Icon icon="mdi:tag-plus-outline" width="16" height="16" aria-hidden="true" />
                <lefine-text>Add tag</lefine-text>
              </button>
            </kefine-thread-comment-plus-menu>
          {:else}
            <button
              type="button"
              data-part="comment-trigger"
              aria-label={labels.leaveComment}
              title={labels.leaveComment}
              onclick={() => openNodeCommentComposer(node)}
            >
              <Icon icon="mdi:plus" width="18" height="18" aria-hidden="true" />
            </button>
          {/if}

          {#if openCommentComposerId === node.id}
            <kefine-thread-comment-form>
              <KefineRichTaskEditorDialog
                open={true}
                compact={true}
                enableMeta={true}
                autoOpenTagEditor={commentMetaActionByNodeId[node.id] === 'tag'}
                autoOpenFilePicker={commentMetaActionByNodeId[node.id] === 'file'}
                value={commentDrafts[node.id] ?? ''}
                description={labels.richEditorDescription}
                placeholder={labels.leaveComment}
                onApply={(nextValue) => updateCommentDraft(node.id, nextValue)}
              />
              <kefine-thread-comment-actions>
                {#if isCommentSubmitting(node)}
                  <lefine-text>{labels.saving}</lefine-text>
                {/if}
                <button
                  type="button"
                  disabled={isCommentSubmitting(node) || !(commentDrafts[node.id] ?? '').trim()}
                  onclick={() => void submitComment(node)}
                >
                  {labels.apply}
                </button>
              </kefine-thread-comment-actions>
            </kefine-thread-comment-form>
          {/if}
        </kefine-thread-comment-entry>
      {/if}
    </kefine-thread-copy>
  </kefine-thread-node>
{/snippet}

<kefine-thread-stage>
  <kefine-thread-head>
    <kefine-thread-title>
      <lefine-text data-part="task-monogram" aria-hidden="true">{taskMonogram}</lefine-text>
      <strong>{currentOrder?.title || labels.boardTitle}</strong>
    </kefine-thread-title>
    <kefine-thread-head-actions>
      {#if commentSubmittingStepId}
        <kefine-thread-status>{labels.saving}</kefine-thread-status>
      {/if}
      {#if currentOrder && canManageTask && onUpdateTaskSettings}
        <KefineTaskSettingsMenu order={currentOrder} onApply={onUpdateTaskSettings} />
      {/if}
      {#if currentOrder && onExportClone}
        <KefineTaskCloneMenu
          order={currentOrder}
          canSaveLocally={canSaveCloneLocally}
          onExport={onExportClone}
          onSaveLocally={onSaveCloneLocally ?? undefined}
        />
      {/if}
    </kefine-thread-head-actions>
  </kefine-thread-head>

  <kefine-thread aria-label={currentOrder?.title || labels.boardTitle}>
    {#each currentThread as node, index}
      {@render threadNode(node, index)}
    {/each}

    {#each nextOrders as root, rootIndex}
      <kefine-thread-node
        data-tone={nodeTone(root)}
        data-mode="compact"
        data-queued="true"
        style={`--node-delay:${(currentThread.length + rootIndex) * 85}ms`}
      >
        <kefine-thread-rail aria-hidden="true">
          <kefine-thread-dot></kefine-thread-dot>
        </kefine-thread-rail>
        <kefine-thread-copy>
          <kefine-thread-line>
            <strong>{root.title}</strong>
            {#if root.meta}
              <lefine-text>{root.meta}</lefine-text>
            {/if}
          </kefine-thread-line>
          {#if root.detail}
            <p>{root.detail}</p>
          {/if}

          {#if root.children?.length}
            <kefine-thread-branch>
              {#each root.children as child, childIndex}
                {@render threadNode(child, currentThread.length + rootIndex + childIndex + 1, true)}
              {/each}
            </kefine-thread-branch>
          {/if}
        </kefine-thread-copy>
      </kefine-thread-node>
    {/each}
  </kefine-thread>
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
    min-width: 0;
  }

  kefine-thread-head-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
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
    position: relative;
    display: grid;
    grid-template-columns: 1.35rem minmax(0, 1fr);
    gap: 0.95rem;
    padding: 0 0 1.2rem;
    opacity: 0;
    transform: translateY(0.45rem);
    animation: kefine-thread-rise 0.48s var(--kef-ease-soft, ease) forwards;
    animation-delay: var(--node-delay, 0ms);
  }

  kefine-thread-node[data-child='true'] {
    padding-left: 0.35rem;
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
    z-index: 1;
    width: 1rem;
    height: 1rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, #a77c38 54%, #e9d4a6);
    background: radial-gradient(circle at 30% 30%, #f6e7bd, #d8b16f);
    box-shadow: 0 0 0 0.2rem color-mix(in oklab, var(--kef-bg, #f7ecd4) 92%, transparent);
    margin-top: 0.08rem;
  }

  kefine-thread-dot::after {
    content: '';
    position: absolute;
    inset: 0.16rem;
    border-radius: 999px;
    background: color-mix(in oklab, #fff7e5 82%, #d8b16f);
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

  kefine-thread-copy {
    display: grid;
    gap: 0.55rem;
    min-width: 0;
  }

  kefine-thread-copy[data-clickable='true'] {
    cursor: pointer;
  }

  kefine-thread-copy[data-clickable='true']:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--kef-primary, #b97a28) 36%, transparent);
    outline-offset: 0.35rem;
    border-radius: 0.8rem;
  }

  kefine-thread-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.55rem;
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
    display: grid;
    gap: 0.6rem;
    margin-top: 0.1rem;
    justify-items: start;
  }

  kefine-thread-comment-plus-menu {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  kefine-thread-comment-entry [data-part='comment-trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    min-height: 2.25rem;
    padding: 0;
    border: 1px dashed color-mix(in oklab, var(--kef-border, #e0c999) 80%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 74%, white 26%);
    color: color-mix(in oklab, var(--lefine-text, #453323) 78%, transparent);
    font: inherit;
    opacity: 0.84;
    transform: translateY(0);
    pointer-events: auto;
    transition:
      opacity var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-thread-node[data-commentable='true']:hover kefine-thread-comment-entry [data-part='comment-trigger'],
  kefine-thread-node[data-commentable='true']:focus-within kefine-thread-comment-entry [data-part='comment-trigger'],
  kefine-thread-node[data-comment-open='true'] kefine-thread-comment-entry [data-part='comment-trigger'] {
    opacity: 1;
  }

  kefine-thread-comment-entry [data-part='comment-trigger']:hover {
    border-color: color-mix(in oklab, var(--kef-primary, #b97a28) 34%, var(--kef-border, #e0c999));
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 8%, white);
  }

  kefine-thread-comment-entry [data-part='comment-trigger-action'] {
    display: inline-flex;
    align-items: center;
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
  }

  kefine-thread-comment-entry [data-part='comment-trigger-action']:hover {
    border-color: color-mix(in oklab, var(--kef-primary, #b97a28) 28%, var(--kef-border, #e0c999));
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 6%, white);
  }

  kefine-thread-comment-form {
    display: grid;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid color-mix(in oklab, var(--kef-border, #e0c999) 78%, transparent);
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-bg-card, #f7ecd4) 94%, white 6%);
  }

  kefine-thread-comment-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
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

  :global(:root[data-kefine-theme='dark']) kefine-thread-comment-entry [data-part='comment-trigger'] {
    border-color: color-mix(in oklab, #d3a45c 58%, var(--kef-border, #6e5539));
    background: color-mix(in oklab, #4a3420 34%, var(--kef-bg-card, #21170f));
    color: color-mix(in oklab, #f7e7c2 92%, white);
    opacity: 0.96;
    box-shadow: 0 0.45rem 1rem color-mix(in oklab, #000 24%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) kefine-thread-comment-entry [data-part='comment-trigger']:hover {
    border-color: color-mix(in oklab, #e3b468 78%, var(--kef-primary, #b97a28));
    background: color-mix(in oklab, var(--kef-primary, #b97a28) 28%, var(--kef-bg-card, #21170f));
    color: #fff6df;
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

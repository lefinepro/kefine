<script lang="ts">
  import type { Objective, KeyResult } from '$lib/types/okr';
  import { okrStore } from '$lib/stores/okrs';
  import { formatQuarter, formatStatus } from '$lib/utils/formatters';
  import { getStatusColor } from '$lib/utils/colors';
  import ProgressRing from './ProgressRing.svelte';
  import KeyResultRow from './KeyResultRow.svelte';

  interface Props {
    objective: Objective;
    keyResults: KeyResult[];
    onEdit: (objective: Objective) => void;
    onAddKeyResult: (objectiveId: string) => void;
  }

  let { objective, keyResults, onEdit, onAddKeyResult }: Props = $props();

  let expanded = $state(false);

  /** Pure progress calculation to avoid store update() calls in reactive context */
  function calcProgress(): number {
    if (keyResults.length === 0) return 0;
    const totalWeight = keyResults.reduce((s, kr) => s + kr.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = keyResults.reduce((s, kr) => {
      const p = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return s + (p * kr.weight) / totalWeight;
    }, 0);
    return Math.max(0, Math.min(100, weighted));
  }

  const progress = $derived(calcProgress());
  const statusColor = $derived(getStatusColor(objective.status));

  function handleDelete() {
    if (confirm(`Delete objective "${objective.title}"? This will also remove all its key results.`)) {
      okrStore.deleteObjective(objective.id);
      okrStore.saveToLocalStorage();
    }
  }

  function handleArchiveToggle() {
    const newStatus = objective.status === 'archived' ? 'active' : 'archived';
    okrStore.updateObjective(objective.id, { status: newStatus });
    okrStore.saveToLocalStorage();
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<article class="okr-card" class:okr-card--archived={objective.status === 'archived'}>
  <header class="okr-card__header">
    <div class="okr-card__title-row">
      <ProgressRing {progress} size="md" />
      <div class="okr-card__meta">
        <h3 class="okr-card__title">{objective.title}</h3>
        <span class="okr-card__quarter">{formatQuarter(objective.quarter, objective.year)}</span>
      </div>
      <span
        class="okr-card__status"
        style="background: {statusColor}20; color: {statusColor}"
        aria-label="Status: {formatStatus(objective.status)}"
      >{formatStatus(objective.status)}</span>
    </div>

    {#if objective.description}
      <p class="okr-card__description">{objective.description}</p>
    {/if}
  </header>

  <div class="okr-card__body">
    <div class="okr-card__kr-header">
      <span class="okr-card__kr-count">{keyResults.length} Key Result{keyResults.length !== 1 ? 's' : ''}</span>
      <button
        type="button"
        class="btn-expand"
        aria-expanded={expanded}
        onclick={toggleExpanded}
      >
        {expanded ? 'Hide' : 'Show'} Key Results
      </button>
    </div>

    {#if expanded}
      {#if keyResults.length === 0}
        <p class="okr-card__kr-empty">No key results yet.</p>
      {:else}
        <ul class="okr-card__kr-list" aria-label="Key results for {objective.title}">
          {#each keyResults as kr (kr.id)}
            <KeyResultRow keyResult={kr} />
          {/each}
        </ul>
      {/if}
      <button
        type="button"
        class="btn-add-kr"
        onclick={() => onAddKeyResult(objective.id)}
      >
        + Add Key Result
      </button>
    {/if}
  </div>

  <footer class="okr-card__footer">
    <button
      type="button"
      class="btn-icon-text"
      onclick={() => onEdit(objective)}
      aria-label="Edit objective"
    >
      Edit
    </button>
    <button
      type="button"
      class="btn-icon-text"
      onclick={handleArchiveToggle}
      aria-label={objective.status === 'archived' ? 'Unarchive objective' : 'Archive objective'}
    >
      {objective.status === 'archived' ? 'Unarchive' : 'Archive'}
    </button>
    <button
      type="button"
      class="btn-icon-text btn-danger"
      onclick={handleDelete}
      aria-label="Delete objective"
    >
      Delete
    </button>
  </footer>
</article>

<style>
  .okr-card {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    transition: box-shadow 250ms ease, transform 250ms ease;
  }

  .okr-card:hover {
    box-shadow: var(--shadow-lg);
    transform: scale(1.01);
  }

  .okr-card--archived {
    opacity: 0.65;
  }

  .okr-card__header {
    padding: var(--spacing-4) var(--spacing-6) var(--spacing-3);
    border-bottom: 1px solid #f3f4f6;
  }

  .okr-card__title-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-2);
  }

  .okr-card__meta {
    flex: 1;
    min-width: 0;
  }

  .okr-card__title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }

  .okr-card__quarter {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
  }

  .okr-card__status {
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: capitalize;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .okr-card__description {
    font-size: var(--font-size-sm);
    color: var(--color-muted);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  .okr-card__body {
    padding: var(--spacing-3) var(--spacing-6);
    flex: 1;
  }

  .okr-card__kr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-2);
  }

  .okr-card__kr-count {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-muted);
  }

  .okr-card__kr-list {
    padding: 0;
    margin: 0;
  }

  .okr-card__kr-empty {
    font-size: var(--font-size-sm);
    color: var(--color-muted);
    text-align: center;
    padding: var(--spacing-3) 0;
    margin: 0;
  }

  .okr-card__footer {
    padding: var(--spacing-2) var(--spacing-6);
    border-top: 1px solid #f3f4f6;
    display: flex;
    gap: var(--spacing-2);
    background: #f9fafb;
  }

  .btn-expand {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    font-weight: 600;
  }

  .btn-expand:hover {
    text-decoration: underline;
  }

  .btn-add-kr {
    margin-top: var(--spacing-2);
    width: 100%;
    background: none;
    border: 1px dashed #d1d5db;
    border-radius: var(--radius-md);
    padding: var(--spacing-2);
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-primary);
    cursor: pointer;
    transition: background 150ms;
  }

  .btn-add-kr:hover {
    background: #f0f7ff;
  }

  .btn-icon-text {
    background: none;
    border: none;
    font-size: var(--font-size-xs);
    font-family: inherit;
    color: var(--color-muted);
    cursor: pointer;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    transition: background 150ms, color 150ms;
  }

  .btn-icon-text:hover {
    background: #e5e7eb;
    color: #111827;
  }

  .btn-danger:hover {
    background: #fee2e2;
    color: var(--color-error);
  }
</style>

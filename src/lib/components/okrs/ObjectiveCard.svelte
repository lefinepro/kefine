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

<okr-card status={objective.status}>
  <okr-card-header>
    <okr-card-title-row>
      <ProgressRing {progress} size="md" />
      <okr-card-meta>
        <h3>{objective.title}</h3>
        <span>{formatQuarter(objective.quarter, objective.year)}</span>
      </okr-card-meta>
      <okr-status-badge
        style="background: {statusColor}20; color: {statusColor}"
        aria-label="Status: {formatStatus(objective.status)}"
      >{formatStatus(objective.status)}</okr-status-badge>
    </okr-card-title-row>

    {#if objective.description}
      <okr-card-description>{objective.description}</okr-card-description>
    {/if}
  </okr-card-header>

  <okr-card-body>
    <okr-kr-header>
      <okr-kr-count>{keyResults.length} Key Result{keyResults.length !== 1 ? 's' : ''}</okr-kr-count>
      <button
        type="button"
        data-variant="expand"
        aria-expanded={expanded}
        onclick={toggleExpanded}
      >
        {expanded ? 'Hide' : 'Show'} Key Results
      </button>
    </okr-kr-header>

    {#if expanded}
      {#if keyResults.length === 0}
        <okr-kr-empty>No key results yet.</okr-kr-empty>
      {:else}
        <ul aria-label="Key results for {objective.title}">
          {#each keyResults as kr (kr.id)}
            <KeyResultRow keyResult={kr} />
          {/each}
        </ul>
      {/if}
      <button
        type="button"
        data-variant="add-kr"
        onclick={() => onAddKeyResult(objective.id)}
      >
        + Add Key Result
      </button>
    {/if}
  </okr-card-body>

  <okr-card-footer>
    <button
      type="button"
      data-variant="action"
      onclick={() => onEdit(objective)}
      aria-label="Edit objective"
    >
      Edit
    </button>
    <button
      type="button"
      data-variant="action"
      onclick={handleArchiveToggle}
      aria-label={objective.status === 'archived' ? 'Unarchive objective' : 'Archive objective'}
    >
      {objective.status === 'archived' ? 'Unarchive' : 'Archive'}
    </button>
    <button
      type="button"
      data-variant="action"
      data-danger
      onclick={handleDelete}
      aria-label="Delete objective"
    >
      Delete
    </button>
  </okr-card-footer>
</okr-card>

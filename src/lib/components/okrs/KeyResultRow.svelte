<script lang="ts">
  import type { KeyResult } from '$lib/types/okr';
  import { formatValue } from '$lib/utils/formatters';
  import { getProgressColor, getTargetTypeColor } from '$lib/utils/colors';
  import { okrStore } from '$lib/stores/okrs';

  interface Props {
    keyResult: KeyResult;
    onEdit: (keyResult: KeyResult) => void;
  }

  let { keyResult, onEdit }: Props = $props();

  const progress = $derived(
    keyResult.targetValue > 0
      ? Math.max(0, Math.min(100, (keyResult.currentValue / keyResult.targetValue) * 100))
      : 0
  );
  const progressColor = $derived(getProgressColor(progress));
  const typeColor = $derived(getTargetTypeColor(keyResult.targetType));

  function handleRangeInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    okrStore.updateKeyResult(keyResult.id, { currentValue: value });
    okrStore.saveToLocalStorage();
  }

  function handleDelete() {
    if (confirm(`Delete key result "${keyResult.title}"?`)) {
      okrStore.deleteKeyResult(keyResult.id);
      okrStore.saveToLocalStorage();
    }
  }
</script>

<li class="kr-row">
  <header class="kr-header">
    <kr-type-badge style="color: {typeColor}">{keyResult.targetType}</kr-type-badge>
    <kr-title>{keyResult.title}</kr-title>
    <kr-actions>
      <button type="button" data-variant="icon" aria-label="Edit key result" onclick={() => onEdit(keyResult)}>
        ✏️
      </button>
      <button type="button" data-variant="icon" aria-label="Delete key result" onclick={handleDelete}>
        🗑️
      </button>
    </kr-actions>
  </header>

  {#if keyResult.description}
    <p class="kr-description">{keyResult.description}</p>
  {/if}

  <figure class="kr-progress" aria-label="Progress bar {Math.round(progress)}%">
    <kr-progress-bar>
      <kr-progress-fill style="width: {progress}%; background: {progressColor}"></kr-progress-fill>
    </kr-progress-bar>
    <figcaption class="kr-progress-pct">{Math.round(progress)}%</figcaption>
  </figure>

  <p class="kr-values">
    <kr-current>{formatValue(keyResult.currentValue, keyResult.unit)}</kr-current>
    <kr-sep>/</kr-sep>
    <kr-target>{formatValue(keyResult.targetValue, keyResult.unit)}</kr-target>
  </p>

  {#if keyResult.targetType !== 'boolean'}
    <label for="kr-range-{keyResult.id}">Drag to update progress</label>
    <input
      id="kr-range-{keyResult.id}"
      type="range"
      min="0"
      max={keyResult.targetValue}
      step="1"
      value={keyResult.currentValue}
      oninput={handleRangeInput}
      aria-label="Progress slider for {keyResult.title}"
    />
  {/if}
</li>

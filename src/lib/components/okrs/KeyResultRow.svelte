<script lang="ts">
  import type { KeyResult } from '$lib/types/okr';
  import { formatValue } from '$lib/utils/formatters';
  import { getProgressColor, getTargetTypeColor } from '$lib/utils/colors';
  import { okrStore } from '$lib/stores/okrs';

  interface Props {
    keyResult: KeyResult;
  }

  let { keyResult }: Props = $props();

  let editMode = $state(false);
  let editValue: number = $state(0);
  let editError = $state('');

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

  function startEdit() {
    editValue = keyResult.currentValue; // capture current value when edit starts
    editError = '';
    editMode = true;
  }

  function cancelEdit() {
    editMode = false;
    editError = '';
  }

  function saveEdit() {
    if (editValue < 0) {
      editError = 'Value must be 0 or greater.';
      return;
    }
    if (editValue > keyResult.targetValue) {
      editError = `Value cannot exceed target (${keyResult.targetValue}).`;
      return;
    }
    okrStore.updateKeyResult(keyResult.id, { currentValue: editValue });
    okrStore.saveToLocalStorage();
    editMode = false;
    editError = '';
  }
</script>

<kr-row>
  <kr-header>
    <kr-type-badge style="color: {typeColor}">{keyResult.targetType}</kr-type-badge>
    <kr-title>{keyResult.title}</kr-title>
    {#if !editMode}
      <button type="button" data-variant="icon" aria-label="Edit key result" onclick={startEdit}>
        ✏️
      </button>
    {/if}
  </kr-header>

  {#if keyResult.description}
    <kr-description>{keyResult.description}</kr-description>
  {/if}

  <kr-progress aria-label="Progress bar {Math.round(progress)}%">
    <kr-progress-bar>
      <kr-progress-fill style="width: {progress}%; background: {progressColor}"></kr-progress-fill>
    </kr-progress-bar>
    <kr-progress-pct>{Math.round(progress)}%</kr-progress-pct>
  </kr-progress>

  <kr-values>
    <kr-current>{formatValue(keyResult.currentValue, keyResult.unit)}</kr-current>
    <kr-sep>/</kr-sep>
    <span>{formatValue(keyResult.targetValue, keyResult.unit)}</span>
  </kr-values>

  {#if !editMode && keyResult.targetType !== 'boolean'}
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

  {#if editMode}
    <kr-edit-form role="group" aria-label="Edit key result value">
      <label for="kr-edit-{keyResult.id}">New value ({keyResult.unit}):</label>
      <input
        id="kr-edit-{keyResult.id}"
        type="number"
        min="0"
        max={keyResult.targetValue}
        bind:value={editValue}
        aria-describedby={editError ? `kr-edit-err-${keyResult.id}` : undefined}
      />
      {#if editError}
        <small id="kr-edit-err-{keyResult.id}" role="alert">{editError}</small>
      {/if}
      <kr-edit-actions>
        <button type="button" data-variant="primary" onclick={saveEdit}>Save</button>
        <button type="button" data-variant="ghost" onclick={cancelEdit}>Cancel</button>
      </kr-edit-actions>
    </kr-edit-form>
  {/if}
</kr-row>

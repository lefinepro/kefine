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

<li class="kr-row">
  <div class="kr-header">
    <span class="kr-type-badge" style="color: {typeColor}">{keyResult.targetType}</span>
    <span class="kr-title">{keyResult.title}</span>
    {#if !editMode}
      <button type="button" class="btn-icon" aria-label="Edit key result" onclick={startEdit}>
        ✏️
      </button>
    {/if}
  </div>

  {#if keyResult.description}
    <p class="kr-description">{keyResult.description}</p>
  {/if}

  <div class="kr-progress-bar-wrap" aria-label="Progress bar {Math.round(progress)}%">
    <div class="kr-progress-bar-bg">
      <div
        class="kr-progress-bar-fill"
        style="width: {progress}%; background: {progressColor}"
      ></div>
    </div>
    <span class="kr-progress-pct">{Math.round(progress)}%</span>
  </div>

  <div class="kr-values">
    <span class="kr-current">{formatValue(keyResult.currentValue, keyResult.unit)}</span>
    <span class="kr-sep">/</span>
    <span class="kr-target">{formatValue(keyResult.targetValue, keyResult.unit)}</span>
  </div>

  {#if !editMode && keyResult.targetType !== 'boolean'}
    <label class="kr-slider-label" for="kr-range-{keyResult.id}">Drag to update progress</label>
    <input
      id="kr-range-{keyResult.id}"
      type="range"
      min="0"
      max={keyResult.targetValue}
      step="1"
      value={keyResult.currentValue}
      class="kr-slider"
      oninput={handleRangeInput}
      aria-label="Progress slider for {keyResult.title}"
    />
  {/if}

  {#if editMode}
    <div class="kr-edit-form" role="group" aria-label="Edit key result value">
      <label for="kr-edit-{keyResult.id}" class="kr-edit-label">New value ({keyResult.unit}):</label>
      <input
        id="kr-edit-{keyResult.id}"
        type="number"
        min="0"
        max={keyResult.targetValue}
        bind:value={editValue}
        class="kr-edit-input"
        aria-describedby={editError ? `kr-edit-err-${keyResult.id}` : undefined}
      />
      {#if editError}
        <small id="kr-edit-err-{keyResult.id}" class="kr-edit-error" role="alert">{editError}</small>
      {/if}
      <div class="kr-edit-actions">
        <button type="button" class="btn-primary" onclick={saveEdit}>Save</button>
        <button type="button" class="btn-ghost" onclick={cancelEdit}>Cancel</button>
      </div>
    </div>
  {/if}
</li>

<style>
  .kr-row {
    list-style: none;
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .kr-row:last-child {
    border-bottom: none;
  }

  .kr-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .kr-type-badge {
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .kr-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: #111827;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kr-description {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
    margin: 0;
  }

  .kr-progress-bar-wrap {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .kr-progress-bar-bg {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .kr-progress-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 400ms ease;
  }

  .kr-progress-pct {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-muted);
    min-width: 2.5rem;
    text-align: right;
  }

  .kr-values {
    font-size: var(--font-size-sm);
    color: var(--color-muted);
    display: flex;
    gap: var(--spacing-1);
  }

  .kr-current {
    font-weight: 700;
    color: #111827;
  }

  .kr-sep {
    color: #d1d5db;
  }

  .kr-slider-label {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
  }

  .kr-slider {
    width: 100%;
    accent-color: var(--color-primary);
    cursor: pointer;
  }

  .kr-edit-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    background: #f9fafb;
    border-radius: var(--radius-md);
  }

  .kr-edit-label {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
  }

  .kr-edit-input {
    padding: var(--spacing-1) var(--spacing-2);
    border: 1px solid #d1d5db;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: inherit;
    width: 100%;
  }

  .kr-edit-error {
    color: var(--color-error);
    font-size: var(--font-size-xs);
  }

  .kr-edit-actions {
    display: flex;
    gap: var(--spacing-2);
  }

  .btn-icon {
    background: none;
    border: none;
    padding: 0.15rem 0.25rem;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 150ms;
    line-height: 1;
  }

  .btn-icon:hover {
    opacity: 1;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    font-family: inherit;
    cursor: pointer;
    transition: background 150ms;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-muted);
    border: 1px solid #d1d5db;
    border-radius: var(--radius-sm);
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    font-family: inherit;
    cursor: pointer;
    transition: background 150ms;
  }

  .btn-ghost:hover {
    background: #f3f4f6;
  }
</style>

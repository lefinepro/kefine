<script lang="ts">
  import type { KeyResult, TargetType, Objective } from '$lib/types/okr';
  import { okrStore } from '$lib/stores/okrs';

  interface Props {
    keyResult?: KeyResult;
    objectiveId?: string;
    objectives: Objective[];
    onClose: () => void;
  }

  let { keyResult, objectiveId, objectives, onClose }: Props = $props();

  const isEdit = $derived(keyResult !== undefined);

  // Snapshot prop at mount time for form initialization — intentional one-time capture
  // svelte-ignore state_referenced_locally
  let title: string = $state(keyResult?.title ?? '');
  // svelte-ignore state_referenced_locally
  let description: string = $state(keyResult?.description ?? '');
  // svelte-ignore state_referenced_locally
  let targetType: TargetType = $state(keyResult?.targetType ?? 'number');
  // svelte-ignore state_referenced_locally
  let targetValue: number = $state(keyResult?.targetValue ?? 100);
  // svelte-ignore state_referenced_locally
  let currentValue: number = $state(keyResult?.currentValue ?? 0);
  // svelte-ignore state_referenced_locally
  let unit: string = $state(keyResult?.unit ?? '');
  // svelte-ignore state_referenced_locally
  let weight: number = $state(keyResult?.weight ?? 1);
  // svelte-ignore state_referenced_locally
  let selectedObjectiveId: string = $state(keyResult?.objectiveId ?? objectiveId ?? (objectives[0]?.id ?? ''));
  let errors: Record<string, string> = $state({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors['title'] = 'Title is required.';
    if (targetValue <= 0) newErrors['targetValue'] = 'Target value must be greater than 0.';
    if (currentValue < 0) newErrors['currentValue'] = 'Current value must be 0 or greater.';
    if (currentValue > targetValue) newErrors['currentValue'] = 'Current value cannot exceed target value.';
    if (weight <= 0) newErrors['weight'] = 'Weight must be greater than 0.';
    if (!selectedObjectiveId) newErrors['objectiveId'] = 'Please select a parent objective.';
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    if (isEdit && keyResult) {
      okrStore.updateKeyResult(keyResult.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetType,
        targetValue,
        currentValue,
        unit: unit.trim(),
        weight
      });
    } else {
      okrStore.addKeyResult({
        objectiveId: selectedObjectiveId,
        title: title.trim(),
        description: description.trim() || undefined,
        targetType,
        targetValue,
        currentValue,
        unit: unit.trim(),
        weight
      });
    }
    okrStore.saveToLocalStorage();
    onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" role="presentation" onclick={onClose} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal" role="dialog" aria-modal="true" aria-label="{isEdit ? 'Edit' : 'Create'} Key Result" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <header class="modal__header">
      <h2 class="modal__title">{isEdit ? 'Edit Key Result' : 'Add Key Result'}</h2>
      <button type="button" class="modal__close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form class="modal__body" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {#if !isEdit}
        <div class="form-group">
          <label for="kr-objective" class="form-label">Parent Objective <span aria-hidden="true">*</span></label>
          <select
            id="kr-objective"
            class="form-select"
            class:form-select--error={errors['objectiveId']}
            bind:value={selectedObjectiveId}
          >
            {#each objectives as obj (obj.id)}
              <option value={obj.id}>{obj.title}</option>
            {/each}
          </select>
          {#if errors['objectiveId']}
            <small class="form-error" role="alert">{errors['objectiveId']}</small>
          {/if}
        </div>
      {/if}

      <div class="form-group">
        <label for="kr-title" class="form-label">Title <span aria-hidden="true">*</span></label>
        <input
          id="kr-title"
          type="text"
          class="form-input"
          class:form-input--error={errors['title']}
          bind:value={title}
          placeholder="e.g. Increase NPS score"
          required
          aria-describedby={errors['title'] ? 'kr-title-err' : undefined}
        />
        {#if errors['title']}
          <small id="kr-title-err" class="form-error" role="alert">{errors['title']}</small>
        {/if}
      </div>

      <div class="form-group">
        <label for="kr-description" class="form-label">Description</label>
        <textarea
          id="kr-description"
          class="form-textarea"
          bind:value={description}
          rows={2}
          placeholder="Optional: more details..."
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="kr-type" class="form-label">Type</label>
          <select id="kr-type" class="form-select" bind:value={targetType}>
            <option value="number">Number</option>
            <option value="percentage">Percentage</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>

        <div class="form-group">
          <label for="kr-unit" class="form-label">Unit</label>
          <input
            id="kr-unit"
            type="text"
            class="form-input"
            bind:value={unit}
            placeholder="%,  users, $..."
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="kr-target" class="form-label">Target Value</label>
          <input
            id="kr-target"
            type="number"
            class="form-input"
            class:form-input--error={errors['targetValue']}
            bind:value={targetValue}
            min="0.01"
            step="any"
            aria-describedby={errors['targetValue'] ? 'kr-target-err' : undefined}
          />
          {#if errors['targetValue']}
            <small id="kr-target-err" class="form-error" role="alert">{errors['targetValue']}</small>
          {/if}
        </div>

        <div class="form-group">
          <label for="kr-current" class="form-label">Current Value</label>
          <input
            id="kr-current"
            type="number"
            class="form-input"
            class:form-input--error={errors['currentValue']}
            bind:value={currentValue}
            min="0"
            step="any"
            aria-describedby={errors['currentValue'] ? 'kr-current-err' : undefined}
          />
          {#if errors['currentValue']}
            <small id="kr-current-err" class="form-error" role="alert">{errors['currentValue']}</small>
          {/if}
        </div>
      </div>

      <div class="form-group">
        <label for="kr-weight" class="form-label">
          Weight
          <span class="form-label-hint">(relative importance, default 1)</span>
        </label>
        <input
          id="kr-weight"
          type="number"
          class="form-input"
          class:form-input--error={errors['weight']}
          bind:value={weight}
          min="0.1"
          step="0.1"
          aria-describedby={errors['weight'] ? 'kr-weight-err' : undefined}
        />
        {#if errors['weight']}
          <small id="kr-weight-err" class="form-error" role="alert">{errors['weight']}</small>
        {/if}
      </div>

      <div class="modal__actions">
        <button type="submit" class="btn-primary">{isEdit ? 'Save Changes' : 'Add Key Result'}</button>
        <button type="button" class="btn-ghost" onclick={onClose}>Cancel</button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: var(--spacing-4);
  }

  .modal {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    outline: none;
  }

  .modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) var(--spacing-6);
    border-bottom: 1px solid #f3f4f6;
  }

  .modal__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin: 0;
  }

  .modal__close {
    background: none;
    border: none;
    font-size: var(--font-size-lg);
    cursor: pointer;
    color: var(--color-muted);
    line-height: 1;
    padding: var(--spacing-1);
    border-radius: var(--radius-sm);
    transition: background 150ms;
  }

  .modal__close:hover {
    background: #f3f4f6;
  }

  .modal__body {
    padding: var(--spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .modal__actions {
    display: flex;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
  }

  .form-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }

  .form-label-hint {
    font-weight: 400;
    color: var(--color-muted);
    font-size: var(--font-size-xs);
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid #d1d5db;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: inherit;
    background: white;
    color: #111827;
    transition: border-color 150ms;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input--error,
  .form-select--error {
    border-color: var(--color-error);
  }

  .form-textarea {
    resize: vertical;
  }

  .form-error {
    color: var(--color-error);
    font-size: var(--font-size-xs);
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    font-family: inherit;
    font-weight: 600;
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
    border-radius: var(--radius-md);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    font-family: inherit;
    cursor: pointer;
    transition: background 150ms;
  }

  .btn-ghost:hover {
    background: #f3f4f6;
  }
</style>

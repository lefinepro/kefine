<script lang="ts">
  import type { Objective, Quarter, ObjectiveStatus } from '$lib/types/okr';
  import { okrStore } from '$lib/stores/okrs';
  import { getQuartersList, getYearsList, getCurrentQuarter } from '$lib/utils/helpers';

  interface Props {
    objective?: Objective;
    onClose: () => void;
  }

  let { objective, onClose }: Props = $props();

  const isEdit = $derived(objective !== undefined);
  const { quarter: currentQuarter, year: currentYear } = getCurrentQuarter();

  // Snapshot prop at mount time for form initialization — intentional one-time capture
  // svelte-ignore state_referenced_locally
  let title = $state(objective?.title ?? '');
  // svelte-ignore state_referenced_locally
  let description = $state(objective?.description ?? '');
  // svelte-ignore state_referenced_locally
  let quarter: Quarter = $state(objective?.quarter ?? currentQuarter);
  // svelte-ignore state_referenced_locally
  let year: number = $state(objective?.year ?? currentYear);
  // svelte-ignore state_referenced_locally
  let status: ObjectiveStatus = $state(objective?.status ?? 'active');
  let errors: Record<string, string> = $state({});

  const quarters = getQuartersList();
  const years = getYearsList();

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors['title'] = 'Title is required.';
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    if (isEdit && objective) {
      okrStore.updateObjective(objective.id, { title: title.trim(), description: description.trim() || undefined, quarter, year, status });
    } else {
      okrStore.addObjective({ title: title.trim(), description: description.trim() || undefined, quarter, year, status });
    }
    okrStore.saveToLocalStorage();
    onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" role="presentation" onclick={onClose} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal" role="dialog" aria-modal="true" aria-label="{isEdit ? 'Edit' : 'Create'} Objective" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <header class="modal__header">
      <h2 class="modal__title">{isEdit ? 'Edit Objective' : 'Create Objective'}</h2>
      <button type="button" class="modal__close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form class="modal__body" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div class="form-group">
        <label for="obj-title" class="form-label">Title <span aria-hidden="true">*</span></label>
        <input
          id="obj-title"
          type="text"
          class="form-input"
          class:form-input--error={errors['title']}
          bind:value={title}
          placeholder="e.g. Improve customer satisfaction"
          required
          aria-describedby={errors['title'] ? 'obj-title-err' : undefined}
        />
        {#if errors['title']}
          <small id="obj-title-err" class="form-error" role="alert">{errors['title']}</small>
        {/if}
      </div>

      <div class="form-group">
        <label for="obj-description" class="form-label">Description</label>
        <textarea
          id="obj-description"
          class="form-textarea"
          bind:value={description}
          rows={3}
          placeholder="Optional: describe this objective..."
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="obj-quarter" class="form-label">Quarter</label>
          <select id="obj-quarter" class="form-select" bind:value={quarter}>
            {#each quarters as q (q.value)}
              <option value={q.value}>{q.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="obj-year" class="form-label">Year</label>
          <select id="obj-year" class="form-select" bind:value={year}>
            {#each years as y (y)}
              <option value={y}>{y}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if isEdit}
        <div class="form-group">
          <label for="obj-status" class="form-label">Status</label>
          <select id="obj-status" class="form-select" bind:value={status}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      {/if}

      <div class="modal__actions">
        <button type="submit" class="btn-primary">{isEdit ? 'Save Changes' : 'Create Objective'}</button>
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

  .form-input--error {
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

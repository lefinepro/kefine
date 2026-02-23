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
<section class="okr-modal" role="presentation" onclick={onClose} onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <dialog class="okr-modal-dialog" open aria-modal="true" aria-label="{isEdit ? 'Edit' : 'Create'} Key Result" onclick={(e: MouseEvent) => e.stopPropagation()}>
    <header class="okr-modal-header">
      <h2>{isEdit ? 'Edit Key Result' : 'Add Key Result'}</h2>
      <button type="button" data-variant="close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <section class="okr-modal-body">
        {#if !isEdit}
          <p class="form-group">
            <label for="kr-objective">Parent Objective <required-mark aria-hidden="true">*</required-mark></label>
            <select
              id="kr-objective"
              aria-invalid={errors['objectiveId'] ? 'true' : undefined}
              bind:value={selectedObjectiveId}
            >
              {#each objectives as obj (obj.id)}
                <option value={obj.id}>{obj.title}</option>
              {/each}
            </select>
            {#if errors['objectiveId']}
              <small role="alert">{errors['objectiveId']}</small>
            {/if}
          </p>
        {/if}

        <p class="form-group">
          <label for="kr-title">Title <required-mark aria-hidden="true">*</required-mark></label>
          <input
            id="kr-title"
            type="text"
            aria-invalid={errors['title'] ? 'true' : undefined}
            bind:value={title}
            placeholder="e.g. Increase NPS score"
            required
            aria-describedby={errors['title'] ? 'kr-title-err' : undefined}
          />
          {#if errors['title']}
            <small id="kr-title-err" role="alert">{errors['title']}</small>
          {/if}
        </p>

        <p class="form-group">
          <label for="kr-description">Description</label>
          <textarea
            id="kr-description"
            bind:value={description}
            rows={2}
            placeholder="Optional: more details..."
          ></textarea>
        </p>

        <fieldset class="form-row">
          <p class="form-group">
            <label for="kr-type">Type</label>
            <select id="kr-type" bind:value={targetType}>
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
              <option value="boolean">Boolean</option>
            </select>
          </p>

          <p class="form-group">
            <label for="kr-unit">Unit</label>
            <input
              id="kr-unit"
              type="text"
              bind:value={unit}
              placeholder="%,  users, $..."
            />
          </p>
        </fieldset>

        <fieldset class="form-row">
          <p class="form-group">
            <label for="kr-target">Target Value</label>
            <input
              id="kr-target"
              type="number"
              aria-invalid={errors['targetValue'] ? 'true' : undefined}
              bind:value={targetValue}
              min="0.01"
              step="any"
              aria-describedby={errors['targetValue'] ? 'kr-target-err' : undefined}
            />
            {#if errors['targetValue']}
              <small id="kr-target-err" role="alert">{errors['targetValue']}</small>
            {/if}
          </p>

          <p class="form-group">
            <label for="kr-current">Current Value</label>
            <input
              id="kr-current"
              type="number"
              aria-invalid={errors['currentValue'] ? 'true' : undefined}
              bind:value={currentValue}
              min="0"
              step="any"
              aria-describedby={errors['currentValue'] ? 'kr-current-err' : undefined}
            />
            {#if errors['currentValue']}
              <small id="kr-current-err" role="alert">{errors['currentValue']}</small>
            {/if}
          </p>
        </fieldset>

        <p class="form-group">
          <label for="kr-weight">
            Weight
            <hint>(relative importance, default 1)</hint>
          </label>
          <input
            id="kr-weight"
            type="number"
            aria-invalid={errors['weight'] ? 'true' : undefined}
            bind:value={weight}
            min="0.1"
            step="0.1"
            aria-describedby={errors['weight'] ? 'kr-weight-err' : undefined}
          />
          {#if errors['weight']}
            <small id="kr-weight-err" role="alert">{errors['weight']}</small>
          {/if}
        </p>

        <footer class="okr-modal-actions">
          <button type="submit" data-variant="primary">{isEdit ? 'Save Changes' : 'Add Key Result'}</button>
          <button type="button" data-variant="ghost" onclick={onClose}>Cancel</button>
        </footer>
      </section>
    </form>
  </dialog>
</section>

<style>
  @import './key-result-modal.css';
</style>

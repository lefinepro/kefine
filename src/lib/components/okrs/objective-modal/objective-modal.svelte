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
<section class="okr-modal" role="presentation" onclick={onClose} onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <dialog class="okr-modal-dialog" open aria-modal="true" aria-label="{isEdit ? 'Edit' : 'Create'} Objective" onclick={(e: MouseEvent) => e.stopPropagation()}>
    <header class="okr-modal-header">
      <h2>{isEdit ? 'Edit Objective' : 'Create Objective'}</h2>
      <button type="button" data-variant="close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <section class="okr-modal-body">
        <p class="form-group">
          <label for="obj-title">Title <required-mark aria-hidden="true">*</required-mark></label>
          <input
            id="obj-title"
            type="text"
            aria-invalid={errors['title'] ? 'true' : undefined}
            bind:value={title}
            placeholder="e.g. Improve customer satisfaction"
            required
            aria-describedby={errors['title'] ? 'obj-title-err' : undefined}
          />
          {#if errors['title']}
            <small id="obj-title-err" role="alert">{errors['title']}</small>
          {/if}
        </p>

        <p class="form-group">
          <label for="obj-description">Description</label>
          <textarea
            id="obj-description"
            bind:value={description}
            rows={3}
            placeholder="Optional: describe this objective..."
          ></textarea>
        </p>

        <fieldset class="form-row">
          <p class="form-group">
            <label for="obj-quarter">Quarter</label>
            <select id="obj-quarter" bind:value={quarter}>
              {#each quarters as q (q.value)}
                <option value={q.value}>{q.label}</option>
              {/each}
            </select>
          </p>

          <p class="form-group">
            <label for="obj-year">Year</label>
            <select id="obj-year" bind:value={year}>
              {#each years as y (y)}
                <option value={y}>{y}</option>
              {/each}
            </select>
          </p>
        </fieldset>

        {#if isEdit}
          <p class="form-group">
            <label for="obj-status">Status</label>
            <select id="obj-status" bind:value={status}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </p>
        {/if}

        <footer class="okr-modal-actions">
          <button type="submit" data-variant="primary">{isEdit ? 'Save Changes' : 'Create Objective'}</button>
          <button type="button" data-variant="ghost" onclick={onClose}>Cancel</button>
        </footer>
      </section>
    </form>
  </dialog>
</section>

<style>
  @import './objective-modal.css';
</style>

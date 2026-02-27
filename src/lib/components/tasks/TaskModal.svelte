<script lang="ts">
  import type { Task, TaskStatus, Priority, Objective, KeyResult, LinkType } from '$lib/types/okr';
  import { taskStore } from '$lib/stores/tasks';

  interface Props {
    task?: Task;
    objectives: Objective[];
    keyResults: KeyResult[];
    onClose: () => void;
  }

  let { task, objectives, keyResults, onClose }: Props = $props();

  const isEdit = $derived(task !== undefined);

  // Snapshot prop at mount time — intentional one-time capture
  // svelte-ignore state_referenced_locally
  let title: string = $state(task?.title ?? '');
  // svelte-ignore state_referenced_locally
  let description: string = $state(task?.description ?? '');
  // svelte-ignore state_referenced_locally
  let status: TaskStatus = $state(task?.status ?? 'pending');
  // svelte-ignore state_referenced_locally
  let priority: Priority = $state(task?.priority ?? 'medium');

  let errors: Record<string, string> = $state({});

  // OKR selector state
  let okrSearch = $state('');
  let selectedLinkType: LinkType = $state('objective');
  let selectedObjectiveId = $state('');
  let selectedKeyResultId = $state('');

  const activeObjectives = $derived(
    objectives.filter((obj) => obj.status === 'active')
  );

  const filteredObjectives = $derived(
    okrSearch.trim()
      ? activeObjectives.filter((obj) =>
          obj.title.toLowerCase().includes(okrSearch.toLowerCase())
        )
      : activeObjectives
  );

  const keyResultsForSelectedObjective = $derived(
    selectedObjectiveId
      ? keyResults.filter((kr) => kr.objectiveId === selectedObjectiveId)
      : []
  );

  // Current links (from existing task or newly added in this session)
  // svelte-ignore state_referenced_locally
  let pendingLinks: Array<{
    objectiveId?: string;
    keyResultId?: string;
    linkType: LinkType;
  }> = $state(
    task?.okrLinks.map((l) => ({
      objectiveId: l.objectiveId,
      keyResultId: l.keyResultId,
      linkType: l.linkType
    })) ?? []
  );

  function getObjectiveLabel(objectiveId?: string): string {
    if (!objectiveId) return '';
    const obj = objectives.find((o) => o.id === objectiveId);
    return obj ? `${obj.title} (${obj.quarter} ${obj.year})` : objectiveId;
  }

  function getKeyResultLabel(keyResultId?: string): string {
    if (!keyResultId) return '';
    const kr = keyResults.find((k) => k.id === keyResultId);
    return kr ? kr.title : keyResultId;
  }

  function addLink() {
    if (!selectedObjectiveId) return;
    if (selectedLinkType === 'keyresult' && !selectedKeyResultId) return;

    const isDuplicate = pendingLinks.some((l) => {
      if (selectedLinkType === 'objective') {
        return l.linkType === 'objective' && l.objectiveId === selectedObjectiveId;
      }
      return l.linkType === 'keyresult' && l.keyResultId === selectedKeyResultId;
    });
    if (isDuplicate) return;

    pendingLinks = [
      ...pendingLinks,
      {
        objectiveId: selectedObjectiveId,
        keyResultId: selectedLinkType === 'keyresult' ? selectedKeyResultId : undefined,
        linkType: selectedLinkType
      }
    ];

    // Reset selector
    selectedObjectiveId = '';
    selectedKeyResultId = '';
    okrSearch = '';
  }

  function removeLink(index: number) {
    pendingLinks = pendingLinks.filter((_, i) => i !== index);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors['title'] = 'Title is required.';
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    if (isEdit && task) {
      taskStore.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority
      });
      // Sync links: remove all existing, then re-add pending
      // Clear existing links first
      const existingLinks = [...(task.okrLinks ?? [])];
      for (const link of existingLinks) {
        taskStore.unlinkTaskFromOKR(task.id, link.id);
      }
      for (const pl of pendingLinks) {
        taskStore.linkTaskToOKR(task.id, {
          objectiveId: pl.objectiveId,
          keyResultId: pl.keyResultId,
          linkType: pl.linkType
        });
      }
    } else {
      const newTask = taskStore.addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority
      });
      for (const pl of pendingLinks) {
        taskStore.linkTaskToOKR(newTask.id, {
          objectiveId: pl.objectiveId,
          keyResultId: pl.keyResultId,
          linkType: pl.linkType
        });
      }
    }

    taskStore.saveToLocalStorage();
    onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section class="okr-modal" role="presentation" onclick={onClose} onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <dialog class="okr-modal-dialog" open aria-modal="true" aria-label="{isEdit ? 'Edit' : 'Create'} Task" onclick={(e: MouseEvent) => e.stopPropagation()}>
    <header class="okr-modal-header">
      <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
      <button type="button" data-variant="close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <section class="okr-modal-body">

        <p class="form-group">
          <label for="task-title">Title <required-mark aria-hidden="true">*</required-mark></label>
          <input
            id="task-title"
            type="text"
            bind:value={title}
            placeholder="e.g. Write quarterly review"
            required
            aria-invalid={errors['title'] ? 'true' : undefined}
            aria-describedby={errors['title'] ? 'task-title-err' : undefined}
          />
          {#if errors['title']}
            <small id="task-title-err" role="alert">{errors['title']}</small>
          {/if}
        </p>

        <p class="form-group">
          <label for="task-description">Description</label>
          <textarea
            id="task-description"
            bind:value={description}
            rows={2}
            placeholder="Optional: more details..."
          ></textarea>
        </p>

        <fieldset class="form-row">
          <p class="form-group">
            <label for="task-status">Status</label>
            <select id="task-status" bind:value={status}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </p>

          <p class="form-group">
            <label for="task-priority">Priority</label>
            <select id="task-priority" bind:value={priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </p>
        </fieldset>

        <!-- OKR Linking Section -->
        {#if objectives.length > 0}
          <fieldset class="task-okr-section">
            <legend>Link to OKRs</legend>

            {#if pendingLinks.length > 0}
              <ul class="task-okr-links" aria-label="Linked OKRs">
                {#each pendingLinks as pl, i (i)}
                  <li class="task-okr-link-item">
                    <task-link-info>
                      <task-link-type>{pl.linkType === 'keyresult' ? 'KR' : 'OKR'}</task-link-type>
                      <task-link-label>
                        {pl.linkType === 'keyresult'
                          ? getKeyResultLabel(pl.keyResultId)
                          : getObjectiveLabel(pl.objectiveId)}
                      </task-link-label>
                      {#if pl.linkType === 'keyresult' && pl.objectiveId}
                        <task-link-parent>in {getObjectiveLabel(pl.objectiveId)}</task-link-parent>
                      {/if}
                    </task-link-info>
                    <button
                      type="button"
                      data-variant="icon"
                      aria-label="Remove link"
                      onclick={() => removeLink(i)}
                    >✕</button>
                  </li>
                {/each}
              </ul>
            {/if}

            <fieldset class="task-okr-selector">
              <p class="form-group">
                <label for="task-link-type">Link type</label>
                <select id="task-link-type" bind:value={selectedLinkType}>
                  <option value="objective">Objective</option>
                  <option value="keyresult">Key Result</option>
                </select>
              </p>

              <p class="form-group">
                <label for="task-okr-search">Search objectives</label>
                <input
                  id="task-okr-search"
                  type="search"
                  bind:value={okrSearch}
                  placeholder="Filter objectives..."
                  aria-label="Search objectives"
                />
              </p>

              <p class="form-group">
                <label for="task-objective-select">Objective</label>
                <select id="task-objective-select" bind:value={selectedObjectiveId}>
                  <option value="">Select objective...</option>
                  {#each filteredObjectives as obj (obj.id)}
                    <option value={obj.id}>{obj.title} ({obj.quarter} {obj.year})</option>
                  {/each}
                </select>
              </p>

              {#if selectedLinkType === 'keyresult' && selectedObjectiveId}
                <p class="form-group">
                  <label for="task-kr-select">Key Result</label>
                  <select id="task-kr-select" bind:value={selectedKeyResultId}>
                    <option value="">Select key result...</option>
                    {#each keyResultsForSelectedObjective as kr (kr.id)}
                      <option value={kr.id}>{kr.title}</option>
                    {/each}
                  </select>
                </p>
              {/if}

              <button
                type="button"
                data-variant="ghost"
                onclick={addLink}
                disabled={!selectedObjectiveId || (selectedLinkType === 'keyresult' && !selectedKeyResultId)}
              >
                + Add Link
              </button>
            </fieldset>
          </fieldset>
        {/if}

        <footer class="okr-modal-actions">
          <button type="submit" data-variant="primary">{isEdit ? 'Save Changes' : 'Create Task'}</button>
          <button type="button" data-variant="ghost" onclick={onClose}>Cancel</button>
        </footer>
      </section>
    </form>
  </dialog>
</section>

<style>
  .task-okr-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border: 1px solid var(--okr-color-border-light);
    border-radius: var(--okr-radius-md);
    padding: 0.75rem;
  }

  .task-okr-section legend {
    font-size: var(--okr-font-size-sm);
    font-weight: 600;
    color: var(--okr-color-text-label);
    padding: 0 0.25rem;
  }

  .task-okr-links {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    list-style: none;
  }

  .task-okr-link-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: var(--okr-color-bg);
    border-radius: var(--okr-radius-sm);
  }

  task-link-info {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
    min-width: 0;
    font-size: 0.8rem;
    overflow: hidden;
  }

  task-link-type {
    display: inline;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--okr-color-muted);
    flex-shrink: 0;
  }

  task-link-label {
    display: inline;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  task-link-parent {
    display: inline;
    font-size: 0.7rem;
    color: var(--okr-color-muted);
    white-space: nowrap;
  }

  .task-okr-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: none;
    padding: 0;
    border-top: 1px dashed var(--okr-color-border);
    padding-top: 0.75rem;
  }
</style>

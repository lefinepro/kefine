<script lang="ts">
  import type { Task, TaskStatus, Priority, OKRLink, RepositoryLink, Objective, KeyResult, LinkType } from '$lib/types/okr';
  import { taskStore } from '$lib/stores/tasks';
  import { getPriorityColor } from '$lib/utils/colors';

  interface Props {
    task?: Task;
    objectives: Objective[];
    keyResults: KeyResult[];
    onClose: () => void;
  }

  let { task, objectives, keyResults, onClose }: Props = $props();

  const isEdit = $derived(task !== undefined);

  // Form fields — snapshot at mount time
  // svelte-ignore state_referenced_locally
  let title: string = $state(task?.title ?? '');
  // svelte-ignore state_referenced_locally
  let description: string = $state(task?.description ?? '');
  // svelte-ignore state_referenced_locally
  let status: TaskStatus = $state(task?.status ?? 'pending');
  // svelte-ignore state_referenced_locally
  let priority: Priority = $state(task?.priority ?? 'medium');
  // svelte-ignore state_referenced_locally
  let dueDate: string = $state(task?.dueDate ?? '');
  // svelte-ignore state_referenced_locally
  let dueTime: string = $state(task?.dueTime ?? '');
  // svelte-ignore state_referenced_locally
  let okrLinks: OKRLink[] = $state(task?.okrLinks ? [...task.okrLinks] : []);
  // svelte-ignore state_referenced_locally
  let repositoryLinks: RepositoryLink[] = $state(task?.repositoryLinks ? [...task.repositoryLinks] : []);

  let errors: Record<string, string> = $state({});

  // OKR selection state
  let selectedObjectiveId: string = $state('');
  let selectedKeyResultId: string = $state('');
  let okrLinkType: LinkType = $state('objective');

  // Repository link input
  let repoUrlInput: string = $state('');
  let repoUrlError: string = $state('');

  // Derived filtered key results for selected objective
  const filteredKeyResults = $derived(
    selectedObjectiveId
      ? keyResults.filter((kr) => kr.objectiveId === selectedObjectiveId)
      : []
  );

  // Priority options with colors
  const priorityOptions: { value: Priority; label: string }[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors['title'] = 'Title is required.';
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      repositoryLinks,
      okrLinks
    };

    if (isEdit && task) {
      taskStore.updateTask(task.id, taskData);
    } else {
      taskStore.addTask(taskData);
    }
    taskStore.saveToLocalStorage();
    onClose();
  }

  function addOKRLink() {
    if (!selectedObjectiveId) return;

    const isDuplicate = okrLinks.some(
      (l) =>
        (okrLinkType === 'objective' && l.objectiveId === selectedObjectiveId && !l.keyResultId) ||
        (okrLinkType === 'keyresult' && l.keyResultId === selectedKeyResultId)
    );
    if (isDuplicate) return;

    const newLink: OKRLink = {
      id: crypto.randomUUID(),
      taskId: task?.id ?? '',
      objectiveId: selectedObjectiveId,
      keyResultId: okrLinkType === 'keyresult' && selectedKeyResultId ? selectedKeyResultId : undefined,
      linkType: okrLinkType,
      createdAt: new Date()
    };
    okrLinks = [...okrLinks, newLink];
    selectedObjectiveId = '';
    selectedKeyResultId = '';
  }

  function removeOKRLink(linkId: string) {
    okrLinks = okrLinks.filter((l) => l.id !== linkId);
  }

  function getObjectiveTitle(id: string): string {
    return objectives.find((o) => o.id === id)?.title ?? id;
  }

  function getKeyResultTitle(id: string): string {
    return keyResults.find((kr) => kr.id === id)?.title ?? id;
  }

  function getLinkLabel(link: OKRLink): string {
    if (link.linkType === 'keyresult' && link.keyResultId) {
      return `KR: ${getKeyResultTitle(link.keyResultId)}`;
    }
    return `Obj: ${getObjectiveTitle(link.objectiveId ?? '')}`;
  }

  function addRepositoryLink() {
    repoUrlError = '';
    const url = repoUrlInput.trim();
    if (!url) {
      repoUrlError = 'Please enter a URL.';
      return;
    }
    try {
      new URL(url);
    } catch {
      repoUrlError = 'Please enter a valid URL.';
      return;
    }
    const isDuplicate = repositoryLinks.some((l) => l.url === url);
    if (isDuplicate) {
      repoUrlError = 'This URL is already added.';
      return;
    }
    const newLink: RepositoryLink = {
      id: crypto.randomUUID(),
      url,
      name: extractRepoName(url)
    };
    repositoryLinks = [...repositoryLinks, newLink];
    repoUrlInput = '';
  }

  function removeRepositoryLink(linkId: string) {
    repositoryLinks = repositoryLinks.filter((l) => l.id !== linkId);
  }

  function extractRepoName(url: string): string {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      if (parts.length === 1) return parts[0] ?? u.hostname;
      return u.hostname;
    } catch {
      return url;
    }
  }

  function clearDueDate() {
    dueDate = '';
    dueTime = '';
  }

  function handleRepoKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRepositoryLink();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  class="okr-modal"
  role="presentation"
  onclick={onClose}
  onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } }}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <dialog
    class="okr-modal-dialog task-modal-dialog"
    open
    aria-modal="true"
    aria-label="{isEdit ? 'Edit' : 'Create'} Task"
    onclick={(e: MouseEvent) => e.stopPropagation()}
  >
    <header class="okr-modal-header">
      <h2>{isEdit ? 'Edit Task' : 'Add Task'}</h2>
      <button type="button" data-variant="close" aria-label="Close modal" onclick={onClose}>✕</button>
    </header>

    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <section class="okr-modal-body">

        <!-- Title -->
        <p class="form-group">
          <label for="task-title">Title <required-mark aria-hidden="true">*</required-mark></label>
          <input
            id="task-title"
            type="text"
            aria-invalid={errors['title'] ? 'true' : undefined}
            bind:value={title}
            placeholder="e.g. Write integration tests"
            required
            aria-describedby={errors['title'] ? 'task-title-err' : undefined}
          />
          {#if errors['title']}
            <small id="task-title-err" role="alert">{errors['title']}</small>
          {/if}
        </p>

        <!-- Description -->
        <p class="form-group">
          <label for="task-description">Description</label>
          <textarea
            id="task-description"
            bind:value={description}
            rows={2}
            placeholder="Optional: more details..."
          ></textarea>
        </p>

        <!-- Status + Priority -->
        <fieldset class="form-row">
          <p class="form-group">
            <label for="task-status">Status</label>
            <select id="task-status" bind:value={status}>
              {#each statusOptions as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </p>

          <p class="form-group">
            <label for="task-priority">Priority</label>
            <select
              id="task-priority"
              bind:value={priority}
              style="border-left: 4px solid {getPriorityColor(priority)}"
            >
              {#each priorityOptions as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </p>
        </fieldset>

        <!-- Due Date -->
        <fieldset class="form-section" aria-label="Due date">
          <legend class="form-section-title">Due Date</legend>
          <fieldset class="form-row">
            <p class="form-group">
              <label for="task-due-date">Date</label>
              <input
                id="task-due-date"
                type="date"
                bind:value={dueDate}
              />
            </p>
            <p class="form-group">
              <label for="task-due-time">Time <hint>(optional)</hint></label>
              <input
                id="task-due-time"
                type="time"
                bind:value={dueTime}
                disabled={!dueDate}
              />
            </p>
          </fieldset>
          {#if dueDate}
            <button type="button" data-variant="muted" onclick={clearDueDate}>Clear due date</button>
          {/if}
        </fieldset>

        <!-- OKR Linking -->
        <fieldset class="form-section" aria-label="Link to OKR">
          <legend class="form-section-title">Link to OKR</legend>

          {#if okrLinks.length > 0}
            <task-okr-tags aria-label="Linked OKRs">
              {#each okrLinks as link (link.id)}
                <task-okr-tag>
                  <span>{getLinkLabel(link)}</span>
                  <button
                    type="button"
                    data-variant="tag-remove"
                    aria-label="Remove OKR link"
                    onclick={() => removeOKRLink(link.id)}
                  >✕</button>
                </task-okr-tag>
              {/each}
            </task-okr-tags>
          {/if}

          {#if objectives.length > 0}
            <p class="form-group">
              <label for="task-okr-type">Link Type</label>
              <select id="task-okr-type" bind:value={okrLinkType}>
                <option value="objective">Objective</option>
                <option value="keyresult">Key Result</option>
              </select>
            </p>

            <p class="form-group">
              <label for="task-okr-objective">Objective</label>
              <select id="task-okr-objective" bind:value={selectedObjectiveId}>
                <option value="">— Select objective —</option>
                {#each objectives as obj (obj.id)}
                  <option value={obj.id}>{obj.title} ({obj.quarter} {obj.year})</option>
                {/each}
              </select>
            </p>

            {#if okrLinkType === 'keyresult' && selectedObjectiveId}
              <p class="form-group">
                <label for="task-okr-kr">Key Result</label>
                <select id="task-okr-kr" bind:value={selectedKeyResultId}>
                  <option value="">— Select key result —</option>
                  {#each filteredKeyResults as kr (kr.id)}
                    <option value={kr.id}>{kr.title}</option>
                  {/each}
                </select>
              </p>
            {/if}

            <button
              type="button"
              data-variant="ghost"
              onclick={addOKRLink}
              disabled={!selectedObjectiveId || (okrLinkType === 'keyresult' && !selectedKeyResultId)}
            >
              + Add OKR Link
            </button>
          {:else}
            <p class="task-hint">No objectives available. Create an objective first.</p>
          {/if}
        </fieldset>

        <!-- Repository Links -->
        <fieldset class="form-section" aria-label="Repository links">
          <legend class="form-section-title">Repository Links</legend>

          {#if repositoryLinks.length > 0}
            <ul class="repo-link-list" aria-label="Linked repositories">
              {#each repositoryLinks as repoLink (repoLink.id)}
                <li class="repo-link-item">
                  <a href={repoLink.url} target="_blank" rel="noopener noreferrer" class="repo-link-url">
                    {repoLink.name ?? repoLink.url}
                  </a>
                  <button
                    type="button"
                    data-variant="icon"
                    aria-label="Remove repository link"
                    onclick={() => removeRepositoryLink(repoLink.id)}
                  >✕</button>
                </li>
              {/each}
            </ul>
          {/if}

          <fieldset class="repo-link-input-row">
            <input
              type="url"
              bind:value={repoUrlInput}
              placeholder="https://github.com/owner/repo"
              aria-label="Repository URL"
              aria-describedby={repoUrlError ? 'repo-url-err' : undefined}
              onkeydown={handleRepoKeydown}
            />
            <button type="button" data-variant="ghost" onclick={addRepositoryLink}>
              Add Link
            </button>
          </fieldset>
          {#if repoUrlError}
            <small id="repo-url-err" role="alert">{repoUrlError}</small>
          {/if}
        </fieldset>

        <!-- Actions -->
        <footer class="okr-modal-actions">
          <button type="submit" data-variant="primary">{isEdit ? 'Save Changes' : 'Add Task'}</button>
          <button type="button" data-variant="ghost" onclick={onClose}>Cancel</button>
        </footer>
      </section>
    </form>
  </dialog>
</section>

<style>
  .task-modal-dialog {
    max-width: 560px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-2);
    border: 1px solid var(--okr-color-border-light);
    border-radius: var(--okr-radius-md);
    padding: var(--okr-space-3) var(--okr-space-4);
  }

  .form-section-title {
    font-size: var(--okr-font-size-sm);
    font-weight: 700;
    color: var(--okr-color-text-label);
    padding: 0 var(--okr-space-1);
  }

  task-okr-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--okr-space-1);
  }

  task-okr-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--okr-space-1);
    background: rgba(59, 130, 246, 0.1);
    color: var(--okr-color-primary);
    border-radius: var(--okr-radius-full);
    padding: 0.15rem var(--okr-space-2);
    font-size: var(--okr-font-size-xs);
    font-weight: 600;
  }

  button[data-variant="tag-remove"] {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: 0.65rem;
    line-height: 1;
    padding: 0;
    opacity: 0.7;
    transition: opacity 150ms;
  }

  button[data-variant="tag-remove"]:hover {
    opacity: 1;
  }

  .task-hint {
    font-size: var(--okr-font-size-xs);
    color: var(--okr-color-muted);
  }

  .repo-link-list {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-1);
  }

  .repo-link-item {
    display: flex;
    align-items: center;
    gap: var(--okr-space-2);
    padding: var(--okr-space-1) var(--okr-space-2);
    background: var(--okr-color-bg);
    border-radius: var(--okr-radius-sm);
  }

  .repo-link-url {
    flex: 1;
    font-size: var(--okr-font-size-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .repo-link-input-row {
    display: flex;
    gap: var(--okr-space-2);
    align-items: center;
  }

  .repo-link-input-row input {
    flex: 1;
    min-width: 0;
  }
</style>

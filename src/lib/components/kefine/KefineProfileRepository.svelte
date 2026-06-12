<script lang="ts">
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { parseOrgTodos, type OrgTodoState } from '$lib/kefine/repo-docs/repo-docs';
  import {
    requestTopbarSearch,
    topbarSearchItems,
    type TopbarSearchItem
  } from '$lib/kefine/topbar/topbar-search-context';

  let {
    handle,
    displayName = '',
    tasksOrg = $bindable(''),
    isOwner = false
  }: {
    handle: string;
    displayName?: string;
    tasksOrg?: string | null;
    isOwner?: boolean;
  } = $props();

  const localeText = $derived($kefineLocaleText);

  // A profile is a repository: the README header is the handle and the tasks are
  // an Org TODO list rendered as a checklist — the same visual language as the
  // solvers/solution screen.
  const repoHandle = $derived(`@${handle.replace(/^@+/, '').trim()}`);
  const todos = $derived(parseOrgTodos(tasksOrg ?? ''));

  import { goto } from '$app/navigation';

  let newTaskText = $state('');

  type TodoStatusKind = 'todo' | 'in-progress' | 'done';

  function todoStatusKind(state: OrgTodoState): TodoStatusKind {
    if (state === 'DONE') return 'done';
    if (state === 'IN PROGRESS') return 'in-progress';
    return 'todo';
  }

  function todoStatusLabel(state: OrgTodoState): string {
    if (state === 'DONE') return localeText.solversView.todoDone;
    if (state === 'IN PROGRESS') return localeText.solversView.todoInProgress;
    return localeText.solversView.todoOpen;
  }

  function createTaskHref(query: string): string {
    const task = query.trim();
    if (!task) {
      return '/';
    }
    const params = new URLSearchParams();
    params.set('task', task);
    params.set('create', '1');
    return `/?${params.toString()}`;
  }

  // Mirror the solvers screen: typing a task in the README "new task" row opens
  // the command palette with a "Create task" result that hands the query off to
  // the order creator — a profile is a repository, so its tasks start the same
  // way a README checklist item would.
  $effect(() => {
    const items: TopbarSearchItem[] = [
      {
        id: 'create-task',
        title: localeText.solversView.createTaskSearchTitle,
        category: localeText.solversView.tasksAside,
        actionLabel: localeText.solversView.createTaskSearchAction,
        icon: 'project' as const,
        keywords: [
          localeText.solversView.createTaskSearchTitle,
          localeText.profile.newTaskPlaceholder,
          'create task',
          'new task'
        ],
        hideWhenEmpty: true,
        showForQuery: (query) => query.trim().length > 0,
        subtitleFromQuery: (query) => query.trim(),
        hrefFromQuery: createTaskHref
      }
    ];

    topbarSearchItems.set(items);
    return () => topbarSearchItems.set([]);
  });

  function openNewTaskSearch() {
    const query = newTaskText.trim();
    if (!query) {
      return;
    }
    requestTopbarSearch({ query });
  }

  function handleNewTaskKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    event.preventDefault();
    openNewTaskSearch();
  }

  function toggleTodoState(todo: OrgTodo) {
    const next: Record<OrgTodoState, OrgTodoState> = {
      TODO: 'IN PROGRESS',
      'IN PROGRESS': 'DONE',
      DONE: 'TODO'
    };
    const newState = next[todo.state];
    const lines = (tasksOrg ?? '').split(/\r?\n/);
    const index = lines.findIndex((l) => {
      const m = l.match(/^\*+\s+(TODO|IN PROGRESS|DONE)\s+(.*)$/);
      return m && m[2].trim() === todo.title;
    });
    if (index === -1) return;
    lines[index] = lines[index].replace(
      /^( *\*+ +)(TODO|IN PROGRESS|DONE)( +.*)$/,
      `$1${newState}$3`
    );
    tasksOrg = lines.join('\n');
  }

  function navigateToTask(task: string) {
    const href = createTaskHref(task);
    if (href !== '/') {
      goto(href);
    }
  }
</script>

<lef-profile-repo data-testid="profile-repo">
  <lef-repo-readme aria-label={localeText.profile.repoReadmeAria} data-testid="profile-readme">
    <lef-repo-readme-head>
      <h2 data-testid="profile-readme-title">{repoHandle}</h2>
    </lef-repo-readme-head>
  </lef-repo-readme>

  <lef-repo-checklist aria-label={localeText.profile.repoChecklistAria} data-testid="profile-checklist">
    {#each todos as todo (todo.id)}
      {@const statusKind = todoStatusKind(todo.state)}
      <lef-repo-checklist-item data-state={statusKind} data-testid="profile-checklist-item">
        <lef-repo-todo-check
          data-state={statusKind}
          role="button"
          tabindex="0"
          aria-label={todoStatusLabel(todo.state)}
          title={todoStatusLabel(todo.state)}
          onclick={() => toggleTodoState(todo)}
          onkeydown={(e) => { if (e.key === 'Enter') toggleTodoState(todo); }}
        >
          {#if todo.state === 'DONE'}
            <Icon icon="lucide:check" width="12" height="12" aria-hidden="true" />
          {:else if todo.state === 'IN PROGRESS'}
            <Icon icon="lucide:minus" width="12" height="12" aria-hidden="true" />
          {/if}
        </lef-repo-todo-check>
        <lefine-text
          role="button"
          tabindex="0"
          onclick={() => navigateToTask(todo.title)}
          onkeydown={(e) => { if (e.key === 'Enter') navigateToTask(todo.title); }}
        >{todo.title}</lefine-text>
      </lef-repo-checklist-item>
    {/each}
    <lef-repo-checklist-item data-state="create" data-testid="profile-new-task-row">
      <lef-repo-todo-check data-state="create" aria-hidden="true">
        <Icon icon="lucide:plus" width="12" height="12" aria-hidden="true" />
      </lef-repo-todo-check>
      <input
        data-testid="profile-new-task-input"
        aria-label={localeText.profile.newTaskAria}
        placeholder={localeText.profile.newTaskPlaceholder}
        bind:value={newTaskText}
        autocomplete="off"
        spellcheck="false"
        onkeydown={handleNewTaskKeydown}
      />
      <lef-todo-solver-cell>
        <button
          type="button"
          class="profile-task-search"
          data-testid="profile-new-task-search"
          aria-label={localeText.profile.openTaskSearch}
          title={localeText.profile.openTaskSearch}
          disabled={newTaskText.trim().length === 0}
          onclick={openNewTaskSearch}
        >
          <Icon icon="lucide:search" width="14" height="14" aria-hidden="true" />
        </button>
      </lef-todo-solver-cell>
    </lef-repo-checklist-item>
  </lef-repo-checklist>
  {#if isOwner}
    <lef-profile-repo-note>{localeText.profile.tasksOwnerHint}</lef-profile-repo-note>
  {/if}
</lef-profile-repo>

<style>
  lef-profile-repo {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  /* The README is the one emphasized surface: a single, flat panel holding the
     handle — the same quiet card the solution screen uses for its readme, with
     the checklist floating beneath it (reviewer: "flatter"). */
  lef-repo-readme {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.15rem 1.05rem;
    border-radius: 0.85rem;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 5%, var(--kef-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-line) 20%, transparent);
  }

  lef-repo-readme-head {
    display: block;
  }

  lef-repo-readme-head h2 {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--lefine-text);
  }

  lef-repo-checklist {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0.6rem 0 0;
  }

  lef-repo-todo-check {
    display: inline-grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1.5px solid color-mix(in oklab, var(--lefine-text-soft) 70%, var(--kef-line));
    background: color-mix(in oklab, var(--lefine-text-soft) 70%, var(--kef-bg-card));
    color: #fff;
    cursor: pointer;
  }

  lef-repo-todo-check[data-state='in-progress'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 80%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 80%, var(--kef-bg-card));
  }

  lef-repo-todo-check[data-state='done'] {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 70%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 80%, transparent);
  }

  lef-repo-todo-check[data-state='create'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 58%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 11%, transparent);
    color: var(--kef-color-primary, #c89a5a);
  }

  /* Checklist rows are flat: a faint fill, no border, so they read as a list on
     the page rather than a stack of framed cards (reviewer: "flatter"). */
  lef-repo-checklist-item {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    min-height: 2.7rem;
    padding: 0.5rem 0.65rem;
    border: 0;
    border-radius: 8px;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 4%, transparent);
    color: var(--lefine-text);
  }

  lef-repo-checklist-item[data-state='create'] {
    border: 1px dashed color-mix(in oklab, var(--kef-line) 38%, transparent);
    background: transparent;
  }

  lef-repo-checklist-item[data-state='create']:focus-within {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 38%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 5%, var(--kef-bg-card));
  }

  lef-repo-checklist-item lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.9rem;
    line-height: 1.3;
    cursor: pointer;
  }

  lef-repo-checklist-item[data-state='done'] lefine-text {
    color: var(--lefine-text-soft);
    text-decoration: line-through;
    text-decoration-color: color-mix(in oklab, var(--lefine-text-soft) 60%, transparent);
  }

  lef-repo-checklist-item input {
    width: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--lefine-text);
    font: inherit;
    font-size: 0.9rem;
    line-height: 1.3;
    outline: 0;
  }

  lef-repo-checklist-item input::placeholder {
    color: var(--lefine-text-soft);
    opacity: 0.78;
  }

  lef-todo-solver-cell {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }

  lef-solver-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: var(--avatar-color, var(--kef-color-primary, #c89a5a));
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .profile-task-search {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.15rem;
    height: 2.15rem;
    padding: 0.3rem 0.35rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 75%, transparent);
    border-radius: 8px;
    background: color-mix(in oklab, var(--lefine-text) 7%, var(--kef-bg-card));
    color: var(--lefine-text);
    font: inherit;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease;
  }

  .profile-task-search:hover:not(:disabled) {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 10%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 32%, var(--kef-line));
  }

  .profile-task-search:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  lef-profile-repo-note {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--lefine-text-soft);
  }
</style>

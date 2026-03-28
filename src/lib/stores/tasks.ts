import { writable, type Writable } from 'svelte/store';
import type { Task, TaskStatus, Priority, OKRLink, RepositoryLink, LinkType } from '$lib/types/okr';
import { deserializeWithDates, serializeWithDates } from '$lib/stores/store-serialization';

export interface TaskState {
  tasks: Task[];
  filters: {
    status: TaskStatus | null;
    priority: Priority | null;
    okrLinkId: string | null; // objectiveId or keyResultId to filter by
    search: string;
  };
}

const initialState: TaskState = {
  tasks: [],
  filters: {
    status: null,
    priority: null,
    okrLinkId: null,
    search: ''
  }
};

type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'okrLinks'> & { okrLinks?: OKRLink[] };

function withUpdatedTask(task: Task, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
  return { ...task, ...updates, updatedAt: new Date() };
}

function createTask(task: TaskInput): Task {
  return {
    ...task,
    id: crypto.randomUUID(),
    okrLinks: task.okrLinks ?? [],
    repositoryLinks: task.repositoryLinks ?? [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function withMappedTask(
  state: TaskState,
  taskId: string,
  mapper: (task: Task) => Task
): TaskState {
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === taskId ? mapper(task) : task))
  };
}

function saveTaskState(state: TaskState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('task-data', serializeWithDates(state));
  } catch (error) {
    console.error('Failed to save task data to localStorage:', error);
  }
}

function loadTaskState(): TaskState | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem('task-data');
    return data ? deserializeWithDates<TaskState>(data) : null;
  } catch (error) {
    console.error('Failed to load task data from localStorage:', error);
    return null;
  }
}

type TaskStoreInternals = Pick<Writable<TaskState>, 'subscribe' | 'set' | 'update'>;

function createTaskCrudActions({ update }: Pick<TaskStoreInternals, 'update'>) {
  return {
    addTask(task: TaskInput) {
      const newTask = createTask(task);
      update((state) => ({
        ...state,
        tasks: [...state.tasks, newTask]
      }));
      return newTask;
    },
    updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
      update((state) => withMappedTask(state, id, (task) => withUpdatedTask(task, updates)));
    },
    deleteTask(id: string) {
      update((state) => ({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== id)
      }));
    }
  };
}

function createTaskLinkActions({ update }: Pick<TaskStoreInternals, 'update'>) {
  return {
    linkTaskToOKR(
      taskId: string,
      options: {
        objectiveId?: string;
        keyResultId?: string;
        linkType: LinkType;
      }
    ) {
      const newLink: OKRLink = {
        id: crypto.randomUUID(),
        taskId,
        objectiveId: options.objectiveId,
        keyResultId: options.keyResultId,
        linkType: options.linkType,
        createdAt: new Date()
      };
      update((state) => ({
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const alreadyLinked = task.okrLinks.some(
            (link) =>
              (options.objectiveId && link.objectiveId === options.objectiveId) ||
              (options.keyResultId && link.keyResultId === options.keyResultId)
          );
          return alreadyLinked ? task : withUpdatedTask(task, { okrLinks: [...task.okrLinks, newLink] });
        })
      }));
    },
    unlinkTaskFromOKR(taskId: string, linkId: string) {
      update((state) =>
        withMappedTask(state, taskId, (task) =>
          withUpdatedTask(task, { okrLinks: task.okrLinks.filter((link) => link.id !== linkId) })
        )
      );
    },
    getLinkedOKRs(taskId: string): OKRLink[] {
      let links: OKRLink[] = [];
      update((state) => {
        links = state.tasks.find((task) => task.id === taskId)?.okrLinks ?? [];
        return state;
      });
      return links;
    },
    removeLinksForObjective(objectiveId: string) {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((task) => ({
          ...task,
          okrLinks: task.okrLinks.filter((link) => link.objectiveId !== objectiveId)
        }))
      }));
    },
    removeLinksForKeyResult(keyResultId: string) {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((task) => ({
          ...task,
          okrLinks: task.okrLinks.filter((link) => link.keyResultId !== keyResultId)
        }))
      }));
    }
  };
}

function createTaskRepositoryActions({ update }: Pick<TaskStoreInternals, 'update'>) {
  return {
    addRepositoryLink(taskId: string, repoLink: Omit<RepositoryLink, 'id'>) {
      const newRepoLink: RepositoryLink = {
        ...repoLink,
        id: crypto.randomUUID()
      };
      update((state) =>
        withMappedTask(state, taskId, (task) =>
          withUpdatedTask(task, { repositoryLinks: [...(task.repositoryLinks ?? []), newRepoLink] })
        )
      );
    },
    removeRepositoryLink(taskId: string, repoLinkId: string) {
      update((state) =>
        withMappedTask(state, taskId, (task) =>
          withUpdatedTask(task, {
            repositoryLinks: (task.repositoryLinks ?? []).filter((link) => link.id !== repoLinkId)
          })
        )
      );
    }
  };
}

function createTaskFilterActions({ update }: Pick<TaskStoreInternals, 'update'>) {
  return {
    setFilters(filters: Partial<TaskState['filters']>) {
      update((state) => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },
    clearFilters() {
      update((state) => ({
        ...state,
        filters: { status: null, priority: null, okrLinkId: null, search: '' }
      }));
    }
  };
}

function createTaskPersistenceActions({ set, update }: Pick<TaskStoreInternals, 'set' | 'update'>) {
  return {
    saveToLocalStorage() {
      update((state) => {
        saveTaskState(state);
        return state;
      });
    },
    loadFromLocalStorage() {
      const loadedState = loadTaskState();
      if (loadedState) {
        set(loadedState);
      }
    }
  };
}

function createTaskActions(internals: TaskStoreInternals) {
  const { subscribe } = internals;
  return {
    subscribe,
    ...createTaskCrudActions(internals),
    ...createTaskLinkActions(internals),
    ...createTaskRepositoryActions(internals),
    ...createTaskFilterActions(internals),
    ...createTaskPersistenceActions(internals)
  };
}

function createTaskStore() {
  const store = writable(initialState);
  return createTaskActions(store);
}

export const taskStore = createTaskStore();

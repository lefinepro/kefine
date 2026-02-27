import { writable, type Writable } from 'svelte/store';
import type { Task, OKRLink, TaskStatus, Priority, LinkType } from '$lib/types/okr';

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

function createTaskStore() {
  const { subscribe, set, update }: Writable<TaskState> = writable(initialState);

  return {
    subscribe,

    // Task CRUD
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'okrLinks'>) => {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        okrLinks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      update((state) => ({
        ...state,
        tasks: [...state.tasks, newTask]
      }));
      return newTask;
    },

    updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'okrLinks'>>) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        )
      }));
    },

    deleteTask: (id: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.filter((t) => t.id !== id)
      }));
    },

    // OKR Linking
    linkTaskToOKR: (
      taskId: string,
      options: {
        objectiveId?: string;
        keyResultId?: string;
        linkType: LinkType;
      }
    ) => {
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
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          // Avoid duplicate links to same objective/key result
          const alreadyLinked = t.okrLinks.some(
            (l) =>
              (options.objectiveId && l.objectiveId === options.objectiveId) ||
              (options.keyResultId && l.keyResultId === options.keyResultId)
          );
          if (alreadyLinked) return t;
          return { ...t, okrLinks: [...t.okrLinks, newLink], updatedAt: new Date() };
        })
      }));
    },

    unlinkTaskFromOKR: (taskId: string, linkId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            okrLinks: t.okrLinks.filter((l) => l.id !== linkId),
            updatedAt: new Date()
          };
        })
      }));
    },

    getLinkedOKRs: (taskId: string): OKRLink[] => {
      let links: OKRLink[] = [];
      update((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        links = task?.okrLinks ?? [];
        return state;
      });
      return links;
    },

    // Remove all links pointing to a deleted objective or key result
    removeLinksForObjective: (objectiveId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) => ({
          ...t,
          okrLinks: t.okrLinks.filter((l) => l.objectiveId !== objectiveId)
        }))
      }));
    },

    removeLinksForKeyResult: (keyResultId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) => ({
          ...t,
          okrLinks: t.okrLinks.filter((l) => l.keyResultId !== keyResultId)
        }))
      }));
    },

    // Filtering
    setFilters: (filters: Partial<TaskState['filters']>) => {
      update((state) => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },

    clearFilters: () => {
      update((state) => ({
        ...state,
        filters: { status: null, priority: null, okrLinkId: null, search: '' }
      }));
    },

    // Persistence
    saveToLocalStorage: () => {
      if (typeof window === 'undefined') return;
      update((state) => {
        try {
          const data = JSON.stringify(state, (_key, value) => {
            if (value instanceof Date) {
              return { __type: 'Date', value: value.toISOString() };
            }
            return value;
          });
          localStorage.setItem('task-data', data);
        } catch (error) {
          console.error('Failed to save task data to localStorage:', error);
        }
        return state;
      });
    },

    loadFromLocalStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        const data = localStorage.getItem('task-data');
        if (!data) return;
        const parsed = JSON.parse(data, (_key, value) => {
          if (value?.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        });
        set(parsed);
      } catch (error) {
        console.error('Failed to load task data from localStorage:', error);
      }
    }
  };
}

export const taskStore = createTaskStore();

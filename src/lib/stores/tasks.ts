import { writable, type Writable } from 'svelte/store';
import type { Task, TaskStatus, Priority, OKRLink, RepositoryLink } from '$lib/types/okr';

export interface TaskState {
  tasks: Task[];
}

const initialState: TaskState = {
  tasks: []
};

function createTaskStore() {
  const { subscribe, set, update }: Writable<TaskState> = writable(initialState);

  return {
    subscribe,

    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      update((state) => ({
        ...state,
        tasks: [...state.tasks, newTask]
      }));
      return newTask;
    },

    updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
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

    updateTaskStatus: (id: string, status: TaskStatus) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status, updatedAt: new Date() } : t
        )
      }));
    },

    linkToOKR: (taskId: string, link: Omit<OKRLink, 'id' | 'taskId' | 'createdAt'>) => {
      const newLink: OKRLink = {
        ...link,
        id: crypto.randomUUID(),
        taskId,
        createdAt: new Date()
      };
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, okrLinks: [...t.okrLinks, newLink], updatedAt: new Date() } : t
        )
      }));
    },

    unlinkFromOKR: (taskId: string, linkId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, okrLinks: t.okrLinks.filter((l) => l.id !== linkId), updatedAt: new Date() }
            : t
        )
      }));
    },

    addRepositoryLink: (taskId: string, repoLink: Omit<RepositoryLink, 'id'>) => {
      const newRepoLink: RepositoryLink = {
        ...repoLink,
        id: crypto.randomUUID()
      };
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, repositoryLinks: [...t.repositoryLinks, newRepoLink], updatedAt: new Date() }
            : t
        )
      }));
    },

    removeRepositoryLink: (taskId: string, repoLinkId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                repositoryLinks: t.repositoryLinks.filter((l) => l.id !== repoLinkId),
                updatedAt: new Date()
              }
            : t
        )
      }));
    },

    getTasksByStatus: (status: TaskStatus): Task[] => {
      let result: Task[] = [];
      update((state) => {
        result = state.tasks.filter((t) => t.status === status);
        return state;
      });
      return result;
    },

    getTasksByPriority: (priority: Priority): Task[] => {
      let result: Task[] = [];
      update((state) => {
        result = state.tasks.filter((t) => t.priority === priority);
        return state;
      });
      return result;
    },

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

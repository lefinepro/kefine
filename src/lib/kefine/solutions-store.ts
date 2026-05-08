import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface Solution {
  id: string;
  solver: string;
  title: string;
  description: string;
  codeLines: Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>;
  fileCodeLines?: Record<string, Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>>;
  diffs: Array<{
    file: string;
    added: number;
    removed: number;
  }>;
}

const STORAGE_KEY = 'kefine-solutions';

function createSolutionsStore() {
  const initial: Solution[] = browser && localStorage.getItem(STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    : [];

  const store = writable<Solution[]>(initial);

  return {
    subscribe: store.subscribe,
    set: (solutions: Solution[]) => {
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(solutions));
      }
      store.set(solutions);
    },
    update: store.update,
    getAll: () => get(store)
  };
}

export const solutionsStore = createSolutionsStore();
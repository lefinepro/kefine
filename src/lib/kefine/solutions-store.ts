import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Solution } from './solutions-data';

export type { Solution };

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
    update: (updater: (solutions: Solution[]) => Solution[]) => {
      store.update((current) => {
        const next = updater(current);
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    getAll: () => get(store)
  };
}

export const solutionsStore = createSolutionsStore();

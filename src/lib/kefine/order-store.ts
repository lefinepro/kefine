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
  diffs: Array<{
    file: string;
    added: number;
    removed: number;
  }>;
}

export interface OrderDraft {
  description: string;
  searchText: string;
  taskCompleted: boolean;
}

const STORAGE_KEY = 'kefine-order-state';

interface OrderState {
  draft: OrderDraft;
  solutions: Solution[];
}

function createOrderStore() {
  const initial: OrderState = browser && localStorage.getItem(STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    : { draft: { description: '', searchText: '', taskCompleted: false }, solutions: [] };

  const store = writable<OrderState>(initial);

  return {
    subscribe: store.subscribe,
    set: (state: OrderState) => {
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
      store.set(state);
    },
    update: store.update,
    getAll: () => get(store),
    setDraft: (draft: OrderDraft) => {
      const current = get(store);
      const next = { ...current, draft };
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      store.set(next);
    },
    setSolutions: (solutions: Solution[]) => {
      const current = get(store);
      const next = { ...current, solutions };
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      store.set(next);
    }
  };
}

export const orderStore = createOrderStore();
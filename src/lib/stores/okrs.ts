import { writable, get, type Writable } from 'svelte/store';
import type { Objective, KeyResult, OKRLink, Quarter, ObjectiveStatus } from '$lib/types/okr';
import { debounce } from '$lib/utils/helpers';

export interface OKRState {
  objectives: Objective[];
  keyResults: KeyResult[];
  okrLinks: OKRLink[];
  filters: {
    quarter: Quarter | null;
    year: number | null;
    status: ObjectiveStatus | null;
    search: string;
  };
}

const STORAGE_KEY = 'okr-data';

const initialState: OKRState = {
  objectives: [],
  keyResults: [],
  okrLinks: [],
  filters: {
    quarter: null,
    year: null,
    status: null,
    search: ''
  }
};

function serializeState(state: OKRState): string {
  return JSON.stringify(state, (_key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
}

function deserializeState(data: string): OKRState {
  return JSON.parse(data, (_key, value) => {
    if (value?.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
}

function createOKRStore() {
  const { subscribe, set, update }: Writable<OKRState> = writable(initialState);

  // Debounced auto-save: triggers 500ms after last change (Task 2.6.3)
  const debouncedSave = debounce(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(get(store)));
    } catch (error) {
      console.error('Failed to auto-save OKR data to localStorage:', error);
    }
  }, 500);

  // Expose the store reference so debouncedSave can access it via get()
  const store = {
    subscribe,

    // Objective CRUD
    addObjective: (objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newObjective: Objective = {
        ...objective,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      update((state) => ({
        ...state,
        objectives: [...state.objectives, newObjective]
      }));
      debouncedSave();
      return newObjective;
    },

    updateObjective: (id: string, updates: Partial<Objective>) => {
      update((state) => ({
        ...state,
        objectives: state.objectives.map((obj) =>
          obj.id === id ? { ...obj, ...updates, updatedAt: new Date() } : obj
        )
      }));
      debouncedSave();
    },

    deleteObjective: (id: string) => {
      update((state) => ({
        ...state,
        objectives: state.objectives.filter((obj) => obj.id !== id),
        keyResults: state.keyResults.filter((kr) => kr.objectiveId !== id),
        okrLinks: state.okrLinks.filter(
          (link) => link.objectiveId !== id && link.keyResultId !== id
        )
      }));
      debouncedSave();
    },

    getObjective: (id: string): Objective | undefined => {
      return get(store).objectives.find((obj) => obj.id === id);
    },

    getAllObjectives: (): Objective[] => {
      return get(store).objectives;
    },

    // Key Result CRUD
    addKeyResult: (keyResult: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newKeyResult: KeyResult = {
        ...keyResult,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      update((state) => ({
        ...state,
        keyResults: [...state.keyResults, newKeyResult]
      }));
      debouncedSave();
      return newKeyResult;
    },

    updateKeyResult: (id: string, updates: Partial<KeyResult>) => {
      update((state) => ({
        ...state,
        keyResults: state.keyResults.map((kr) =>
          kr.id === id ? { ...kr, ...updates, updatedAt: new Date() } : kr
        )
      }));
      debouncedSave();
    },

    deleteKeyResult: (id: string) => {
      update((state) => ({
        ...state,
        keyResults: state.keyResults.filter((kr) => kr.id !== id),
        okrLinks: state.okrLinks.filter((link) => link.keyResultId !== id)
      }));
      debouncedSave();
    },

    getKeyResult: (id: string): KeyResult | undefined => {
      return get(store).keyResults.find((kr) => kr.id === id);
    },

    getKeyResultsByObjective: (objectiveId: string): KeyResult[] => {
      return get(store).keyResults.filter((kr) => kr.objectiveId === objectiveId);
    },

    // Progress Calculation
    calculateKeyResultProgress: (kr: KeyResult): number => {
      let progress: number;
      switch (kr.targetType) {
        case 'percentage':
        case 'number':
          progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
          break;
        case 'boolean':
          progress = kr.currentValue > 0 ? 100 : 0;
          break;
        default:
          progress = 0;
      }
      return Math.max(0, Math.min(100, progress));
    },

    calculateObjectiveProgress: (objectiveId: string): number => {
      const keyResults = get(store).keyResults.filter((kr) => kr.objectiveId === objectiveId);
      if (keyResults.length === 0) return 0;
      const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      if (totalWeight === 0) return 0;
      const weightedProgress = keyResults.reduce((sum, kr) => {
        const krProgress = store.calculateKeyResultProgress(kr);
        return sum + (krProgress * kr.weight) / totalWeight;
      }, 0);
      return Math.max(0, Math.min(100, weightedProgress));
    },

    calculateOverallProgress: (quarter?: Quarter, year?: number): number => {
      const state = get(store);
      let objectives = state.objectives;
      if (quarter) {
        objectives = objectives.filter((obj) => obj.quarter === quarter);
      }
      if (year) {
        objectives = objectives.filter((obj) => obj.year === year);
      }
      if (objectives.length === 0) return 0;
      const total = objectives.reduce((sum, obj) => {
        return sum + store.calculateObjectiveProgress(obj.id);
      }, 0);
      return Math.max(0, Math.min(100, total / objectives.length));
    },

    // Filtering
    setFilters: (filters: Partial<OKRState['filters']>) => {
      update((state) => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },

    getFilteredObjectives: (): Objective[] => {
      const state = get(store);
      return state.objectives.filter((obj) => {
        const { quarter, year, status, search } = state.filters;
        if (quarter && obj.quarter !== quarter) return false;
        if (year && obj.year !== year) return false;
        if (status && obj.status !== status) return false;
        if (search) {
          const query = search.toLowerCase();
          const titleMatch = obj.title.toLowerCase().includes(query);
          const descMatch = obj.description?.toLowerCase().includes(query) ?? false;
          if (!titleMatch && !descMatch) return false;
        }
        return true;
      });
    },

    // Persistence
    saveToLocalStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, serializeState(get(store)));
      } catch (error) {
        console.error('Failed to save OKR data to localStorage:', error);
      }
    },

    loadFromLocalStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return;
        set(deserializeState(data));
      } catch (error) {
        console.error('Failed to load OKR data from localStorage:', error);
      }
    }
  };

  return store;
}

export const okrStore = createOKRStore();

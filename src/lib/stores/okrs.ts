import { writable, get, type Writable } from 'svelte/store';
import type { Objective, KeyResult, OKRLink, Quarter, ObjectiveStatus } from '$lib/types/okr';
import { debounce } from '$lib/utils/helpers';
import { deserializeWithDates, serializeWithDates } from '$lib/stores/store-serialization';

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
  return serializeWithDates(state);
}

function deserializeState(data: string): OKRState {
  return deserializeWithDates<OKRState>(data);
}

function createObjective(objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>): Objective {
  return {
    ...objective,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createKeyResult(keyResult: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt'>): KeyResult {
  return {
    ...keyResult,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function updateObjectiveList(
  state: OKRState,
  id: string,
  updates: Partial<Objective>
): OKRState {
  return {
    ...state,
    objectives: state.objectives.map((objective) =>
      objective.id === id ? { ...objective, ...updates, updatedAt: new Date() } : objective
    )
  };
}

function updateKeyResultList(
  state: OKRState,
  id: string,
  updates: Partial<KeyResult>
): OKRState {
  return {
    ...state,
    keyResults: state.keyResults.map((keyResult) =>
      keyResult.id === id ? { ...keyResult, ...updates, updatedAt: new Date() } : keyResult
    )
  };
}

type OKRStoreInternals = Pick<Writable<OKRState>, 'subscribe' | 'set' | 'update'>;

function createOKRDataActions(
  storeRef: { subscribe: Writable<OKRState>['subscribe'] },
  update: OKRStoreInternals['update'],
  debouncedSave: ReturnType<typeof debounce>
) {
  return {
    addObjective(objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) {
      const newObjective = createObjective(objective);
      update((state) => ({
        ...state,
        objectives: [...state.objectives, newObjective]
      }));
      debouncedSave();
      return newObjective;
    },
    updateObjective(id: string, updates: Partial<Objective>) {
      update((state) => updateObjectiveList(state, id, updates));
      debouncedSave();
    },
    deleteObjective(id: string) {
      update((state) => ({
        ...state,
        objectives: state.objectives.filter((objective) => objective.id !== id),
        keyResults: state.keyResults.filter((keyResult) => keyResult.objectiveId !== id),
        okrLinks: state.okrLinks.filter((link) => link.objectiveId !== id && link.keyResultId !== id)
      }));
      debouncedSave();
    },
    getObjective(id: string) {
      return get(storeRef).objectives.find((objective) => objective.id === id);
    },
    getAllObjectives() {
      return get(storeRef).objectives;
    },
    addKeyResult(keyResult: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt'>) {
      const newKeyResult = createKeyResult(keyResult);
      update((state) => ({
        ...state,
        keyResults: [...state.keyResults, newKeyResult]
      }));
      debouncedSave();
      return newKeyResult;
    },
    updateKeyResult(id: string, updates: Partial<KeyResult>) {
      update((state) => updateKeyResultList(state, id, updates));
      debouncedSave();
    },
    deleteKeyResult(id: string) {
      update((state) => ({
        ...state,
        keyResults: state.keyResults.filter((keyResult) => keyResult.id !== id),
        okrLinks: state.okrLinks.filter((link) => link.keyResultId !== id)
      }));
      debouncedSave();
    },
    getKeyResult(id: string) {
      return get(storeRef).keyResults.find((keyResult) => keyResult.id === id);
    },
    getKeyResultsByObjective(objectiveId: string) {
      return get(storeRef).keyResults.filter((keyResult) => keyResult.objectiveId === objectiveId);
    }
  };
}

function createOKRDerivedActions(storeRef: { subscribe: Writable<OKRState>['subscribe'] }) {
  return {
    calculateKeyResultProgress(kr: KeyResult): number {
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
    calculateObjectiveProgress(objectiveId: string): number {
      const keyResults = get(storeRef).keyResults.filter((kr) => kr.objectiveId === objectiveId);
      if (keyResults.length === 0) return 0;
      const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      if (totalWeight === 0) return 0;
      const weightedProgress = keyResults.reduce((sum, kr) => {
        const krProgress = storeRef.calculateKeyResultProgress(kr);
        return sum + (krProgress * kr.weight) / totalWeight;
      }, 0);
      return Math.max(0, Math.min(100, weightedProgress));
    },
    calculateOverallProgress(quarter?: Quarter, year?: number): number {
      const state = get(storeRef);
      let objectives = state.objectives;
      if (quarter) {
        objectives = objectives.filter((objective) => objective.quarter === quarter);
      }
      if (year) {
        objectives = objectives.filter((objective) => objective.year === year);
      }
      if (objectives.length === 0) return 0;
      const total = objectives.reduce((sum, objective) => sum + storeRef.calculateObjectiveProgress(objective.id), 0);
      return Math.max(0, Math.min(100, total / objectives.length));
    },
    getFilteredObjectives(): Objective[] {
      const state = get(storeRef);
      return state.objectives.filter((objective) => {
        const { quarter, year, status, search } = state.filters;
        if (quarter && objective.quarter !== quarter) return false;
        if (year && objective.year !== year) return false;
        if (status && objective.status !== status) return false;
        if (!search) return true;
        const query = search.toLowerCase();
        const titleMatch = objective.title.toLowerCase().includes(query);
        const descMatch = objective.description?.toLowerCase().includes(query) ?? false;
        return titleMatch || descMatch;
      });
    }
  };
}

function createOKRStoreActions({ subscribe, set, update }: OKRStoreInternals) {
  let storeRef: ReturnType<typeof createOKRStoreActions>;
  const debouncedSave = debounce(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(get(storeRef)));
    } catch (error) {
      console.error('Failed to auto-save OKR data to localStorage:', error);
    }
  }, 500);

  storeRef = {
    subscribe,
    ...createOKRDataActions(storeRef, update, debouncedSave),
    ...createOKRDerivedActions(storeRef),
    setFilters(filters: Partial<OKRState['filters']>) {
      update((state) => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },
    saveToLocalStorage() {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, serializeState(get(storeRef)));
      } catch (error) {
        console.error('Failed to save OKR data to localStorage:', error);
      }
    },
    loadFromLocalStorage() {
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

  return storeRef;
}

function createOKRStore() {
  const store = writable(initialState);
  return createOKRStoreActions(store);
}

export const okrStore = createOKRStore();

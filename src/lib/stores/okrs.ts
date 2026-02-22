import { writable, type Writable } from 'svelte/store';
import type { Objective, KeyResult, OKRLink, Quarter, ObjectiveStatus } from '$lib/types/okr';

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

function createOKRStore() {
  const { subscribe, set, update }: Writable<OKRState> = writable(initialState);

  return {
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
      return newObjective;
    },

    updateObjective: (id: string, updates: Partial<Objective>) => {
      update((state) => ({
        ...state,
        objectives: state.objectives.map((obj) =>
          obj.id === id ? { ...obj, ...updates, updatedAt: new Date() } : obj
        )
      }));
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
    },

    getObjective: (id: string): Objective | undefined => {
      let found: Objective | undefined;
      update((state) => {
        found = state.objectives.find((obj) => obj.id === id);
        return state;
      });
      return found;
    },

    getAllObjectives: (): Objective[] => {
      let objectives: Objective[] = [];
      update((state) => {
        objectives = state.objectives;
        return state;
      });
      return objectives;
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
      return newKeyResult;
    },

    updateKeyResult: (id: string, updates: Partial<KeyResult>) => {
      update((state) => ({
        ...state,
        keyResults: state.keyResults.map((kr) =>
          kr.id === id ? { ...kr, ...updates, updatedAt: new Date() } : kr
        )
      }));
    },

    deleteKeyResult: (id: string) => {
      update((state) => ({
        ...state,
        keyResults: state.keyResults.filter((kr) => kr.id !== id),
        okrLinks: state.okrLinks.filter((link) => link.keyResultId !== id)
      }));
    },

    getKeyResult: (id: string): KeyResult | undefined => {
      let found: KeyResult | undefined;
      update((state) => {
        found = state.keyResults.find((kr) => kr.id === id);
        return state;
      });
      return found;
    },

    getKeyResultsByObjective: (objectiveId: string): KeyResult[] => {
      let results: KeyResult[] = [];
      update((state) => {
        results = state.keyResults.filter((kr) => kr.objectiveId === objectiveId);
        return state;
      });
      return results;
    },

    // Progress Calculation
    calculateKeyResultProgress: (kr: KeyResult): number => {
      let progress: number;
      switch (kr.targetType) {
        case 'percentage':
        case 'number':
          progress = (kr.currentValue / kr.targetValue) * 100;
          break;
        case 'boolean':
          progress = kr.currentValue >= kr.targetValue ? 100 : 0;
          break;
        default:
          progress = 0;
      }
      return Math.max(0, Math.min(100, progress));
    },

    calculateObjectiveProgress: (objectiveId: string): number => {
      let progress = 0;
      update((state) => {
        const keyResults = state.keyResults.filter((kr) => kr.objectiveId === objectiveId);
        if (keyResults.length === 0) {
          progress = 0;
          return state;
        }
        const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
        const weightedProgress = keyResults.reduce((sum, kr) => {
          const krProgress = (kr.currentValue / kr.targetValue) * 100;
          return sum + (krProgress * kr.weight) / totalWeight;
        }, 0);
        progress = weightedProgress;
        return state;
      });
      return Math.max(0, Math.min(100, progress));
    },

    calculateOverallProgress: (quarter?: Quarter, year?: number): number => {
      let progress = 0;
      update((state) => {
        let objectives = state.objectives;
        if (quarter) {
          objectives = objectives.filter((obj) => obj.quarter === quarter);
        }
        if (year) {
          objectives = objectives.filter((obj) => obj.year === year);
        }
        if (objectives.length === 0) {
          progress = 0;
          return state;
        }
        const totalProgress = objectives.reduce((sum, obj) => {
          const keyResults = state.keyResults.filter((kr) => kr.objectiveId === obj.id);
          if (keyResults.length === 0) return sum;
          const totalWeight = keyResults.reduce((wSum, kr) => wSum + kr.weight, 0);
          const objProgress = keyResults.reduce((pSum, kr) => {
            const krProgress = (kr.currentValue / kr.targetValue) * 100;
            return pSum + (krProgress * kr.weight) / totalWeight;
          }, 0);
          return sum + objProgress;
        }, 0);
        progress = totalProgress / objectives.length;
        return state;
      });
      return Math.max(0, Math.min(100, progress));
    },

    // Filtering
    setFilters: (filters: Partial<OKRState['filters']>) => {
      update((state) => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },

    getFilteredObjectives: (): Objective[] => {
      let filtered: Objective[] = [];
      update((state) => {
        filtered = state.objectives.filter((obj) => {
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
        return state;
      });
      return filtered;
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
          localStorage.setItem('okr-data', data);
        } catch (error) {
          console.error('Failed to save OKR data to localStorage:', error);
        }
        return state;
      });
    },

    loadFromLocalStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        const data = localStorage.getItem('okr-data');
        if (!data) return;
        const parsed = JSON.parse(data, (_key, value) => {
          if (value?.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        });
        set(parsed);
      } catch (error) {
        console.error('Failed to load OKR data from localStorage:', error);
      }
    }
  };
}

export const okrStore = createOKRStore();

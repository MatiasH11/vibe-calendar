/**
 * Loading State Management System
 * Provides centralized loading state management with progress indicators
 */

import { create } from 'zustand';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
  message?: string;
  startTime?: number;
  estimatedDuration?: number;
}

interface LoadingStore {
  loadingStates: Record<string, LoadingState>;
  setLoading: (key: string, state: Partial<LoadingState>) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  getLoadingState: (key: string) => LoadingState | null;
  isAnyLoading: () => boolean;
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  loadingStates: {},

  setLoading: (key: string, state: Partial<LoadingState>) => {
    set((prev) => ({
      loadingStates: {
        ...prev.loadingStates,
        [key]: {
          ...prev.loadingStates[key],
          ...state,
          startTime: state.isLoading ? Date.now() : prev.loadingStates[key]?.startTime,
        },
      },
    }));
  },

  clearLoading: (key: string) => {
    set((prev) => {
      const { [key]: removed, ...rest } = prev.loadingStates;
      return { loadingStates: rest };
    });
  },

  clearAllLoading: () => {
    set({ loadingStates: {} });
  },

  getLoadingState: (key: string) => {
    return get().loadingStates[key] || null;
  },

  isAnyLoading: () => {
    return Object.values(get().loadingStates).some(state => state.isLoading);
  },
}));

/**
 * Loading manager class for complex operations
 */
class LoadingManager {
  private progressCallbacks = new Map<string, (progress: number) => void>();

  /**
   * Start loading with optional progress tracking
   */
  startLoading(
    key: string,
    options: {
      operation?: string;
      message?: string;
      estimatedDuration?: number;
      trackProgress?: boolean;
    } = {}
  ): void {
    const { operation, message, estimatedDuration, trackProgress } = options;

    useLoadingStore.getState().setLoading(key, {
      isLoading: true,
      operation,
      message,
      estimatedDuration,
      progress: trackProgress ? 0 : undefined,
    });

    // Auto-clear loading after estimated duration + buffer
    if (estimatedDuration) {
      setTimeout(() => {
        const currentState = useLoadingStore.getState().getLoadingState(key);
        if (currentState?.isLoading) {
          console.warn(`⚠️ Loading operation "${key}" exceeded estimated duration`);
          this.stopLoading(key);
        }
      }, estimatedDuration + 5000); // 5 second buffer
    }
  }

  /**
   * Update loading progress
   */
  updateProgress(key: string, progress: number, message?: string): void {
    const currentState = useLoadingStore.getState().getLoadingState(key);
    if (!currentState?.isLoading) return;

    useLoadingStore.getState().setLoading(key, {
      progress: Math.min(100, Math.max(0, progress)),
      message: message || currentState.message,
    });

    // Call progress callback if registered
    const callback = this.progressCallbacks.get(key);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Stop loading
   */
  stopLoading(key: string): void {
    useLoadingStore.getState().clearLoading(key);
    this.progressCallbacks.delete(key);
  }

  /**
   * Register progress callback
   */
  onProgress(key: string, callback: (progress: number) => void): void {
    this.progressCallbacks.set(key, callback);
  }

  /**
   * Get loading duration
   */
  getLoadingDuration(key: string): number {
    const state = useLoadingStore.getState().getLoadingState(key);
    if (!state?.startTime) return 0;
    return Date.now() - state.startTime;
  }

  /**
   * Check if operation is taking too long
   */
  isLoadingTooLong(key: string, threshold: number = 10000): boolean {
    return this.getLoadingDuration(key) > threshold;
  }
}

// Singleton instance
export const loadingManager = new LoadingManager();

/**
 * React hook for loading management
 */
export function useLoadingManager() {
  const { loadingStates, setLoading, clearLoading, getLoadingState, isAnyLoading } = useLoadingStore();

  const startLoading = (
    key: string,
    options: {
      operation?: string;
      message?: string;
      estimatedDuration?: number;
      trackProgress?: boolean;
    } = {}
  ) => {
    loadingManager.startLoading(key, options);
  };

  const updateProgress = (key: string, progress: number, message?: string) => {
    loadingManager.updateProgress(key, progress, message);
  };

  const stopLoading = (key: string) => {
    loadingManager.stopLoading(key);
  };

  const isLoading = (key: string) => {
    return getLoadingState(key)?.isLoading || false;
  };

  const getProgress = (key: string) => {
    return getLoadingState(key)?.progress;
  };

  const getMessage = (key: string) => {
    return getLoadingState(key)?.message;
  };

  const getDuration = (key: string) => {
    return loadingManager.getLoadingDuration(key);
  };

  return {
    // State
    loadingStates,
    isAnyLoading: isAnyLoading(),

    // Actions
    startLoading,
    updateProgress,
    stopLoading,

    // Getters
    isLoading,
    getProgress,
    getMessage,
    getDuration,
    getLoadingState,
  };
}

/**
 * Higher-order function to wrap async operations with loading states
 */
export function withLoadingState<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  loadingKey: string,
  options: {
    operation?: string;
    message?: string;
    estimatedDuration?: number;
    trackProgress?: boolean;
  } = {}
): T {
  return (async (...args: any[]) => {
    loadingManager.startLoading(loadingKey, options);

    try {
      const result = await fn(...args);
      loadingManager.stopLoading(loadingKey);
      return result;
    } catch (error) {
      loadingManager.stopLoading(loadingKey);
      throw error;
    }
  }) as T;
}

/**
 * Progress tracking utilities
 */
export class ProgressTracker {
  private totalSteps: number;
  private currentStep: number = 0;
  private loadingKey: string;

  constructor(loadingKey: string, totalSteps: number) {
    this.loadingKey = loadingKey;
    this.totalSteps = totalSteps;
  }

  nextStep(message?: string): void {
    this.currentStep++;
    const progress = (this.currentStep / this.totalSteps) * 100;
    loadingManager.updateProgress(this.loadingKey, progress, message);
  }

  setStep(step: number, message?: string): void {
    this.currentStep = step;
    const progress = (this.currentStep / this.totalSteps) * 100;
    loadingManager.updateProgress(this.loadingKey, progress, message);
  }

  complete(): void {
    loadingManager.updateProgress(this.loadingKey, 100, 'Complete');
    setTimeout(() => {
      loadingManager.stopLoading(this.loadingKey);
    }, 500);
  }
}

/**
 * Predefined loading operations
 */
export const LoadingOperations = {
  TEMPLATE_CREATE: 'template-create',
  TEMPLATE_UPDATE: 'template-update',
  TEMPLATE_DELETE: 'template-delete',
  TEMPLATE_LOAD: 'template-load',
  SHIFT_CREATE: 'shift-create',
  SHIFT_UPDATE: 'shift-update',
  SHIFT_DELETE: 'shift-delete',
  SHIFT_DUPLICATE: 'shift-duplicate',
  BULK_CREATE: 'bulk-create',
  CONFLICT_VALIDATION: 'conflict-validation',
  PATTERN_ANALYSIS: 'pattern-analysis',
} as const;

export type LoadingOperation = typeof LoadingOperations[keyof typeof LoadingOperations];
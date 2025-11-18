/**
 * Generic API Resource Hook Factory
 * Provides a reusable pattern for managing API resources with React state
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/errors';

// API resource methods interface
export interface ApiResourceMethods<T, CreateInput, UpdateInput> {
  getAll: (filters?: any) => Promise<{ data: T[]; pagination?: any }>;
  getById: (id: number) => Promise<T>;
  create: (data: CreateInput) => Promise<T>;
  update: (id: number, data: UpdateInput) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

// Hook options
export interface UseResourceOptions {
  initialId?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: ApiError) => void;
  autoLoad?: boolean;
}

// Hook return type
export interface UseApiResourceReturn<T, CreateInput, UpdateInput> {
  // Data state
  items: T[];
  selectedItem: T | null;

  // Loading states
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingById: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error state
  error: ApiError | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  // CRUD operations
  loadAll: (filters?: any) => Promise<void>;
  loadById: (id: number) => Promise<void>;
  create: (data: CreateInput) => Promise<T | null>;
  update: (id: number, data: UpdateInput) => Promise<T | null>;
  deleteItem: (id: number) => Promise<boolean>;

  // Utility methods
  reset: () => void;
  clearError: () => void;
  setSelectedItem: (item: T | null) => void;
}

/**
 * Generic hook factory for API resources
 * Provides consistent state management and CRUD operations
 */
export function useApiResource<T extends { id: number }, CreateInput, UpdateInput>(
  apiMethods: ApiResourceMethods<T, CreateInput, UpdateInput>,
  options: UseResourceOptions = {}
): UseApiResourceReturn<T, CreateInput, UpdateInput> {
  const { onSuccess, onError, autoLoad = false } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Loading states
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingById, setIsLoadingById] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Combined loading state
  const isLoading = isLoadingAll || isLoadingById || isCreating || isUpdating || isDeleting;

  /**
   * Load all items with optional filters
   */
  const loadAll = useCallback(async (filters?: any) => {
    setIsLoadingAll(true);
    setError(null);

    try {
      const response = await apiMethods.getAll(filters);
      setItems(response.items);

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
    } finally {
      setIsLoadingAll(false);
    }
  }, [apiMethods, onError]);

  /**
   * Load single item by ID
   */
  const loadById = useCallback(async (id: number) => {
    setIsLoadingById(true);
    setError(null);

    try {
      const item = await apiMethods.getById(id);
      setSelectedItem(item);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
    } finally {
      setIsLoadingById(false);
    }
  }, [apiMethods, onError]);

  /**
   * Create new item
   */
  const create = useCallback(async (data: CreateInput): Promise<T | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const newItem = await apiMethods.create(data);

      // Add to items list
      setItems(prev => [newItem, ...prev]);

      if (onSuccess) {
        onSuccess('Item created successfully');
      }

      return newItem;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [apiMethods, onSuccess, onError]);

  /**
   * Update existing item
   */
  const update = useCallback(async (id: number, data: UpdateInput): Promise<T | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updatedItem = await apiMethods.update(id, data);

      // Update in items list
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));

      // Update selected item if it's the same
      if (selectedItem?.id === id) {
        setSelectedItem(updatedItem);
      }

      if (onSuccess) {
        onSuccess('Item updated successfully');
      }

      return updatedItem;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [apiMethods, selectedItem, onSuccess, onError]);

  /**
   * Delete item
   */
  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiMethods.delete(id);

      // Remove from items list
      setItems(prev => prev.filter(item => item.id !== id));

      // Clear selected item if it's the deleted one
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }

      if (onSuccess) {
        onSuccess('Item deleted successfully');
      }

      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [apiMethods, selectedItem, onSuccess, onError]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setItems([]);
    setSelectedItem(null);
    setError(null);
    setPagination(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    items,
    selectedItem,

    // Loading states
    isLoading,
    isLoadingAll,
    isLoadingById,
    isCreating,
    isUpdating,
    isDeleting,

    // Error
    error,

    // Pagination
    pagination,

    // Operations
    loadAll,
    loadById,
    create,
    update,
    deleteItem,

    // Utilities
    reset,
    clearError,
    setSelectedItem,
  };
}

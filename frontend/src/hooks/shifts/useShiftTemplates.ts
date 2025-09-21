'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftTemplatesApiService } from '@/lib/shift-templates';
import { templateCache } from '@/lib/cache/template-cache';
import { errorHandler } from '@/lib/error-handling/error-handler';
import { loadingManager, LoadingOperations } from '@/lib/loading/loading-manager';
import { withLoadingState } from '@/lib/loading/loading-manager';
import { 
  ShiftTemplate,
  CreateShiftTemplateRequest,
  UpdateShiftTemplateRequest,
  TemplateFilters
} from '@/types/shifts/templates';

export function useShiftTemplates(initialFilters: TemplateFilters = {}) {
  const [filters, setFilters] = useState<TemplateFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query for getting all templates with caching
  const {
    data: templates,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['shift-templates', filters],
    queryFn: async () => {
      // Try cache first (assuming we have company context)
      const companyId = 1; // This should come from auth context
      const cached = templateCache.getTemplates(companyId, filters);
      if (cached) {
        return cached;
      }

      // Fetch from API and cache
      const data = await shiftTemplatesApiService.getTemplates(filters);
      templateCache.setTemplates(companyId, data, filters);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating templates
  const createMutation = useMutation({
    mutationFn: withLoadingState(
      (data: CreateShiftTemplateRequest) => shiftTemplatesApiService.createTemplate(data),
      LoadingOperations.TEMPLATE_CREATE,
      {
        operation: 'Creating template',
        message: 'Creating shift template...',
        estimatedDuration: 2000,
      }
    ),
    onSuccess: () => {
      const companyId = 1; // This should come from auth context
      templateCache.invalidateTemplates(companyId);
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Template Creation');
    },
  });

  // Mutation for updating templates
  const updateMutation = useMutation({
    mutationFn: withLoadingState(
      ({ id, data }: { id: number; data: UpdateShiftTemplateRequest }) => 
        shiftTemplatesApiService.updateTemplate(id, data),
      LoadingOperations.TEMPLATE_UPDATE,
      {
        operation: 'Updating template',
        message: 'Updating shift template...',
        estimatedDuration: 2000,
      }
    ),
    onSuccess: () => {
      const companyId = 1; // This should come from auth context
      templateCache.invalidateTemplates(companyId);
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Template Update');
    },
  });

  // Mutation for deleting templates
  const deleteMutation = useMutation({
    mutationFn: withLoadingState(
      (id: number) => shiftTemplatesApiService.deleteTemplate(id),
      LoadingOperations.TEMPLATE_DELETE,
      {
        operation: 'Deleting template',
        message: 'Deleting shift template...',
        estimatedDuration: 1500,
      }
    ),
    onSuccess: () => {
      const companyId = 1; // This should come from auth context
      templateCache.invalidateTemplates(companyId);
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Template Deletion');
    },
  });

  // Mutation for incrementing usage count
  const incrementUsageMutation = useMutation({
    mutationFn: (id: number) => shiftTemplatesApiService.incrementUsage(id),
    onSuccess: () => {
      const companyId = 1; // This should come from auth context
      templateCache.invalidateTemplates(companyId);
      queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
    },
    onError: (error) => {
      // Don't show error for usage tracking - it's not critical
      console.warn('Failed to update template usage:', error);
    },
  });

  // Helper functions
  const updateFilters = useCallback((newFilters: Partial<TemplateFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const createTemplate = useCallback(async (data: CreateShiftTemplateRequest): Promise<ShiftTemplate> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateTemplate = useCallback(async (id: number, data: UpdateShiftTemplateRequest): Promise<ShiftTemplate> => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteTemplate = useCallback(async (id: number): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const useTemplate = useCallback(async (id: number): Promise<void> => {
    return incrementUsageMutation.mutateAsync(id);
  }, [incrementUsageMutation]);

  const refreshTemplates = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shift-templates'] });
    refetch();
  }, [refetch, queryClient]);

  return {
    // Data
    templates: templates || [],
    
    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error: error?.message || null,
    createError: createMutation.error?.message || null,
    updateError: updateMutation.error?.message || null,
    deleteError: deleteMutation.error?.message || null,
    
    // Actions
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    refreshTemplates,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
  };
}

/**
 * Hook for getting a single template by ID
 */
export function useShiftTemplate(id: number | null) {
  return useQuery({
    queryKey: ['shift-template', id],
    queryFn: () => id ? shiftTemplatesApiService.getTemplate(id) : null,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
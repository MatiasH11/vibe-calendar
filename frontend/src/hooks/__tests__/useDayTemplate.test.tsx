/**
 * useDayTemplate Hook Tests
 * Tests for the day template hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDayTemplate } from '../useDayTemplate';
import { dayTemplateApi } from '@/api/dayTemplateApi';
import type { DayTemplate } from '@/lib/validation';

// Mock the API
jest.mock('@/api/dayTemplateApi');

describe('useDayTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDayTemplate: DayTemplate = {
    id: 1,
    company_id: 1,
    name: 'Weekday Template',
    description: 'Standard weekday schedule',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  describe('Base CRUD Operations', () => {
    it('should load all day templates', async () => {
      const mockResponse = {
        data: [mockDayTemplate],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (dayTemplateApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([mockDayTemplate]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load day template by id', async () => {
      (dayTemplateApi.getById as jest.Mock).mockResolvedValue(mockDayTemplate);

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadById(1);
      });

      await waitFor(() => {
        expect(result.current.selectedItem).toEqual(mockDayTemplate);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should create new day template', async () => {
      const createData = {
        company_id: 1,
        name: 'Weekend Template',
        description: 'Weekend schedule',
        is_active: true,
      };

      const createdTemplate = { ...mockDayTemplate, ...createData, id: 2 };
      (dayTemplateApi.create as jest.Mock).mockResolvedValue(createdTemplate);

      const { result } = renderHook(() => useDayTemplate());

      let newItem: DayTemplate | null = null;
      await act(async () => {
        newItem = await result.current.create(createData);
      });

      await waitFor(() => {
        expect(newItem).toEqual(createdTemplate);
        expect(result.current.items).toContainEqual(createdTemplate);
      });
    });

    it('should update day template', async () => {
      const updateData = { name: 'Updated Weekday Template', is_active: false };
      const updatedTemplate = { ...mockDayTemplate, ...updateData };

      (dayTemplateApi.update as jest.Mock).mockResolvedValue(updatedTemplate);

      const { result } = renderHook(() => useDayTemplate());

      // Set selected item first
      act(() => {
        result.current.setSelectedItem(mockDayTemplate);
      });

      await act(async () => {
        await result.current.update(1, updateData);
      });

      await waitFor(() => {
        expect(result.current.selectedItem?.name).toBe('Updated Weekday Template');
        expect(result.current.selectedItem?.is_active).toBe(false);
      });
    });

    it('should delete day template', async () => {
      (dayTemplateApi.delete as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDayTemplate());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteItem(1);
      });

      await waitFor(() => {
        expect(deleted).toBe(true);
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe('Extended Operations', () => {
    it('should get active day templates', async () => {
      const activeTemplates = [
        mockDayTemplate,
        { ...mockDayTemplate, id: 2, name: 'Another Active' },
      ];

      (dayTemplateApi.getActive as jest.Mock).mockResolvedValue(activeTemplates);

      const { result } = renderHook(() => useDayTemplate());

      let templates;
      await act(async () => {
        templates = await result.current.getActive();
      });

      await waitFor(() => {
        expect(templates).toEqual(activeTemplates);
        expect(templates?.length).toBe(2);
        expect(dayTemplateApi.getActive).toHaveBeenCalled();
      });
    });

    it('should clone day template', async () => {
      const clonedTemplate = {
        ...mockDayTemplate,
        id: 2,
        name: 'Weekday Template (Clone)',
      };

      (dayTemplateApi.clone as jest.Mock).mockResolvedValue(clonedTemplate);

      const { result } = renderHook(() => useDayTemplate());

      let clone;
      await act(async () => {
        clone = await result.current.clone(1, 'Weekday Template (Clone)');
      });

      await waitFor(() => {
        expect(clone).toEqual(clonedTemplate);
        expect(dayTemplateApi.clone).toHaveBeenCalledWith(1, 'Weekday Template (Clone)');
      });
    });

    it('should toggle active status', async () => {
      const toggledTemplate = { ...mockDayTemplate, is_active: false };

      (dayTemplateApi.toggleActive as jest.Mock).mockResolvedValue(toggledTemplate);

      const { result } = renderHook(() => useDayTemplate());

      let toggled;
      await act(async () => {
        toggled = await result.current.toggleActive(1);
      });

      await waitFor(() => {
        expect(toggled).toEqual(toggledTemplate);
        expect(toggled?.is_active).toBe(false);
        expect(dayTemplateApi.toggleActive).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create day templates', async () => {
      const createData = [
        {
          company_id: 1,
          name: 'Template 1',
          description: 'First template',
        },
        {
          company_id: 1,
          name: 'Template 2',
          description: 'Second template',
        },
      ];

      const bulkResult = {
        succeeded: [
          { ...mockDayTemplate, id: 1, name: 'Template 1' },
          { ...mockDayTemplate, id: 2, name: 'Template 2' },
        ],
        failed: [],
        successCount: 2,
        failureCount: 0,
      };

      (dayTemplateApi.bulkCreate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkCreate(createData);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully created 2 day templates');
      });
    });

    it('should handle partial success in bulk create', async () => {
      const createData = [
        { company_id: 1, name: 'Valid Template' },
        { company_id: 1, name: '' }, // Invalid
      ];

      const bulkResult = {
        succeeded: [{ ...mockDayTemplate, name: 'Valid Template' }],
        failed: [
          {
            index: 1,
            item: createData[1],
            error: 'Name is required',
          },
        ],
        successCount: 1,
        failureCount: 1,
      };

      (dayTemplateApi.bulkCreate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onSuccess }));

      await act(async () => {
        await result.current.bulkCreate(createData);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Created 1 day templates, 1 failed');
      });
    });

    it('should bulk update day templates', async () => {
      const ids = [1, 2, 3];
      const updateData = { is_active: false };

      const bulkResult = {
        succeeded: [mockDayTemplate],
        failed: [],
        successCount: 3,
        failureCount: 0,
      };

      (dayTemplateApi.bulkUpdate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkUpdate(ids, updateData);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully updated 3 day templates');
      });
    });

    it('should bulk delete day templates', async () => {
      const ids = [1, 2, 3];

      const bulkResult = {
        succeeded: [],
        failed: [],
        successCount: 3,
        failureCount: 0,
      };

      (dayTemplateApi.bulkDelete as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkDelete(ids);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully deleted 3 day templates');
      });
    });

    it('should handle all failures in bulk delete', async () => {
      const ids = [1, 2];

      const bulkResult = {
        succeeded: [],
        failed: [
          { index: 0, item: { id: 1 }, error: 'Has associated shifts' },
          { index: 1, item: { id: 2 }, error: 'Has associated shifts' },
        ],
        successCount: 0,
        failureCount: 2,
      };

      (dayTemplateApi.bulkDelete as jest.Mock).mockResolvedValue(bulkResult);

      const onError = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onError }));

      await act(async () => {
        await result.current.bulkDelete(ids);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in getActive', async () => {
      const mockError = new Error('Failed to load');
      (dayTemplateApi.getActive as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onError }));

      await act(async () => {
        await result.current.getActive();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle errors in clone', async () => {
      const mockError = new Error('Clone failed');
      (dayTemplateApi.clone as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onError }));

      await act(async () => {
        await result.current.clone(1, 'New Name');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle errors in toggleActive', async () => {
      const mockError = new Error('Toggle failed');
      (dayTemplateApi.toggleActive as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onError }));

      await act(async () => {
        await result.current.toggleActive(1);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle errors in bulk operations', async () => {
      const mockError = new Error('Bulk operation failed');
      (dayTemplateApi.bulkCreate as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useDayTemplate({ onError }));

      await act(async () => {
        await result.current.bulkCreate([]);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Filters', () => {
    it('should load templates with filters', async () => {
      const mockResponse = {
        data: [mockDayTemplate],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      (dayTemplateApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadAll({
          search: 'Weekday',
          is_active: 'true',
          page: '1',
          limit: '20',
          sort_by: 'name',
          sort_order: 'asc',
        });
      });

      await waitFor(() => {
        expect(dayTemplateApi.getAll).toHaveBeenCalledWith({
          search: 'Weekday',
          is_active: 'true',
          page: '1',
          limit: '20',
          sort_by: 'name',
          sort_order: 'asc',
        });
      });
    });

    it('should filter only active templates', async () => {
      const activeTemplates = [
        mockDayTemplate,
        { ...mockDayTemplate, id: 2, name: 'Active 2' },
      ];

      const mockResponse = {
        data: activeTemplates,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };

      (dayTemplateApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadAll({ is_active: 'true' });
      });

      await waitFor(() => {
        expect(result.current.items.every(t => t.is_active)).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('should track loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (dayTemplateApi.getAll as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useDayTemplate());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePromise!({
          data: [mockDayTemplate],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should track individual operation loading states', async () => {
      (dayTemplateApi.create as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDayTemplate), 100))
      );

      const { result } = renderHook(() => useDayTemplate());

      expect(result.current.isCreating).toBe(false);

      act(() => {
        result.current.create({
          company_id: 1,
          name: 'New Template',
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      await waitFor(
        () => {
          expect(result.current.isCreating).toBe(false);
        },
        { timeout: 200 }
      );
    });
  });

  describe('Utility Methods', () => {
    it('should reset state', async () => {
      (dayTemplateApi.getAll as jest.Mock).mockResolvedValue({
        data: [mockDayTemplate],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadAll();
      });

      expect(result.current.items.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.selectedItem).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.pagination).toBeNull();
      });
    });

    it('should clear error', async () => {
      (dayTemplateApi.getAll as jest.Mock).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useDayTemplate());

      await act(async () => {
        await result.current.loadAll();
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

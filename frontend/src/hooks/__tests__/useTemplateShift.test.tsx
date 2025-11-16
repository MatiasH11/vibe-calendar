/**
 * useTemplateShift Hook Tests
 * Tests for the template shift hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTemplateShift } from '../useTemplateShift';
import { templateShiftApi } from '@/api/templateShiftApi';
import type { TemplateShift } from '@/lib/validation';

// Mock the API
jest.mock('@/api/templateShiftApi');

describe('useTemplateShift', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTemplateShift: TemplateShift = {
    id: 1,
    day_template_id: 1,
    name: 'Morning Shift',
    start_time: '09:00',
    end_time: '17:00',
    color: '#3b82f6',
    sort_order: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  describe('Base CRUD Operations', () => {
    it('should load all template shifts', async () => {
      const mockResponse = {
        data: [mockTemplateShift],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (templateShiftApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTemplateShift());

      await act(async () => {
        await result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([mockTemplateShift]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should create new template shift', async () => {
      const createData = {
        day_template_id: 1,
        name: 'Evening Shift',
        start_time: '17:00',
        end_time: '01:00',
      };

      const createdShift = { ...mockTemplateShift, ...createData, id: 2 };
      (templateShiftApi.create as jest.Mock).mockResolvedValue(createdShift);

      const { result } = renderHook(() => useTemplateShift());

      let newItem: TemplateShift | null = null;
      await act(async () => {
        newItem = await result.current.create(createData);
      });

      await waitFor(() => {
        expect(newItem).toEqual(createdShift);
        expect(result.current.items).toContainEqual(createdShift);
      });
    });
  });

  describe('Extended Operations', () => {
    it('should get template shifts by day template', async () => {
      const mockShifts = [mockTemplateShift];
      (templateShiftApi.getTemplateShifts as jest.Mock).mockResolvedValue(mockShifts);

      const { result } = renderHook(() => useTemplateShift());

      let shifts;
      await act(async () => {
        shifts = await result.current.getTemplateShifts(1);
      });

      await waitFor(() => {
        expect(shifts).toEqual(mockShifts);
        expect(templateShiftApi.getTemplateShifts).toHaveBeenCalledWith(1);
      });
    });

    it('should clone template shift', async () => {
      const clonedShift = {
        ...mockTemplateShift,
        id: 2,
        name: 'Morning Shift (Copy)',
      };

      (templateShiftApi.clone as jest.Mock).mockResolvedValue(clonedShift);

      const { result } = renderHook(() => useTemplateShift());

      let clone;
      await act(async () => {
        clone = await result.current.clone(1, 1);
      });

      await waitFor(() => {
        expect(clone).toEqual(clonedShift);
        expect(templateShiftApi.clone).toHaveBeenCalledWith(1, 1, undefined);
      });
    });

    it('should clone template shift with custom name', async () => {
      const clonedShift = {
        ...mockTemplateShift,
        id: 2,
        name: 'Custom Clone Name',
      };

      (templateShiftApi.clone as jest.Mock).mockResolvedValue(clonedShift);

      const { result } = renderHook(() => useTemplateShift());

      let clone;
      await act(async () => {
        clone = await result.current.clone(1, 1, 'Custom Clone Name');
      });

      await waitFor(() => {
        expect(clone).toEqual(clonedShift);
        expect(templateShiftApi.clone).toHaveBeenCalledWith(1, 1, 'Custom Clone Name');
      });
    });

    it('should clone to different day template', async () => {
      const clonedShift = {
        ...mockTemplateShift,
        id: 2,
        day_template_id: 2,
      };

      (templateShiftApi.clone as jest.Mock).mockResolvedValue(clonedShift);

      const { result } = renderHook(() => useTemplateShift());

      await act(async () => {
        await result.current.clone(1, 2);
      });

      await waitFor(() => {
        expect(templateShiftApi.clone).toHaveBeenCalledWith(1, 2, undefined);
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create template shifts', async () => {
      const createData = [
        {
          day_template_id: 1,
          name: 'Shift 1',
          start_time: '09:00',
          end_time: '17:00',
        },
        {
          day_template_id: 1,
          name: 'Shift 2',
          start_time: '17:00',
          end_time: '01:00',
        },
      ];

      const bulkResult = {
        succeeded: [
          { ...mockTemplateShift, id: 1, name: 'Shift 1' },
          { ...mockTemplateShift, id: 2, name: 'Shift 2' },
        ],
        failed: [],
        successCount: 2,
        failureCount: 0,
      };

      (templateShiftApi.bulkCreate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkCreate(createData);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully created 2 template shifts');
      });
    });

    it('should handle partial success in bulk create', async () => {
      const createData = [
        {
          day_template_id: 1,
          start_time: '09:00',
          end_time: '17:00',
        },
      ];

      const bulkResult = {
        succeeded: [mockTemplateShift],
        failed: [
          {
            index: 1,
            item: createData[0],
            error: 'Validation failed',
          },
        ],
        successCount: 1,
        failureCount: 1,
      };

      (templateShiftApi.bulkCreate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const onError = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onSuccess, onError }));

      await act(async () => {
        await result.current.bulkCreate(createData);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Created 1 template shifts, 1 failed');
      });
    });

    it('should bulk update template shifts', async () => {
      const ids = [1, 2, 3];
      const updateData = { color: '#10b981' };

      const bulkResult = {
        succeeded: [mockTemplateShift],
        failed: [],
        successCount: 3,
        failureCount: 0,
      };

      (templateShiftApi.bulkUpdate as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkUpdate(ids, updateData);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully updated 3 template shifts');
      });
    });

    it('should bulk delete template shifts', async () => {
      const ids = [1, 2, 3];

      const bulkResult = {
        succeeded: [],
        failed: [],
        successCount: 3,
        failureCount: 0,
      };

      (templateShiftApi.bulkDelete as jest.Mock).mockResolvedValue(bulkResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onSuccess }));

      let bulkResponse;
      await act(async () => {
        bulkResponse = await result.current.bulkDelete(ids);
      });

      await waitFor(() => {
        expect(bulkResponse).toEqual(bulkResult);
        expect(onSuccess).toHaveBeenCalledWith('Successfully deleted 3 template shifts');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in getTemplateShifts', async () => {
      const mockError = new Error('Failed to load');
      (templateShiftApi.getTemplateShifts as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onError }));

      await act(async () => {
        await result.current.getTemplateShifts(1);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle errors in clone', async () => {
      const mockError = new Error('Clone failed');
      (templateShiftApi.clone as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onError }));

      await act(async () => {
        await result.current.clone(1, 1);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle errors in bulk create', async () => {
      const mockError = new Error('Bulk create failed');
      (templateShiftApi.bulkCreate as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useTemplateShift({ onError }));

      await act(async () => {
        await result.current.bulkCreate([]);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should track loading states correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (templateShiftApi.getAll as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useTemplateShift());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePromise!({
          data: [mockTemplateShift],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Filters', () => {
    it('should load template shifts with filters', async () => {
      const mockResponse = {
        data: [mockTemplateShift],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      (templateShiftApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTemplateShift());

      await act(async () => {
        await result.current.loadAll({
          day_template_id: '1',
          search: 'Morning',
          page: '1',
          limit: '20',
        });
      });

      await waitFor(() => {
        expect(templateShiftApi.getAll).toHaveBeenCalledWith({
          day_template_id: '1',
          search: 'Morning',
          page: '1',
          limit: '20',
        });
      });
    });
  });
});

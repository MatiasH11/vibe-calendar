/**
 * useShiftAssignment Hook Tests
 * Tests for the shift assignment hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useShiftAssignment } from '../useShiftAssignment';
import { shiftAssignmentApi } from '@/api/shiftAssignmentApi';
import type { ShiftAssignment } from '@/lib/validation';

// Mock the API
jest.mock('@/api/shiftAssignmentApi');

describe('useShiftAssignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockShiftAssignment: ShiftAssignment = {
    id: 1,
    location_id: 1,
    employee_id: 1,
    day_template_shift_id: null,
    shift_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    status: 'pending',
    notes: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  describe('Base CRUD Operations', () => {
    it('should load all shift assignments', async () => {
      const mockResponse = {
        data: [mockShiftAssignment],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (shiftAssignmentApi.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useShiftAssignment());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toEqual([]);

      await act(async () => {
        await result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([mockShiftAssignment]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.pagination).toBeDefined();
      });
    });

    it('should load shift assignment by id', async () => {
      (shiftAssignmentApi.getById as jest.Mock).mockResolvedValue(mockShiftAssignment);

      const { result } = renderHook(() => useShiftAssignment());

      await act(async () => {
        await result.current.loadById(1);
      });

      await waitFor(() => {
        expect(result.current.selectedItem).toEqual(mockShiftAssignment);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should create new shift assignment', async () => {
      const createData = {
        location_id: 1,
        employee_id: 1,
        shift_date: '2024-01-16',
        start_time: '10:00',
        end_time: '18:00',
      };

      const createdAssignment = { ...mockShiftAssignment, ...createData, id: 2 };
      (shiftAssignmentApi.create as jest.Mock).mockResolvedValue(createdAssignment);

      const { result } = renderHook(() => useShiftAssignment());

      let newItem: ShiftAssignment | null = null;
      await act(async () => {
        newItem = await result.current.create(createData);
      });

      await waitFor(() => {
        expect(newItem).toEqual(createdAssignment);
        expect(result.current.items).toContainEqual(createdAssignment);
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should update shift assignment', async () => {
      const updateData = { start_time: '08:00', end_time: '16:00' };
      const updatedAssignment = { ...mockShiftAssignment, ...updateData };

      (shiftAssignmentApi.update as jest.Mock).mockResolvedValue(updatedAssignment);

      const { result } = renderHook(() => useShiftAssignment());

      // First set an item
      act(() => {
        result.current.setSelectedItem(mockShiftAssignment);
      });

      await act(async () => {
        await result.current.update(1, updateData);
      });

      await waitFor(() => {
        expect(result.current.selectedItem?.start_time).toBe('08:00');
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it('should delete shift assignment', async () => {
      (shiftAssignmentApi.delete as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useShiftAssignment());

      // Add item to state first
      await act(async () => {
        result.current.items.push(mockShiftAssignment);
      });

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteItem(1);
      });

      await waitFor(() => {
        expect(deleted).toBe(true);
        expect(result.current.items).not.toContainEqual(mockShiftAssignment);
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe('Extended Operations', () => {
    it('should confirm shift assignment', async () => {
      const confirmedAssignment = { ...mockShiftAssignment, status: 'confirmed' as const };
      (shiftAssignmentApi.confirmShift as jest.Mock).mockResolvedValue(confirmedAssignment);

      const { result } = renderHook(() => useShiftAssignment());

      let confirmed: ShiftAssignment | null = null;
      await act(async () => {
        confirmed = await result.current.confirmShift(1);
      });

      await waitFor(() => {
        expect(confirmed?.status).toBe('confirmed');
      });
    });

    it('should validate conflicts', async () => {
      const assignment = {
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const validationResult = {
        isValid: false,
        conflicts: [
          {
            type: 'overlap',
            message: 'Shift overlaps with existing shift',
            conflictingShift: { id: 2, start_time: '08:00', end_time: '16:00' },
          },
        ],
      };

      (shiftAssignmentApi.validateConflicts as jest.Mock).mockResolvedValue(validationResult);

      const { result } = renderHook(() => useShiftAssignment());

      let validation;
      await act(async () => {
        validation = await result.current.validateConflicts(assignment);
      });

      await waitFor(() => {
        expect(validation).toEqual(validationResult);
        expect(validation?.isValid).toBe(false);
        expect(validation?.conflicts).toHaveLength(1);
      });
    });

    it('should validate business rules', async () => {
      const assignment = {
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '23:00', // Too many hours
      };

      const validationResult = {
        isValid: false,
        violations: [
          {
            rule: 'max_daily_hours',
            message: 'Exceeds maximum daily hours (8)',
            severity: 'error',
          },
        ],
      };

      (shiftAssignmentApi.validateBusinessRules as jest.Mock).mockResolvedValue(
        validationResult
      );

      const { result } = renderHook(() => useShiftAssignment());

      let validation;
      await act(async () => {
        validation = await result.current.validateBusinessRules(assignment);
      });

      await waitFor(() => {
        expect(validation).toEqual(validationResult);
        expect(validation?.isValid).toBe(false);
        expect(validation?.violations).toHaveLength(1);
      });
    });

    it('should get coverage analysis', async () => {
      const coverageData = {
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
        coverageByDate: [
          {
            date: '2024-01-15',
            totalShifts: 10,
            confirmedShifts: 8,
            pendingShifts: 2,
            coveragePercentage: 80,
          },
        ],
        coverageByPosition: [],
        summary: {
          totalShifts: 10,
          confirmedShifts: 8,
          pendingShifts: 2,
          overallCoveragePercentage: 80,
        },
      };

      (shiftAssignmentApi.getCoverageAnalysis as jest.Mock).mockResolvedValue(coverageData);

      const { result } = renderHook(() => useShiftAssignment());

      let coverage;
      await act(async () => {
        coverage = await result.current.getCoverageAnalysis('2024-01-01', '2024-01-31', 1);
      });

      await waitFor(() => {
        expect(coverage).toEqual(coverageData);
        expect(coverage?.summary.overallCoveragePercentage).toBe(80);
      });
    });

    it('should get shift assignments by employee', async () => {
      const mockResponse = {
        data: [mockShiftAssignment],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (shiftAssignmentApi.getByEmployee as jest.Mock).mockResolvedValue([mockShiftAssignment]);

      const { result } = renderHook(() => useShiftAssignment());

      let shifts;
      await act(async () => {
        shifts = await result.current.getByEmployee(1, {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        });
      });

      await waitFor(() => {
        expect(shifts).toEqual([mockShiftAssignment]);
      });
    });

    it('should get shift assignments by location', async () => {
      (shiftAssignmentApi.getByLocation as jest.Mock).mockResolvedValue([mockShiftAssignment]);

      const { result } = renderHook(() => useShiftAssignment());

      let shifts;
      await act(async () => {
        shifts = await result.current.getByLocation(1, { status: 'confirmed' });
      });

      await waitFor(() => {
        expect(shifts).toEqual([mockShiftAssignment]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in loadAll', async () => {
      const mockError = new Error('Failed to load');
      (shiftAssignmentApi.getAll as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useShiftAssignment({ onError }));

      await act(async () => {
        await result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle errors in create', async () => {
      const mockError = new Error('Validation failed');
      (shiftAssignmentApi.create as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useShiftAssignment({ onError }));

      let created;
      await act(async () => {
        created = await result.current.create({
          location_id: 1,
          employee_id: 1,
          shift_date: '2024-01-15',
          start_time: '09:00',
          end_time: '17:00',
        });
      });

      await waitFor(() => {
        expect(created).toBeNull();
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback on successful create', async () => {
      (shiftAssignmentApi.create as jest.Mock).mockResolvedValue(mockShiftAssignment);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useShiftAssignment({ onSuccess }));

      await act(async () => {
        await result.current.create({
          location_id: 1,
          employee_id: 1,
          shift_date: '2024-01-15',
          start_time: '09:00',
          end_time: '17:00',
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Item created successfully');
      });
    });

    it('should call onSuccess callback on successful update', async () => {
      (shiftAssignmentApi.update as jest.Mock).mockResolvedValue(mockShiftAssignment);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useShiftAssignment({ onSuccess }));

      await act(async () => {
        await result.current.update(1, { start_time: '10:00' });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Item updated successfully');
      });
    });
  });

  describe('Utility Methods', () => {
    it('should reset state', async () => {
      (shiftAssignmentApi.getAll as jest.Mock).mockResolvedValue({
        data: [mockShiftAssignment],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(() => useShiftAssignment());

      // Load some data
      await act(async () => {
        await result.current.loadAll();
      });

      expect(result.current.items.length).toBeGreaterThan(0);

      // Reset
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
      (shiftAssignmentApi.getAll as jest.Mock).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useShiftAssignment());

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

    it('should set selected item', () => {
      const { result } = renderHook(() => useShiftAssignment());

      act(() => {
        result.current.setSelectedItem(mockShiftAssignment);
      });

      expect(result.current.selectedItem).toEqual(mockShiftAssignment);
    });
  });

  describe('Loading States', () => {
    it('should track loading states correctly during loadAll', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (shiftAssignmentApi.getAll as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useShiftAssignment());

      expect(result.current.isLoadingAll).toBe(false);
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.loadAll();
      });

      await waitFor(() => {
        expect(result.current.isLoadingAll).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePromise!({
          data: [mockShiftAssignment],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoadingAll).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});

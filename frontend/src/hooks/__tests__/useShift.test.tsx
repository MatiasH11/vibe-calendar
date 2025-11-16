/**
 * Tests for useShift hook
 *
 * Tests shift management hook functionality including CRUD operations,
 * week views, validation, and bulk operations.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useShift } from '../useShift';
import { shiftApi } from '@/api/shiftApi';
import type { CreateShiftInput } from '@/api/shiftApi';

// Mock shiftApi
jest.mock('@/api/shiftApi', () => ({
  shiftApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getWeekView: jest.fn(),
    getEmployeeSchedule: jest.fn(),
    validateConflicts: jest.fn(),
    validateBusinessRules: jest.fn(),
    validate: jest.fn(),
    duplicateShift: jest.fn(),
    bulkCreate: jest.fn(),
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
    getEmployeePatterns: jest.fn(),
    getSuggestions: jest.fn(),
  },
}));

describe('useShift', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useShift());

      expect(result.current.shifts).toEqual([]);
      expect(result.current.selectedShift).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should auto-load when autoLoad is true', async () => {
      (shiftApi.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ shift_id: 1 }],
      });

      const { result } = renderHook(() => useShift({ autoLoad: true }));

      await waitFor(() => {
        expect(result.current.shifts).toHaveLength(1);
      });

      expect(shiftApi.getAll).toHaveBeenCalled();
    });
  });

  describe('loadAll', () => {
    it('should load all shifts', async () => {
      const mockShifts = [
        { shift_id: 1, date: '2025-01-15' },
        { shift_id: 2, date: '2025-01-16' },
      ];

      (shiftApi.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockShifts,
      });

      const { result } = renderHook(() => useShift());

      await act(async () => {
        await result.current.loadAll();
      });

      expect(result.current.shifts).toEqual(mockShifts);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when loading shifts', async () => {
      const mockError = new Error('Failed to load');
      (shiftApi.getAll as jest.Mock).mockRejectedValue(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useShift({ onError }));

      await act(async () => {
        await result.current.loadAll();
      });

      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    it('should create a new shift', async () => {
      const input: CreateShiftInput = {
        employee_id: 1,
        date: '2025-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockCreated = { shift_id: 1, ...input };

      (shiftApi.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCreated,
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useShift({ onSuccess }));

      let createdShift;
      await act(async () => {
        createdShift = await result.current.create(input);
      });

      expect(createdShift).toEqual(mockCreated);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing shift', async () => {
      const mockUpdated = { shift_id: 1, status: 'completed' };

      (shiftApi.update as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUpdated,
      });

      const { result } = renderHook(() => useShift());

      let updatedShift;
      await act(async () => {
        updatedShift = await result.current.update(1, { status: 'completed' });
      });

      expect(updatedShift).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should delete a shift', async () => {
      (shiftApi.delete as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useShift());

      let deleted;
      await act(async () => {
        deleted = await result.current.delete(1);
      });

      expect(deleted).toBe(true);
      expect(shiftApi.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('loadWeekView', () => {
    it('should load week view data', async () => {
      const mockWeekView = {
        week_start: '2025-01-13',
        week_end: '2025-01-19',
        shifts: [],
        employees: [],
        summary: {
          total_shifts: 0,
          total_hours: 0,
          employees_scheduled: 0,
        },
      };

      (shiftApi.getWeekView as jest.Mock).mockResolvedValue({
        success: true,
        data: mockWeekView,
      });

      const { result } = renderHook(() => useShift());

      await act(async () => {
        await result.current.loadWeekView({ start_date: '2025-01-13' });
      });

      expect(result.current.weekView).toEqual(mockWeekView);
      expect(result.current.isLoadingWeekView).toBe(false);
    });

    it('should handle week view errors', async () => {
      (shiftApi.getWeekView as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );

      const onError = jest.fn();
      const { result } = renderHook(() => useShift({ onError }));

      await act(async () => {
        await result.current.loadWeekView({ start_date: '2025-01-13' });
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('loadEmployeeSchedule', () => {
    it('should load employee schedule', async () => {
      const mockSchedule = [
        { shift_id: 1, employee_id: 1 },
        { shift_id: 2, employee_id: 1 },
      ];

      (shiftApi.getEmployeeSchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSchedule,
      });

      const { result } = renderHook(() => useShift());

      await act(async () => {
        await result.current.loadEmployeeSchedule({ employee_id: 1 });
      });

      expect(result.current.employeeSchedule).toEqual(mockSchedule);
    });
  });

  describe('validation', () => {
    it('should validate conflicts', async () => {
      const mockConflicts = [
        {
          type: 'overlap' as const,
          existing_shift: {} as any,
          message: 'Overlaps',
        },
      ];

      (shiftApi.validateConflicts as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConflicts,
      });

      const { result } = renderHook(() => useShift());

      let conflicts;
      await act(async () => {
        conflicts = await result.current.validateConflicts({
          employee_id: 1,
          date: '2025-01-15',
          start_time: '09:00',
          end_time: '17:00',
        });
      });

      expect(conflicts).toEqual(mockConflicts);
    });

    it('should validate business rules', async () => {
      const mockViolations = [
        {
          rule: 'max_hours',
          message: 'Exceeds max hours',
          severity: 'error' as const,
        },
      ];

      (shiftApi.validateBusinessRules as jest.Mock).mockResolvedValue({
        success: true,
        data: mockViolations,
      });

      const { result } = renderHook(() => useShift());

      let violations;
      await act(async () => {
        violations = await result.current.validateBusinessRules({
          employee_id: 1,
          date: '2025-01-15',
          start_time: '09:00',
          end_time: '17:00',
        });
      });

      expect(violations).toEqual(mockViolations);
    });

    it('should perform combined validation', async () => {
      const mockResult = {
        valid: false,
        conflicts: [],
        rule_violations: [],
      };

      (shiftApi.validate as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const { result } = renderHook(() => useShift());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validate({
          employee_id: 1,
          date: '2025-01-15',
          start_time: '09:00',
          end_time: '17:00',
        });
      });

      expect(validationResult).toEqual(mockResult);
      expect(result.current.validationResult).toEqual(mockResult);
    });
  });

  describe('duplicateShift', () => {
    it('should duplicate shift to multiple dates', async () => {
      const mockResult = {
        succeeded: [],
        failed: [],
        summary: {
          total_requested: 2,
          total_succeeded: 2,
          total_failed: 0,
        },
      };

      (shiftApi.duplicateShift as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useShift({ onSuccess }));

      let duplicateResult;
      await act(async () => {
        duplicateResult = await result.current.duplicateShift({
          shift_id: 1,
          target_dates: ['2025-01-16', '2025-01-17'],
        });
      });

      expect(duplicateResult).toEqual(mockResult);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('bulk operations', () => {
    it('should bulk create shifts', async () => {
      const mockResult = {
        succeeded: [],
        failed: [],
        summary: {
          total_requested: 3,
          total_succeeded: 3,
          total_failed: 0,
        },
      };

      (shiftApi.bulkCreate as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const { result } = renderHook(() => useShift());

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkCreate({
          shifts: [],
          conflict_strategy: 'skip',
        });
      });

      expect(bulkResult).toEqual(mockResult);
    });

    it('should bulk update shifts', async () => {
      const mockResult = {
        succeeded: [],
        failed: [],
        summary: { total_requested: 2, total_succeeded: 2, total_failed: 0 },
      };

      (shiftApi.bulkUpdate as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const { result } = renderHook(() => useShift());

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkUpdate({
          updates: [],
        });
      });

      expect(bulkResult).toEqual(mockResult);
    });

    it('should bulk delete shifts', async () => {
      const mockResult = {
        succeeded: [],
        failed: [],
        summary: { total_requested: 2, total_succeeded: 2, total_failed: 0 },
      };

      (shiftApi.bulkDelete as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const { result } = renderHook(() => useShift());

      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkDelete({
          shift_ids: [1, 2],
        });
      });

      expect(bulkResult).toEqual(mockResult);
    });
  });

  describe('AI/Pattern operations', () => {
    it('should get employee patterns', async () => {
      const mockPatterns = { patterns: [] };

      (shiftApi.getEmployeePatterns as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPatterns,
      });

      const { result } = renderHook(() => useShift());

      let patterns;
      await act(async () => {
        patterns = await result.current.getEmployeePatterns(1);
      });

      expect(patterns).toEqual(mockPatterns);
    });

    it('should get shift suggestions', async () => {
      const mockSuggestions = { suggestions: [] };

      (shiftApi.getSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const { result } = renderHook(() => useShift());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSuggestions({
          employee_id: 1,
          date: '2025-01-15',
        });
      });

      expect(suggestions).toEqual(mockSuggestions);
    });
  });

  describe('state management', () => {
    it('should clear week view', () => {
      const { result } = renderHook(() => useShift());

      act(() => {
        result.current.clearWeekView();
      });

      expect(result.current.weekView).toBeNull();
    });

    it('should clear employee schedule', () => {
      const { result } = renderHook(() => useShift());

      act(() => {
        result.current.clearEmployeeSchedule();
      });

      expect(result.current.employeeSchedule).toBeNull();
    });

    it('should clear validation', () => {
      const { result } = renderHook(() => useShift());

      act(() => {
        result.current.clearValidation();
      });

      expect(result.current.validationResult).toBeNull();
    });

    it('should reset all state', () => {
      const { result } = renderHook(() => useShift());

      act(() => {
        result.current.reset();
      });

      expect(result.current.shifts).toEqual([]);
      expect(result.current.selectedShift).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});

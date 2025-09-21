import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealTimeConflictValidation } from '../useRealTimeConflictValidation';
import { shiftsApiService } from '@/lib/shifts';
import { ShiftFormData } from '@/types/shifts/forms';
import { ConflictValidationResponse } from '@/types/shifts/templates';

// Mock the API service
jest.mock('@/lib/shifts');
const mockShiftsApiService = shiftsApiService as jest.Mocked<typeof shiftsApiService>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useRealTimeConflictValidation', () => {
  const mockFormData: ShiftFormData = {
    company_employee_id: 1,
    shift_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    notes: 'Test shift'
  };

  const mockConflictResponse: ConflictValidationResponse = {
    has_conflicts: true,
    conflicts: [
      {
        employee_id: 1,
        employee_name: 'John Doe',
        date: '2024-01-15',
        conflicting_shifts: [
          {
            id: 1,
            start_time: '08:00',
            end_time: '16:00',
            notes: 'Existing shift'
          }
        ],
        suggested_alternatives: [
          {
            start_time: '17:00',
            end_time: '01:00',
            reason: 'Available slot'
          }
        ]
      }
    ],
    total_conflicts: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData),
        { wrapper: createWrapper() }
      );

      expect(result.current.isValidating).toBe(false);
      expect(result.current.hasConflicts).toBe(false);
      expect(result.current.conflicts).toEqual([]);
      expect(result.current.lastValidated).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.conflictCount).toBe(0);
      expect(result.current.isValid).toBe(true);
    });

    it('should not validate incomplete form data', () => {
      const incompleteFormData: Partial<ShiftFormData> = {
        company_employee_id: 1,
        shift_date: '2024-01-15',
        // Missing start_time and end_time
      };

      renderHook(
        () => useRealTimeConflictValidation(incompleteFormData as ShiftFormData),
        { wrapper: createWrapper() }
      );

      expect(mockShiftsApiService.validateConflicts).not.toHaveBeenCalled();
    });
  });

  describe('debounced validation', () => {
    it('should validate after debounce delay', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData, { debounceMs: 300 }),
        { wrapper: createWrapper() }
      );

      // Should not validate immediately
      expect(mockShiftsApiService.validateConflicts).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced validation
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith({
          shifts: [{
            company_employee_id: 1,
            shift_date: '2024-01-15',
            start_time: '09:00',
            end_time: '17:00'
          }]
        });
      });

      expect(result.current.hasConflicts).toBe(false);
      expect(result.current.isValid).toBe(true);
    });

    it('should handle validation with conflicts', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue(mockConflictResponse);

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData, { debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(result.current.hasConflicts).toBe(true);
      });

      expect(result.current.conflicts).toEqual(mockConflictResponse.conflicts);
      expect(result.current.conflictCount).toBe(1);
      expect(result.current.isValid).toBe(false);
    });

    it('should cancel previous validation when form data changes', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      const { result, rerender } = renderHook(
        ({ formData }) => useRealTimeConflictValidation(formData, { debounceMs: 300 }),
        { 
          wrapper: createWrapper(),
          initialProps: { formData: mockFormData }
        }
      );

      // Start first validation
      jest.advanceTimersByTime(200);

      // Change form data before first validation completes
      const updatedFormData = { ...mockFormData, start_time: '10:00' };
      rerender({ formData: updatedFormData });

      // Complete the debounce period
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledTimes(1);
      });

      // Should validate with the updated data
      expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith({
        shifts: [{
          company_employee_id: 1,
          shift_date: '2024-01-15',
          start_time: '10:00',
          end_time: '17:00'
        }]
      });
    });
  });

  describe('manual validation', () => {
    it('should validate immediately when validateNow is called', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData),
        { wrapper: createWrapper() }
      );

      const response = await result.current.validateNow();

      expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith({
        shifts: [{
          company_employee_id: 1,
          shift_date: '2024-01-15',
          start_time: '09:00',
          end_time: '17:00'
        }]
      });

      expect(response).toEqual({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      mockShiftsApiService.validateConflicts.mockRejectedValue(error);

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData),
        { wrapper: createWrapper() }
      );

      const response = await result.current.validateNow();

      expect(response).toBeNull();
      expect(result.current.error).toBe('Validation failed');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('multiple shifts validation', () => {
    it('should validate multiple shifts', async () => {
      const multipleShifts: ShiftFormData[] = [
        mockFormData,
        {
          company_employee_id: 2,
          shift_date: '2024-01-16',
          start_time: '10:00',
          end_time: '18:00',
          notes: 'Second shift'
        }
      ];

      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      renderHook(
        () => useRealTimeConflictValidation(multipleShifts, { debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith({
          shifts: [
            {
              company_employee_id: 1,
              shift_date: '2024-01-15',
              start_time: '09:00',
              end_time: '17:00'
            },
            {
              company_employee_id: 2,
              shift_date: '2024-01-16',
              start_time: '10:00',
              end_time: '18:00'
            }
          ]
        });
      });
    });

    it('should filter out incomplete shifts from array', async () => {
      const shiftsWithIncomplete: ShiftFormData[] = [
        mockFormData,
        {
          company_employee_id: 2,
          shift_date: '2024-01-16',
          start_time: '',
          end_time: '',
          notes: 'Incomplete shift'
        } as ShiftFormData
      ];

      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      renderHook(
        () => useRealTimeConflictValidation(shiftsWithIncomplete, { debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith({
          shifts: [{
            company_employee_id: 1,
            shift_date: '2024-01-15',
            start_time: '09:00',
            end_time: '17:00'
          }]
        });
      });
    });
  });

  describe('helper functions', () => {
    it('should provide conflict filtering helpers', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue(mockConflictResponse);

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData, { debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(result.current.hasConflicts).toBe(true);
      });

      // Test employee-specific helpers
      expect(result.current.getConflictsForEmployee(1)).toEqual(mockConflictResponse.conflicts);
      expect(result.current.getConflictsForEmployee(2)).toEqual([]);
      expect(result.current.hasConflictsForEmployee(1)).toBe(true);
      expect(result.current.hasConflictsForEmployee(2)).toBe(false);

      // Test date-specific helpers
      expect(result.current.getConflictsForDate('2024-01-15')).toEqual(mockConflictResponse.conflicts);
      expect(result.current.getConflictsForDate('2024-01-16')).toEqual([]);
      expect(result.current.hasConflictsForDate('2024-01-15')).toBe(true);
      expect(result.current.hasConflictsForDate('2024-01-16')).toBe(false);
    });
  });

  describe('options', () => {
    it('should respect enabled option', () => {
      renderHook(
        () => useRealTimeConflictValidation(mockFormData, { enabled: false, debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      expect(mockShiftsApiService.validateConflicts).not.toHaveBeenCalled();
    });

    it('should validate on mount when validateOnMount is true', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue({
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      });

      renderHook(
        () => useRealTimeConflictValidation(mockFormData, { validateOnMount: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockShiftsApiService.validateConflicts).toHaveBeenCalled();
      });
    });
  });

  describe('cleanup', () => {
    it('should clear validation state', async () => {
      mockShiftsApiService.validateConflicts.mockResolvedValue(mockConflictResponse);

      const { result } = renderHook(
        () => useRealTimeConflictValidation(mockFormData, { debounceMs: 100 }),
        { wrapper: createWrapper() }
      );

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(result.current.hasConflicts).toBe(true);
      });

      result.current.clearValidation();

      expect(result.current.hasConflicts).toBe(false);
      expect(result.current.conflicts).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.lastValidated).toBeNull();
    });
  });
});
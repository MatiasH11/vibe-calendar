/**
 * Tests for shiftApi module
 *
 * Tests all shift-related API operations including CRUD, week views,
 * validation, duplication, and bulk operations.
 */

import { shiftApi } from '../shiftApi';
import { apiClient } from '@/lib/api';
import type { Shift, CreateShiftInput, UpdateShiftInput } from '../shiftApi';

// Mock apiClient
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('shiftApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all shifts without filters', async () => {
      const mockShifts: Shift[] = [
        {
          shift_id: 1,
          company_id: 1,
          employee_id: 1,
          location_id: 1,
          department_id: 1,
          date: '2025-01-15',
          start_time: '09:00',
          end_time: '17:00',
          status: 'scheduled',
          notes: null,
          assigned_by: 1,
          confirmed_by: null,
          confirmed_at: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          deleted_at: null,
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockShifts,
      });

      const result = await shiftApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift');
      expect(result.data).toEqual(mockShifts);
    });

    it('should fetch shifts with filters', async () => {
      const filters = {
        employee_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'scheduled' as const,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      await shiftApi.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('employee_id=1')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2025-01-01')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2025-01-31')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('status=scheduled')
      );
    });
  });

  describe('getById', () => {
    it('should fetch a single shift by ID', async () => {
      const mockShift: Shift = {
        shift_id: 1,
        company_id: 1,
        employee_id: 1,
        location_id: 1,
        department_id: 1,
        date: '2025-01-15',
        start_time: '09:00',
        end_time: '17:00',
        status: 'scheduled',
        notes: 'Test shift',
        assigned_by: 1,
        confirmed_by: null,
        confirmed_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockShift,
      });

      const result = await shiftApi.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift/1');
      expect(result.data).toEqual(mockShift);
    });
  });

  describe('create', () => {
    it('should create a new shift', async () => {
      const input: CreateShiftInput = {
        employee_id: 1,
        location_id: 1,
        department_id: 1,
        date: '2025-01-15',
        start_time: '09:00',
        end_time: '17:00',
        status: 'scheduled',
      };

      const mockCreated: Shift = {
        shift_id: 1,
        company_id: 1,
        ...input,
        notes: null,
        assigned_by: 1,
        confirmed_by: null,
        confirmed_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCreated,
      });

      const result = await shiftApi.create(input);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/shift', input);
      expect(result.data).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('should update an existing shift', async () => {
      const input: UpdateShiftInput = {
        start_time: '10:00',
        end_time: '18:00',
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { shift_id: 1, ...input },
      });

      await shiftApi.update(1, input);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/shift/1', input);
    });
  });

  describe('delete', () => {
    it('should delete a shift', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      await shiftApi.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/shift/1');
    });
  });

  describe('getWeekView', () => {
    it('should fetch week view data', async () => {
      const params = {
        start_date: '2025-01-13',
        location_id: 1,
      };

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

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockWeekView,
      });

      const result = await shiftApi.getWeekView(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/shift/week-view')
      );
      expect(result.data).toEqual(mockWeekView);
    });
  });

  describe('getEmployeeSchedule', () => {
    it('should fetch employee schedule', async () => {
      const params = {
        employee_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      await shiftApi.getEmployeeSchedule(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/shift/employee-schedule')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('employee_id=1')
      );
    });
  });

  describe('validateConflicts', () => {
    it('should validate shift conflicts', async () => {
      const shift: CreateShiftInput = {
        employee_id: 1,
        date: '2025-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockConflicts = [
        {
          type: 'overlap' as const,
          existing_shift: {} as Shift,
          message: 'Overlaps with existing shift',
        },
      ];

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConflicts,
      });

      const result = await shiftApi.validateConflicts(shift);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift/validate-conflicts',
        shift
      );
      expect(result.data).toEqual(mockConflicts);
    });
  });

  describe('validateBusinessRules', () => {
    it('should validate business rules', async () => {
      const shift: CreateShiftInput = {
        employee_id: 1,
        date: '2025-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockViolations = [
        {
          rule: 'max_daily_hours',
          message: 'Exceeds maximum daily hours',
          severity: 'error' as const,
        },
      ];

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockViolations,
      });

      const result = await shiftApi.validateBusinessRules(shift);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift/validate-rules',
        shift
      );
      expect(result.data).toEqual(mockViolations);
    });
  });

  describe('duplicateShift', () => {
    it('should duplicate shift to multiple dates', async () => {
      const params = {
        shift_id: 1,
        target_dates: ['2025-01-16', '2025-01-17'],
        conflict_strategy: 'skip' as const,
      };

      const mockResult = {
        succeeded: [],
        failed: [],
        summary: {
          total_requested: 2,
          total_succeeded: 2,
          total_failed: 0,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const result = await shiftApi.duplicateShift(params);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift/1/duplicate',
        expect.objectContaining({
          target_dates: params.target_dates,
          conflict_strategy: 'skip',
        })
      );
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple shifts', async () => {
      const input = {
        shifts: [
          {
            employee_id: 1,
            date: '2025-01-15',
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
        conflict_strategy: 'fail' as const,
      };

      const mockResult = {
        succeeded: [],
        failed: [],
        summary: {
          total_requested: 1,
          total_succeeded: 1,
          total_failed: 0,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const result = await shiftApi.bulkCreate(input);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/shift/bulk', input);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple shifts', async () => {
      const input = {
        updates: [
          {
            shift_id: 1,
            data: { status: 'completed' as const },
          },
        ],
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { succeeded: [], failed: [], summary: {} },
      });

      await shiftApi.bulkUpdate(input);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/shift/bulk', input);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple shifts', async () => {
      const input = {
        shift_ids: [1, 2, 3],
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({
        success: true,
        data: { succeeded: [], failed: [], summary: {} },
      });

      await shiftApi.bulkDelete(input);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/shift/bulk', {
        data: input,
      });
    });
  });

  describe('getEmployeePatterns', () => {
    it('should fetch employee shift patterns', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: { patterns: [] },
      });

      await shiftApi.getEmployeePatterns(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/shift/employee/1/patterns'
      );
    });
  });

  describe('getSuggestions', () => {
    it('should fetch shift suggestions', async () => {
      const params = {
        employee_id: 1,
        date: '2025-01-15',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: { suggestions: [] },
      });

      await shiftApi.getSuggestions(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/shift/suggestions')
      );
    });
  });
});

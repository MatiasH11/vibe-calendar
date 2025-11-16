/**
 * Shift Assignment API Tests
 * Tests for shift assignment API module
 */

import { shiftAssignmentApi } from '../shiftAssignmentApi';
import { apiClient } from '@/lib/api';
import type { ShiftAssignment, CreateShiftAssignmentInput } from '@/lib/validation';

// Mock the apiClient
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('shiftAssignmentApi', () => {
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
    status: 'confirmed',
    notes: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  describe('getAll', () => {
    it('should fetch all shift assignments', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockShiftAssignment],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment', { params: {} });
      expect(result.data).toEqual([mockShiftAssignment]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockShiftAssignment],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await shiftAssignmentApi.getAll({
        page: '2',
        limit: '20',
        employee_id: '1',
        location_id: '1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        status: 'confirmed',
        sort_by: 'shift_date',
        sort_order: 'desc',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment', {
        params: {
          page: '2',
          limit: '20',
          employee_id: '1',
          location_id: '1',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'confirmed',
          sort_by: 'shift_date',
          sort_order: 'desc',
        },
      });
    });
  });

  describe('getById', () => {
    it('should fetch shift assignment by id', async () => {
      const mockResponse = {
        success: true,
        data: mockShiftAssignment,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment/1');
      expect(result).toEqual(mockShiftAssignment);
    });

    it('should throw error when response is not successful', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(shiftAssignmentApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new shift assignment', async () => {
      const createData: CreateShiftAssignmentInput = {
        location_id: 1,
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockResponse = {
        success: true,
        data: mockShiftAssignment,
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/shift-assignment', createData);
      expect(result).toEqual(mockShiftAssignment);
    });
  });

  describe('update', () => {
    it('should update shift assignment', async () => {
      const updateData = {
        start_time: '10:00',
        end_time: '18:00',
      };

      const updatedAssignment = { ...mockShiftAssignment, ...updateData };
      const mockResponse = {
        success: true,
        data: updatedAssignment,
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.update(1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/shift-assignment/1', updateData);
      expect(result.start_time).toBe('10:00');
      expect(result.end_time).toBe('18:00');
    });
  });

  describe('delete', () => {
    it('should delete shift assignment', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      await shiftAssignmentApi.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/shift-assignment/1');
    });

    it('should throw error on failed delete', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({
        success: false,
      });

      await expect(shiftAssignmentApi.delete(1)).rejects.toThrow();
    });
  });

  describe('confirmShift', () => {
    it('should confirm shift assignment', async () => {
      const confirmedAssignment = { ...mockShiftAssignment, status: 'confirmed' as const };
      const mockResponse = {
        success: true,
        data: confirmedAssignment,
      };

      (apiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.confirmShift(1);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/shift-assignment/1/confirm');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('validateConflicts', () => {
    it('should validate shift conflicts', async () => {
      const assignment = {
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockResponse = {
        success: true,
        data: {
          isValid: false,
          conflicts: [
            {
              type: 'overlap',
              message: 'Shift overlaps with existing shift',
              conflictingShift: { id: 2, start_time: '08:00', end_time: '16:00' },
            },
          ],
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.validateConflicts(assignment);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift-assignment/validate-conflicts',
        assignment
      );
      expect(result.isValid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });

    it('should return valid when no conflicts', async () => {
      const assignment = {
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockResponse = {
        success: true,
        data: {
          isValid: true,
          conflicts: [],
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.validateConflicts(assignment);

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('validateBusinessRules', () => {
    it('should validate business rules', async () => {
      const assignment = {
        employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockResponse = {
        success: true,
        data: {
          isValid: false,
          violations: [
            {
              rule: 'max_daily_hours',
              message: 'Exceeds maximum daily hours (8)',
              severity: 'error',
            },
          ],
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.validateBusinessRules(assignment);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift-assignment/validate-business-rules',
        assignment
      );
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple shift assignments', async () => {
      const bulkData = {
        assignments: [
          {
            location_id: 1,
            employee_id: 1,
            shift_date: '2024-01-15',
            start_time: '09:00',
            end_time: '17:00',
          },
          {
            location_id: 1,
            employee_id: 2,
            shift_date: '2024-01-15',
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [mockShiftAssignment],
          failed: [],
          successCount: 1,
          failureCount: 0,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.bulkCreate(bulkData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/shift-assignment/bulk/create',
        bulkData
      );
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial failures in bulk create', async () => {
      const bulkData = {
        assignments: [
          {
            location_id: 1,
            employee_id: 1,
            shift_date: '2024-01-15',
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [],
          failed: [
            {
              index: 0,
              item: bulkData.assignments[0],
              error: 'Validation failed',
            },
          ],
          successCount: 0,
          failureCount: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.bulkCreate(bulkData);

      expect(result.failureCount).toBe(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple shift assignments', async () => {
      const ids = [1, 2, 3];
      const updateData = { status: 'confirmed' as const };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [mockShiftAssignment],
          failed: [],
          successCount: 3,
          failureCount: 0,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.bulkUpdate(ids, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/shift-assignment/bulk/update', {
        ids,
        data: updateData,
      });
      expect(result.successCount).toBe(3);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple shift assignments', async () => {
      const ids = [1, 2, 3];

      const mockResponse = {
        success: true,
        data: {
          succeeded: [],
          failed: [],
          successCount: 3,
          failureCount: 0,
        },
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.bulkDelete(ids);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/shift-assignment/bulk/delete', {
        body: JSON.stringify({ ids }),
      });
      expect(result.successCount).toBe(3);
    });
  });

  describe('getCoverageAnalysis', () => {
    it('should get coverage analysis', async () => {
      const mockResponse = {
        success: true,
        data: {
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
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
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.getCoverageAnalysis(
        '2024-01-01',
        '2024-01-31',
        1
      );

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment/coverage-analysis', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          location_id: '1',
        },
      });
      expect(result.summary.totalShifts).toBe(10);
      expect(result.summary.overallCoveragePercentage).toBe(80);
    });

    it('should work without location filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
          coverageByDate: [],
          coverageByPosition: [],
          summary: {
            totalShifts: 0,
            confirmedShifts: 0,
            pendingShifts: 0,
            overallCoveragePercentage: 0,
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await shiftAssignmentApi.getCoverageAnalysis('2024-01-01', '2024-01-31');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment/coverage-analysis', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        },
      });
    });
  });

  describe('getByEmployee', () => {
    it('should get shift assignments by employee', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockShiftAssignment],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.getByEmployee(1, {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment', {
        params: {
          employee_id: '1',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        },
      });
      expect(result).toEqual([mockShiftAssignment]);
    });
  });

  describe('getByLocation', () => {
    it('should get shift assignments by location', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockShiftAssignment],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await shiftAssignmentApi.getByLocation(1, {
        status: 'confirmed',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/shift-assignment', {
        params: {
          location_id: '1',
          status: 'confirmed',
        },
      });
      expect(result).toEqual([mockShiftAssignment]);
    });
  });
});

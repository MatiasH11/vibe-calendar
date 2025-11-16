/**
 * Template Shift API Tests
 * Tests for template shift API module
 */

import { templateShiftApi } from '../templateShiftApi';
import { apiClient } from '@/lib/api';
import type { TemplateShift, CreateTemplateShiftInput } from '@/lib/validation';

// Mock the apiClient
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('templateShiftApi', () => {
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

  describe('getAll', () => {
    it('should fetch all template shifts', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockTemplateShift],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/template-shift', { params: {} });
      expect(result.data).toEqual([mockTemplateShift]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockTemplateShift],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await templateShiftApi.getAll({
        page: '1',
        limit: '20',
        day_template_id: '1',
        search: 'Morning',
        sort_by: 'sort_order',
        sort_order: 'asc',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/template-shift', {
        params: {
          page: '1',
          limit: '20',
          day_template_id: '1',
          search: 'Morning',
          sort_by: 'sort_order',
          sort_order: 'asc',
        },
      });
    });
  });

  describe('getById', () => {
    it('should fetch template shift by id', async () => {
      const mockResponse = {
        success: true,
        data: mockTemplateShift,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/template-shift/1');
      expect(result).toEqual(mockTemplateShift);
    });

    it('should throw error when response is not successful', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(templateShiftApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new template shift', async () => {
      const createData: CreateTemplateShiftInput = {
        day_template_id: 1,
        name: 'Evening Shift',
        start_time: '17:00',
        end_time: '01:00',
        color: '#ef4444',
        sort_order: 2,
      };

      const mockResponse = {
        success: true,
        data: { ...mockTemplateShift, ...createData, id: 2 },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/template-shift', createData);
      expect(result.name).toBe('Evening Shift');
    });

    it('should create template shift with minimal data', async () => {
      const createData: CreateTemplateShiftInput = {
        day_template_id: 1,
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockResponse = {
        success: true,
        data: { ...mockTemplateShift, ...createData },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.create(createData);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update template shift', async () => {
      const updateData = {
        name: 'Updated Morning Shift',
        start_time: '08:00',
        color: '#10b981',
      };

      const updatedShift = { ...mockTemplateShift, ...updateData };
      const mockResponse = {
        success: true,
        data: updatedShift,
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.update(1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/template-shift/1', updateData);
      expect(result.name).toBe('Updated Morning Shift');
      expect(result.start_time).toBe('08:00');
      expect(result.color).toBe('#10b981');
    });
  });

  describe('delete', () => {
    it('should delete template shift', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      await templateShiftApi.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/template-shift/1');
    });

    it('should throw error on failed delete', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({
        success: false,
      });

      await expect(templateShiftApi.delete(1)).rejects.toThrow();
    });
  });

  describe('getTemplateShifts', () => {
    it('should get shifts for a specific day template', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockTemplateShift],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.getTemplateShifts(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/template-shift', {
        params: { day_template_id: '1' },
      });
      expect(result).toEqual([mockTemplateShift]);
    });

    it('should return empty array when no shifts found', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.getTemplateShifts(999);

      expect(result).toEqual([]);
    });
  });

  describe('clone', () => {
    it('should clone template shift to same day template', async () => {
      const mockResponse = {
        success: true,
        data: mockTemplateShift,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTemplateShift, id: 2, name: 'Morning Shift (Copy)' },
      });

      const result = await templateShiftApi.clone(1, 1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/template-shift/1');
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/template-shift', {
        day_template_id: 1,
        name: 'Morning Shift (Copy)',
        start_time: '09:00',
        end_time: '17:00',
        color: '#3b82f6',
        sort_order: 1,
      });
      expect(result.name).toBe('Morning Shift (Copy)');
    });

    it('should clone template shift to different day template', async () => {
      const mockResponse = {
        success: true,
        data: mockTemplateShift,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTemplateShift, id: 2, day_template_id: 2 },
      });

      const result = await templateShiftApi.clone(1, 2);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/template-shift', {
        day_template_id: 2,
        name: 'Morning Shift (Copy)',
        start_time: '09:00',
        end_time: '17:00',
        color: '#3b82f6',
        sort_order: 1,
      });
      expect(result.day_template_id).toBe(2);
    });

    it('should use custom name when cloning', async () => {
      const mockResponse = {
        success: true,
        data: mockTemplateShift,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockTemplateShift, id: 2, name: 'Custom Clone Name' },
      });

      const result = await templateShiftApi.clone(1, 1, 'Custom Clone Name');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/template-shift',
        expect.objectContaining({ name: 'Custom Clone Name' })
      );
      expect(result.name).toBe('Custom Clone Name');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple template shifts', async () => {
      const bulkData: CreateTemplateShiftInput[] = [
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

      const mockResponse = {
        success: true,
        data: {
          succeeded: [
            { ...mockTemplateShift, id: 1, name: 'Shift 1' },
            { ...mockTemplateShift, id: 2, name: 'Shift 2' },
          ],
          failed: [],
          successCount: 2,
          failureCount: 0,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.bulkCreate(bulkData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/template-shift/bulk/create', {
        shifts: bulkData,
      });
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial failures in bulk create', async () => {
      const bulkData: CreateTemplateShiftInput[] = [
        {
          day_template_id: 1,
          start_time: '09:00',
          end_time: '17:00',
        },
      ];

      const mockResponse = {
        success: true,
        data: {
          succeeded: [],
          failed: [
            {
              index: 0,
              item: bulkData[0],
              error: 'Validation failed',
            },
          ],
          successCount: 0,
          failureCount: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.bulkCreate(bulkData);

      expect(result.failureCount).toBe(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple template shifts', async () => {
      const ids = [1, 2, 3];
      const updateData = { color: '#10b981' };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [mockTemplateShift],
          failed: [],
          successCount: 3,
          failureCount: 0,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.bulkUpdate(ids, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/template-shift/bulk/update', {
        ids,
        data: updateData,
      });
      expect(result.successCount).toBe(3);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple template shifts', async () => {
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

      const result = await templateShiftApi.bulkDelete(ids);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/template-shift/bulk/delete', {
        body: JSON.stringify({ ids }),
      });
      expect(result.successCount).toBe(3);
    });

    it('should handle failures in bulk delete', async () => {
      const ids = [1, 2];

      const mockResponse = {
        success: true,
        data: {
          succeeded: [],
          failed: [
            { index: 0, item: { id: 1 }, error: 'In use' },
          ],
          successCount: 1,
          failureCount: 1,
        },
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await templateShiftApi.bulkDelete(ids);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failed).toHaveLength(1);
    });
  });
});

/**
 * Day Template API Tests
 * Tests for day template API module
 */

import { dayTemplateApi } from '../dayTemplateApi';
import { apiClient } from '@/lib/api';
import type { DayTemplate, CreateDayTemplateInput } from '@/lib/validation';

// Mock the apiClient
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('dayTemplateApi', () => {
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

  describe('getAll', () => {
    it('should fetch all day templates', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockDayTemplate],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template', { params: {} });
      expect(result.data).toEqual([mockDayTemplate]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [mockDayTemplate],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await dayTemplateApi.getAll({
        page: '2',
        limit: '20',
        search: 'Weekday',
        is_active: 'true',
        sort_by: 'name',
        sort_order: 'asc',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template', {
        params: {
          page: '2',
          limit: '20',
          search: 'Weekday',
          is_active: 'true',
          sort_by: 'name',
          sort_order: 'asc',
        },
      });
    });
  });

  describe('getById', () => {
    it('should fetch day template by id', async () => {
      const mockResponse = {
        success: true,
        data: mockDayTemplate,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template/1');
      expect(result).toEqual(mockDayTemplate);
    });

    it('should throw error when response is not successful', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(dayTemplateApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new day template', async () => {
      const createData: CreateDayTemplateInput = {
        company_id: 1,
        name: 'Weekend Template',
        description: 'Weekend schedule',
        is_active: true,
      };

      const mockResponse = {
        success: true,
        data: { ...mockDayTemplate, ...createData, id: 2 },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/day-template', createData);
      expect(result.name).toBe('Weekend Template');
    });

    it('should create day template with minimal data', async () => {
      const createData: CreateDayTemplateInput = {
        company_id: 1,
        name: 'Basic Template',
      };

      const mockResponse = {
        success: true,
        data: { ...mockDayTemplate, ...createData },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.create(createData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Basic Template');
    });
  });

  describe('update', () => {
    it('should update day template', async () => {
      const updateData = {
        name: 'Updated Weekday Template',
        description: 'Updated description',
        is_active: false,
      };

      const updatedTemplate = { ...mockDayTemplate, ...updateData };
      const mockResponse = {
        success: true,
        data: updatedTemplate,
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.update(1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/day-template/1', updateData);
      expect(result.name).toBe('Updated Weekday Template');
      expect(result.is_active).toBe(false);
    });

    it('should allow partial updates', async () => {
      const updateData = { description: 'New description only' };

      const mockResponse = {
        success: true,
        data: { ...mockDayTemplate, ...updateData },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.update(1, updateData);

      expect(result.description).toBe('New description only');
    });
  });

  describe('delete', () => {
    it('should delete day template', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      await dayTemplateApi.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/day-template/1');
    });

    it('should throw error on failed delete', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({
        success: false,
      });

      await expect(dayTemplateApi.delete(1)).rejects.toThrow();
    });
  });

  describe('getActive', () => {
    it('should get only active day templates', async () => {
      const activeTemplates = [
        mockDayTemplate,
        { ...mockDayTemplate, id: 2, name: 'Another Active' },
      ];

      const mockResponse = {
        success: true,
        data: {
          data: activeTemplates,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.getActive();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template', {
        params: { is_active: 'true' },
      });
      expect(result).toHaveLength(2);
      expect(result.every(t => t.is_active)).toBe(true);
    });

    it('should return empty array when no active templates', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.getActive();

      expect(result).toEqual([]);
    });
  });

  describe('clone', () => {
    it('should clone day template with new name', async () => {
      const mockResponse = {
        success: true,
        data: mockDayTemplate,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockDayTemplate, id: 2, name: 'Weekday Template (Clone)' },
      });

      const result = await dayTemplateApi.clone(1, 'Weekday Template (Clone)');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template/1');
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/day-template', {
        company_id: 1,
        name: 'Weekday Template (Clone)',
        description: 'Standard weekday schedule',
        is_active: true,
      });
      expect(result.name).toBe('Weekday Template (Clone)');
    });

    it('should preserve properties when cloning', async () => {
      const mockResponse = {
        success: true,
        data: mockDayTemplate,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockDayTemplate, id: 2, name: 'Cloned' },
      });

      await dayTemplateApi.clone(1, 'Cloned');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/day-template',
        expect.objectContaining({
          company_id: 1,
          description: 'Standard weekday schedule',
          is_active: true,
        })
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status from true to false', async () => {
      const mockResponse = {
        success: true,
        data: mockDayTemplate,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockDayTemplate, is_active: false },
      });

      const result = await dayTemplateApi.toggleActive(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/day-template/1');
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/day-template/1', {
        is_active: false,
      });
      expect(result.is_active).toBe(false);
    });

    it('should toggle active status from false to true', async () => {
      const inactiveTemplate = { ...mockDayTemplate, is_active: false };

      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: inactiveTemplate,
      });
      (apiClient.put as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...inactiveTemplate, is_active: true },
      });

      const result = await dayTemplateApi.toggleActive(1);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/day-template/1', {
        is_active: true,
      });
      expect(result.is_active).toBe(true);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple day templates', async () => {
      const bulkData = {
        templates: [
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
        ],
      };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [
            { ...mockDayTemplate, id: 1, name: 'Template 1' },
            { ...mockDayTemplate, id: 2, name: 'Template 2' },
          ],
          failed: [],
          successCount: 2,
          failureCount: 0,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.bulkCreate(bulkData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/day-template/bulk/create', bulkData);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial failures in bulk create', async () => {
      const bulkData = {
        templates: [
          { company_id: 1, name: 'Valid Template' },
          { company_id: 1, name: '' }, // Invalid: empty name
        ],
      };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [{ ...mockDayTemplate, name: 'Valid Template' }],
          failed: [
            {
              index: 1,
              item: bulkData.templates[1],
              error: 'Name is required',
            },
          ],
          successCount: 1,
          failureCount: 1,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.bulkCreate(bulkData);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple day templates', async () => {
      const ids = [1, 2, 3];
      const updateData = { is_active: false };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [mockDayTemplate],
          failed: [],
          successCount: 3,
          failureCount: 0,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.bulkUpdate(ids, updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/day-template/bulk/update', {
        ids,
        data: updateData,
      });
      expect(result.successCount).toBe(3);
    });

    it('should handle partial failures in bulk update', async () => {
      const ids = [1, 999]; // 999 doesn't exist
      const updateData = { description: 'Updated' };

      const mockResponse = {
        success: true,
        data: {
          succeeded: [{ ...mockDayTemplate, description: 'Updated' }],
          failed: [
            {
              index: 1,
              item: { id: 999 },
              error: 'Not found',
            },
          ],
          successCount: 1,
          failureCount: 1,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.bulkUpdate(ids, updateData);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple day templates', async () => {
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

      const result = await dayTemplateApi.bulkDelete(ids);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/day-template/bulk/delete', {
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
            { index: 0, item: { id: 1 }, error: 'Template has associated shifts' },
          ],
          successCount: 1,
          failureCount: 1,
        },
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await dayTemplateApi.bulkDelete(ids);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toContain('associated shifts');
    });
  });
});

import { shiftTemplatesApiService, ShiftTemplatesApiService } from '../shift-templates';
import { apiClient } from '../api';
import { 
  ShiftTemplate,
  CreateShiftTemplateRequest,
  UpdateShiftTemplateRequest,
  TemplateFilters
} from '@/types/shifts/templates';

// Mock the API client
jest.mock('../api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ShiftTemplatesApiService', () => {
  let service: ShiftTemplatesApiService;

  beforeEach(() => {
    service = new ShiftTemplatesApiService();
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    const mockTemplates: ShiftTemplate[] = [
      {
        id: 1,
        company_id: 1,
        name: 'Morning Shift',
        description: 'Standard morning shift',
        start_time: '09:00',
        end_time: '17:00',
        usage_count: 5,
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        company_id: 1,
        name: 'Evening Shift',
        description: 'Standard evening shift',
        start_time: '17:00',
        end_time: '01:00',
        usage_count: 3,
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should fetch templates without filters', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: mockTemplates,
      });

      const result = await service.getTemplates();

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates', {
        method: 'GET',
      });
      expect(result).toEqual(mockTemplates);
    });

    it('should fetch templates with filters', async () => {
      const filters: TemplateFilters = {
        search: 'morning',
        sort_by: 'usage_count',
        sort_order: 'desc',
      };

      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: [mockTemplates[0]],
      });

      const result = await service.getTemplates(filters);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith(
        '/api/v1/shift-templates?search=morning&sort_by=usage_count&sort_order=desc',
        { method: 'GET' }
      );
      expect(result).toEqual([mockTemplates[0]]);
    });

    it('should return empty array when no data', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await service.getTemplates();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      await expect(service.getTemplates()).rejects.toThrow('API Error');
    });
  });

  describe('getTemplate', () => {
    const mockTemplate = {
      id: 1,
      company_id: 1,
      name: 'Morning Shift',
      description: 'Standard morning shift',
      start_time: '09:00',
      end_time: '17:00',
      usage_count: 5,
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should fetch a specific template', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      const result = await service.getTemplate(1);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates/1', {
        method: 'GET',
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should handle template not found', async () => {
      const error = new Error('Template not found');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      await expect(service.getTemplate(999)).rejects.toThrow('Template not found');
    });
  });

  describe('createTemplate', () => {
    const createRequest: CreateShiftTemplateRequest = {
      name: 'New Shift',
      description: 'A new shift template',
      start_time: '10:00',
      end_time: '18:00',
    };

    const createdTemplate: ShiftTemplate = {
      id: 3,
      company_id: 1,
      ...createRequest,
      usage_count: 0,
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should create a new template', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: createdTemplate,
      });

      const result = await service.createTemplate(createRequest);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates', {
        method: 'POST',
        body: JSON.stringify(createRequest),
      });
      expect(result).toEqual(createdTemplate);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      await expect(service.createTemplate(createRequest)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateTemplate', () => {
    const updateRequest: UpdateShiftTemplateRequest = {
      name: 'Updated Shift',
      start_time: '11:00',
    };

    const updatedTemplate: ShiftTemplate = {
      id: 1,
      company_id: 1,
      name: 'Updated Shift',
      description: 'Standard morning shift',
      start_time: '11:00',
      end_time: '17:00',
      usage_count: 5,
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };

    it('should update an existing template', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
        data: updatedTemplate,
      });

      const result = await service.updateTemplate(1, updateRequest);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates/1', {
        method: 'PUT',
        body: JSON.stringify(updateRequest),
      });
      expect(result).toEqual(updatedTemplate);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      await expect(service.updateTemplate(1, updateRequest)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
      });

      await service.deleteTemplate(1);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates/1', {
        method: 'DELETE',
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      await expect(service.deleteTemplate(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      mockApiClient.requestGeneric.mockResolvedValue({
        success: true,
      });

      await service.incrementUsage(1);

      expect(mockApiClient.requestGeneric).toHaveBeenCalledWith('/api/v1/shift-templates/1/use', {
        method: 'POST',
      });
    });

    it('should not throw error on usage tracking failure', async () => {
      const error = new Error('Usage tracking failed');
      mockApiClient.requestGeneric.mockRejectedValue(error);

      // Should not throw - usage tracking is not critical
      await expect(service.incrementUsage(1)).resolves.toBeUndefined();
    });
  });
});
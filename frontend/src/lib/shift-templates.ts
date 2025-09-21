import { apiClient } from './api';
import { 
  ShiftTemplate,
  CreateShiftTemplateRequest,
  UpdateShiftTemplateRequest,
  TemplateListResponse,
  TemplateFilters
} from '@/types/shifts/templates';

export class ShiftTemplatesApiService {
  /**
   * Get all shift templates for the current company
   */
  async getTemplates(filters: TemplateFilters = {}): Promise<ShiftTemplate[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/shift-templates${query ? `?${query}` : ''}`;
    
    try {
      const response = await apiClient.requestGeneric<{ 
        templates: ShiftTemplate[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(endpoint, {
        method: 'GET',
      });
      
      console.log('🔍 Templates API Response:', response);
      return response.templates || [];
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.getTemplates error:', error);
      throw error;
    }
  }

  /**
   * Get a specific shift template by ID
   */
  async getTemplate(id: number): Promise<ShiftTemplate> {
    try {
      const response = await apiClient.requestGeneric<ShiftTemplate>(`/api/v1/shift-templates/${id}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.getTemplate error:', error);
      throw error;
    }
  }

  /**
   * Create a new shift template
   */
  async createTemplate(data: CreateShiftTemplateRequest): Promise<ShiftTemplate> {
    try {
      const response = await apiClient.requestGeneric<ShiftTemplate>('/api/v1/shift-templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response;
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.createTemplate error:', error);
      throw error;
    }
  }

  /**
   * Update an existing shift template
   */
  async updateTemplate(id: number, data: UpdateShiftTemplateRequest): Promise<ShiftTemplate> {
    try {
      const response = await apiClient.requestGeneric<ShiftTemplate>(`/api/v1/shift-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      return response;
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.updateTemplate error:', error);
      throw error;
    }
  }

  /**
   * Delete a shift template
   */
  async deleteTemplate(id: number): Promise<void> {
    try {
      await apiClient.requestGeneric<void>(`/api/v1/shift-templates/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.deleteTemplate error:', error);
      throw error;
    }
  }

  /**
   * Increment usage count for a template (called when template is used)
   */
  async incrementUsage(id: number): Promise<void> {
    try {
      await apiClient.requestGeneric<void>(`/api/v1/shift-templates/${id}/use`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ ShiftTemplatesApiService.incrementUsage error:', error);
      // Don't throw error for usage tracking - it's not critical
    }
  }
}

export const shiftTemplatesApiService = new ShiftTemplatesApiService();
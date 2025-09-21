import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShiftTemplates, useShiftTemplate } from '../useShiftTemplates';
import { shiftTemplatesApiService } from '@/lib/shift-templates';
import { ShiftTemplate, CreateShiftTemplateRequest, UpdateShiftTemplateRequest } from '@/types/shifts/templates';

// Mock the API service
jest.mock('@/lib/shift-templates');
const mockApiService = shiftTemplatesApiService as jest.Mocked<typeof shiftTemplatesApiService>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useShiftTemplates', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('data fetching', () => {
    it('should fetch templates successfully', async () => {
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates).toEqual(mockTemplates);
      expect(result.current.error).toBeNull();
      expect(mockApiService.getTemplates).toHaveBeenCalledWith({});
    });

    it('should fetch templates with filters', async () => {
      const filters = { search: 'morning', sort_by: 'usage_count' as const };
      mockApiService.getTemplates.mockResolvedValue([mockTemplates[0]]);

      const { result } = renderHook(() => useShiftTemplates(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getTemplates).toHaveBeenCalledWith(filters);
      expect(result.current.templates).toEqual([mockTemplates[0]]);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Fetch failed');
      mockApiService.getTemplates.mockRejectedValue(error);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
      expect(result.current.templates).toEqual([]);
    });
  });

  describe('template creation', () => {
    it('should create template successfully', async () => {
      const createRequest: CreateShiftTemplateRequest = {
        name: 'New Shift',
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

      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.createTemplate.mockResolvedValue(createdTemplate);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createdResult = await result.current.createTemplate(createRequest);

      expect(mockApiService.createTemplate).toHaveBeenCalledWith(createRequest);
      expect(createdResult).toEqual(createdTemplate);
      expect(result.current.isCreating).toBe(false);
    });

    it('should handle creation errors', async () => {
      const createRequest: CreateShiftTemplateRequest = {
        name: 'Invalid Shift',
        start_time: '25:00', // Invalid time
        end_time: '18:00',
      };

      const error = new Error('Validation failed');
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.createTemplate.mockRejectedValue(error);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.createTemplate(createRequest)).rejects.toThrow('Validation failed');
      expect(result.current.createError).toBe('Validation failed');
    });
  });

  describe('template updates', () => {
    it('should update template successfully', async () => {
      const updateRequest: UpdateShiftTemplateRequest = {
        name: 'Updated Shift',
        start_time: '11:00',
      };

      const updatedTemplate: ShiftTemplate = {
        ...mockTemplates[0],
        ...updateRequest,
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.updateTemplate.mockResolvedValue(updatedTemplate);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedResult = await result.current.updateTemplate(1, updateRequest);

      expect(mockApiService.updateTemplate).toHaveBeenCalledWith(1, updateRequest);
      expect(updatedResult).toEqual(updatedTemplate);
    });

    it('should handle update errors', async () => {
      const updateRequest: UpdateShiftTemplateRequest = {
        name: '', // Invalid empty name
      };

      const error = new Error('Name is required');
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.updateTemplate.mockRejectedValue(error);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateTemplate(1, updateRequest)).rejects.toThrow('Name is required');
      expect(result.current.updateError).toBe('Name is required');
    });
  });

  describe('template deletion', () => {
    it('should delete template successfully', async () => {
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.deleteTemplate.mockResolvedValue();

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.deleteTemplate(1);

      expect(mockApiService.deleteTemplate).toHaveBeenCalledWith(1);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Template in use');
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.deleteTemplate.mockRejectedValue(error);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.deleteTemplate(1)).rejects.toThrow('Template in use');
      expect(result.current.deleteError).toBe('Template in use');
    });
  });

  describe('usage tracking', () => {
    it('should track template usage', async () => {
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);
      mockApiService.incrementUsage.mockResolvedValue();

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.useTemplate(1);

      expect(mockApiService.incrementUsage).toHaveBeenCalledWith(1);
    });
  });

  describe('filter management', () => {
    it('should update filters', async () => {
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useShiftTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateFilters({ search: 'morning' });

      expect(result.current.filters).toEqual({ search: 'morning' });
    });

    it('should clear filters', async () => {
      const initialFilters = { search: 'test', sort_by: 'name' as const };
      mockApiService.getTemplates.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useShiftTemplates(initialFilters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.clearFilters();

      expect(result.current.filters).toEqual({});
    });
  });
});

describe('useShiftTemplate', () => {
  const mockTemplate: ShiftTemplate = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single template successfully', async () => {
    mockApiService.getTemplate.mockResolvedValue(mockTemplate);

    const { result } = renderHook(() => useShiftTemplate(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockTemplate);
    expect(mockApiService.getTemplate).toHaveBeenCalledWith(1);
  });

  it('should not fetch when id is null', async () => {
    const { result } = renderHook(() => useShiftTemplate(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(mockApiService.getTemplate).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Template not found');
    mockApiService.getTemplate.mockRejectedValue(error);

    const { result } = renderHook(() => useShiftTemplate(999), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});
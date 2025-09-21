import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useShiftDuplication,
  useBulkShiftCreation,
  useConflictValidation,
  useEmployeePatterns,
  useTimeSuggestions,
  useEnhancedShifts
} from '../useEnhancedShifts';
import { shiftsApiService } from '@/lib/shifts';
import { 
  ShiftDuplicationRequest,
  BulkShiftCreationRequest,
  ConflictValidationRequest,
  SuggestionRequest
} from '@/types/shifts/templates';
import { Shift } from '@/types/shifts/shift';

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

describe('useShiftDuplication', () => {
  const mockShift: Shift = {
    id: 1,
    company_employee_id: 1,
    shift_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    notes: 'Test shift',
    status: 'confirmed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    company_employee: {
      id: 1,
      company_id: 1,
      user_id: 1,
      role_id: 1,
      position: 'Developer',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should duplicate shifts successfully', async () => {
    const duplicationRequest: ShiftDuplicationRequest = {
      source_shift_ids: [1],
      target_dates: ['2024-01-16'],
      preserve_employee: true
    };

    mockShiftsApiService.duplicateShifts.mockResolvedValue([mockShift]);

    const { result } = renderHook(() => useShiftDuplication(), {
      wrapper: createWrapper()
    });

    const duplicatedShifts = await result.current.duplicateShifts(duplicationRequest);

    expect(mockShiftsApiService.duplicateShifts).toHaveBeenCalledWith(duplicationRequest);
    expect(duplicatedShifts).toEqual([mockShift]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle duplication errors', async () => {
    const duplicationRequest: ShiftDuplicationRequest = {
      source_shift_ids: [1],
      target_dates: ['2024-01-16']
    };

    const error = new Error('Duplication failed');
    mockShiftsApiService.duplicateShifts.mockRejectedValue(error);

    const { result } = renderHook(() => useShiftDuplication(), {
      wrapper: createWrapper()
    });

    await expect(result.current.duplicateShifts(duplicationRequest)).rejects.toThrow('Duplication failed');
    
    await waitFor(() => {
      expect(result.current.error).toBe('Duplication failed');
    });
  });
});

describe('useBulkShiftCreation', () => {
  const mockBulkRequest: BulkShiftCreationRequest = {
    employee_ids: [1, 2],
    dates: ['2024-01-15', '2024-01-16'],
    start_time: '09:00',
    end_time: '17:00',
    notes: 'Bulk created shift'
  };

  const mockPreview = {
    total_shifts: 4,
    shifts_to_create: [
      {
        employee_id: 1,
        employee_name: 'John Doe',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00'
      }
    ],
    conflicts: [],
    warnings: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create bulk shifts successfully', async () => {
    const mockShifts: Shift[] = [
      {
        id: 1,
        company_employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00',
        notes: 'Bulk created shift',
        status: 'confirmed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        company_employee: {
          id: 1,
          company_id: 1,
          user_id: 1,
          role_id: 1,
          position: 'Developer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }
    ];

    mockShiftsApiService.createBulkShifts.mockResolvedValue(mockShifts);

    const { result } = renderHook(() => useBulkShiftCreation(), {
      wrapper: createWrapper()
    });

    const createdShifts = await result.current.createBulkShifts(mockBulkRequest);

    expect(mockShiftsApiService.createBulkShifts).toHaveBeenCalledWith(mockBulkRequest);
    expect(createdShifts).toEqual(mockShifts);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.createError).toBeNull();
  });

  it('should preview bulk shifts successfully', async () => {
    mockShiftsApiService.previewBulkShifts.mockResolvedValue(mockPreview);

    const { result } = renderHook(() => useBulkShiftCreation(), {
      wrapper: createWrapper()
    });

    const preview = await result.current.previewBulkShifts(mockBulkRequest);

    expect(mockShiftsApiService.previewBulkShifts).toHaveBeenCalledWith(mockBulkRequest);
    expect(preview).toEqual(mockPreview);
    expect(result.current.isPreviewing).toBe(false);
    expect(result.current.previewError).toBeNull();
  });

  it('should handle bulk creation errors', async () => {
    const error = new Error('Bulk creation failed');
    mockShiftsApiService.createBulkShifts.mockRejectedValue(error);

    const { result } = renderHook(() => useBulkShiftCreation(), {
      wrapper: createWrapper()
    });

    await expect(result.current.createBulkShifts(mockBulkRequest)).rejects.toThrow('Bulk creation failed');
    
    await waitFor(() => {
      expect(result.current.createError).toBe('Bulk creation failed');
    });
  });

  it('should handle preview errors', async () => {
    const error = new Error('Preview failed');
    mockShiftsApiService.previewBulkShifts.mockRejectedValue(error);

    const { result } = renderHook(() => useBulkShiftCreation(), {
      wrapper: createWrapper()
    });

    await expect(result.current.previewBulkShifts(mockBulkRequest)).rejects.toThrow('Preview failed');
    
    await waitFor(() => {
      expect(result.current.previewError).toBe('Preview failed');
    });
  });
});

describe('useConflictValidation', () => {
  const mockValidationRequest: ConflictValidationRequest = {
    shifts: [
      {
        company_employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00'
      }
    ]
  };

  const mockValidationResponse = {
    has_conflicts: false,
    conflicts: [],
    total_conflicts: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate conflicts successfully', async () => {
    mockShiftsApiService.validateConflicts.mockResolvedValue(mockValidationResponse);

    const { result } = renderHook(() => useConflictValidation(), {
      wrapper: createWrapper()
    });

    const response = await result.current.validateConflicts(mockValidationRequest);

    expect(mockShiftsApiService.validateConflicts).toHaveBeenCalledWith(mockValidationRequest);
    expect(response).toEqual(mockValidationResponse);
    expect(result.current.isValidating).toBe(false);
  });

  it('should handle validation errors', async () => {
    const error = new Error('Validation failed');
    mockShiftsApiService.validateConflicts.mockRejectedValue(error);

    const { result } = renderHook(() => useConflictValidation(), {
      wrapper: createWrapper()
    });

    await expect(result.current.validateConflicts(mockValidationRequest)).rejects.toThrow('Validation failed');
    expect(result.current.isValidating).toBe(false);
  });

  it('should track validation state', async () => {
    mockShiftsApiService.validateConflicts.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockValidationResponse), 100))
    );

    const { result } = renderHook(() => useConflictValidation(), {
      wrapper: createWrapper()
    });

    const validationPromise = result.current.validateConflicts(mockValidationRequest);
    
    // Should be validating
    expect(result.current.isValidating).toBe(true);

    await validationPromise;

    // Should no longer be validating
    expect(result.current.isValidating).toBe(false);
  });
});

describe('useEmployeePatterns', () => {
  const mockPatternResponse = {
    employee_id: 1,
    patterns: [
      {
        id: 1,
        company_employee_id: 1,
        start_time: '09:00',
        end_time: '17:00',
        frequency_count: 5,
        last_used: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    suggestions: [
      {
        start_time: '09:00',
        end_time: '17:00',
        frequency: 5,
        source: 'pattern' as const,
        label: 'Most frequent pattern'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch employee patterns when employeeId is provided', async () => {
    mockShiftsApiService.getEmployeePatterns.mockResolvedValue(mockPatternResponse);

    const { result } = renderHook(() => useEmployeePatterns(1), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockShiftsApiService.getEmployeePatterns).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(mockPatternResponse);
  });

  it('should not fetch when employeeId is null', () => {
    const { result } = renderHook(() => useEmployeePatterns(null), {
      wrapper: createWrapper()
    });

    expect(mockShiftsApiService.getEmployeePatterns).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useTimeSuggestions', () => {
  const mockSuggestionRequest: SuggestionRequest = {
    employee_id: 1,
    date: '2024-01-15',
    limit: 5
  };

  const mockSuggestions = [
    {
      start_time: '09:00',
      end_time: '17:00',
      frequency: 5,
      source: 'pattern' as const,
      label: 'Most frequent'
    },
    {
      start_time: '10:00',
      end_time: '18:00',
      frequency: 3,
      source: 'template' as const,
      label: 'Template suggestion'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch time suggestions when request is provided', async () => {
    mockShiftsApiService.getTimeSuggestions.mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useTimeSuggestions(mockSuggestionRequest), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockShiftsApiService.getTimeSuggestions).toHaveBeenCalledWith(mockSuggestionRequest);
    expect(result.current.data).toEqual(mockSuggestions);
  });

  it('should not fetch when request is null', () => {
    const { result } = renderHook(() => useTimeSuggestions(null), {
      wrapper: createWrapper()
    });

    expect(mockShiftsApiService.getTimeSuggestions).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when employee_id is missing', () => {
    const invalidRequest = { date: '2024-01-15', limit: 5 } as SuggestionRequest;
    
    const { result } = renderHook(() => useTimeSuggestions(invalidRequest), {
      wrapper: createWrapper()
    });

    expect(mockShiftsApiService.getTimeSuggestions).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useEnhancedShifts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should combine all enhanced shift operations', () => {
    const { result } = renderHook(() => useEnhancedShifts(), {
      wrapper: createWrapper()
    });

    // Should have all the expected methods and properties
    expect(typeof result.current.duplicateShifts).toBe('function');
    expect(typeof result.current.createBulkShifts).toBe('function');
    expect(typeof result.current.previewBulkShifts).toBe('function');
    expect(typeof result.current.validateConflicts).toBe('function');

    expect(typeof result.current.isDuplicating).toBe('boolean');
    expect(typeof result.current.isBulkCreating).toBe('boolean');
    expect(typeof result.current.isBulkPreviewing).toBe('boolean');
    expect(typeof result.current.isValidatingConflicts).toBe('boolean');

    expect(result.current.duplicationError).toBeNull();
    expect(result.current.bulkCreateError).toBeNull();
    expect(result.current.bulkPreviewError).toBeNull();
  });

  it('should handle all operations independently', async () => {
    mockShiftsApiService.duplicateShifts.mockResolvedValue([]);
    mockShiftsApiService.createBulkShifts.mockResolvedValue([]);
    mockShiftsApiService.previewBulkShifts.mockResolvedValue({
      total_shifts: 0,
      shifts_to_create: [],
      conflicts: [],
      warnings: []
    });
    mockShiftsApiService.validateConflicts.mockResolvedValue({
      has_conflicts: false,
      conflicts: [],
      total_conflicts: 0
    });

    const { result } = renderHook(() => useEnhancedShifts(), {
      wrapper: createWrapper()
    });

    // Test all operations
    await result.current.duplicateShifts({ source_shift_ids: [1] });
    await result.current.createBulkShifts({
      employee_ids: [1],
      dates: ['2024-01-15'],
      start_time: '09:00',
      end_time: '17:00'
    });
    await result.current.previewBulkShifts({
      employee_ids: [1],
      dates: ['2024-01-15'],
      start_time: '09:00',
      end_time: '17:00'
    });
    await result.current.validateConflicts({
      shifts: [{
        company_employee_id: 1,
        shift_date: '2024-01-15',
        start_time: '09:00',
        end_time: '17:00'
      }]
    });

    expect(mockShiftsApiService.duplicateShifts).toHaveBeenCalled();
    expect(mockShiftsApiService.createBulkShifts).toHaveBeenCalled();
    expect(mockShiftsApiService.previewBulkShifts).toHaveBeenCalled();
    expect(mockShiftsApiService.validateConflicts).toHaveBeenCalled();
  });
});
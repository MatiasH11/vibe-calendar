/**
 * Integration Tests for Shift Templates and Shortcuts Workflow
 * Tests complete user workflows with all features enabled
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock components and services
import { ShiftTemplateManager } from '@/components/shifts/templates/ShiftTemplateManager';
import { EnhancedShiftForm } from '@/components/shifts/forms/EnhancedShiftForm';
import { BulkShiftForm } from '@/components/shifts/duplication/BulkShiftForm';
import { ShiftsView } from '@/components/shifts/ShiftsView';
import { NotificationProvider } from '@/components/ui/notification-system';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';

// Mock API services
vi.mock('@/lib/shift-templates', () => ({
  shiftTemplatesApiService: {
    getTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    incrementUsage: vi.fn(),
  },
}));

vi.mock('@/lib/shifts', () => ({
  shiftsApiService: {
    getShifts: vi.fn(),
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn(),
    duplicateShifts: vi.fn(),
    bulkCreateShifts: vi.fn(),
    validateConflicts: vi.fn(),
    getEmployeePatterns: vi.fn(),
    getSuggestions: vi.fn(),
  },
}));

// Mock data
const mockTemplates = [
  {
    id: 1,
    name: 'Morning Shift',
    description: 'Standard morning shift',
    start_time: '09:00',
    end_time: '17:00',
    usage_count: 5,
    company_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Evening Shift',
    description: 'Standard evening shift',
    start_time: '17:00',
    end_time: '01:00',
    usage_count: 3,
    company_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockEmployees = [
  { id: 1, user: { first_name: 'John', last_name: 'Doe' } },
  { id: 2, user: { first_name: 'Jane', last_name: 'Smith' } },
];

const mockShifts = [
  {
    id: 1,
    company_employee_id: 1,
    shift_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    notes: 'Regular shift',
    company_employee: mockEmployees[0],
  },
];

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

describe('Shift Templates and Shortcuts Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.getTemplates)
      .mockResolvedValue(mockTemplates);
    vi.mocked(require('@/lib/shifts').shiftsApiService.getShifts)
      .mockResolvedValue(mockShifts);
    vi.mocked(require('@/lib/shifts').shiftsApiService.validateConflicts)
      .mockResolvedValue({ has_conflicts: false, conflicts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Management Workflow', () => {
    it('should create, edit, and delete templates successfully', async () => {
      const createTemplateMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.createTemplate);
      const updateTemplateMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.updateTemplate);
      const deleteTemplateMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.deleteTemplate);

      createTemplateMock.mockResolvedValue({
        id: 3,
        name: 'Night Shift',
        description: 'Overnight shift',
        start_time: '23:00',
        end_time: '07:00',
        usage_count: 0,
        company_id: 1,
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      render(
        <TestWrapper>
          <ShiftTemplateManager />
        </TestWrapper>
      );

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      });

      // Create new template
      const createButton = screen.getByRole('button', { name: /create template/i });
      await user.click(createButton);

      // Fill form
      const nameInput = screen.getByLabelText(/template name/i);
      const startTimeInput = screen.getByLabelText(/start time/i);
      const endTimeInput = screen.getByLabelText(/end time/i);

      await user.type(nameInput, 'Night Shift');
      await user.type(startTimeInput, '23:00');
      await user.type(endTimeInput, '07:00');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save template/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(createTemplateMock).toHaveBeenCalledWith({
          name: 'Night Shift',
          start_time: '23:00',
          end_time: '07:00',
          description: undefined,
        });
      });

      // Edit template
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);

      const editNameInput = screen.getByDisplayValue('Morning Shift');
      await user.clear(editNameInput);
      await user.type(editNameInput, 'Updated Morning Shift');

      const updateButton = screen.getByRole('button', { name: /update template/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(updateTemplateMock).toHaveBeenCalledWith(1, {
          name: 'Updated Morning Shift',
        });
      });

      // Delete template
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(deleteTemplateMock).toHaveBeenCalledWith(1);
      });
    });

    it('should handle template creation errors gracefully', async () => {
      const createTemplateMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.createTemplate);
      createTemplateMock.mockRejectedValue(new Error('DUPLICATE_TEMPLATE_NAME'));

      render(
        <TestWrapper>
          <ShiftTemplateManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      });

      // Try to create duplicate template
      const createButton = screen.getByRole('button', { name: /create template/i });
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, 'Morning Shift'); // Duplicate name

      const submitButton = screen.getByRole('button', { name: /save template/i });
      await user.click(submitButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/template with this name already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Shift Form Workflow', () => {
    it('should use templates and show suggestions', async () => {
      const createShiftMock = vi.mocked(require('@/lib/shifts').shiftsApiService.createShift);
      const getSuggestionsMock = vi.mocked(require('@/lib/shifts').shiftsApiService.getSuggestions);
      const incrementUsageMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.incrementUsage);

      getSuggestionsMock.mockResolvedValue([
        { start_time: '09:00', end_time: '17:00', frequency: 5, source: 'template', label: 'Morning Shift' },
        { start_time: '10:00', end_time: '18:00', frequency: 3, source: 'pattern', label: 'Common Pattern' },
      ]);

      createShiftMock.mockResolvedValue({
        id: 2,
        company_employee_id: 1,
        shift_date: '2024-01-16',
        start_time: '09:00',
        end_time: '17:00',
        notes: 'Created from template',
      });

      render(
        <TestWrapper>
          <EnhancedShiftForm
            employees={mockEmployees}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </TestWrapper>
      );

      // Select employee
      const employeeSelect = screen.getByLabelText(/employee/i);
      await user.click(employeeSelect);
      await user.click(screen.getByText('John Doe'));

      // Wait for suggestions to load
      await waitFor(() => {
        expect(getSuggestionsMock).toHaveBeenCalledWith(1);
      });

      // Should show template selector
      expect(screen.getByText(/use template/i)).toBeInTheDocument();

      // Select template
      const templateSelect = screen.getByLabelText(/template/i);
      await user.click(templateSelect);
      await user.click(screen.getByText('Morning Shift'));

      // Should populate form fields
      await waitFor(() => {
        expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
      });

      // Should show suggestions
      expect(screen.getByText('Common Pattern')).toBeInTheDocument();

      // Submit form
      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2024-01-16');

      const submitButton = screen.getByRole('button', { name: /create shift/i });
      await user.click(submitButton);

      // Verify API calls
      await waitFor(() => {
        expect(createShiftMock).toHaveBeenCalled();
        expect(incrementUsageMock).toHaveBeenCalledWith(1);
      });
    });

    it('should validate conflicts in real-time', async () => {
      const validateConflictsMock = vi.mocked(require('@/lib/shifts').shiftsApiService.validateConflicts);
      
      validateConflictsMock.mockResolvedValue({
        has_conflicts: true,
        conflicts: [{
          employee_id: 1,
          date: '2024-01-15',
          conflicting_shifts: [mockShifts[0]],
          conflict_type: 'overlap',
          severity: 'high',
          resolution_suggestions: ['Adjust start or end time'],
        }],
      });

      render(
        <TestWrapper>
          <EnhancedShiftForm
            employees={mockEmployees}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </TestWrapper>
      );

      // Fill form with conflicting data
      const employeeSelect = screen.getByLabelText(/employee/i);
      await user.click(employeeSelect);
      await user.click(screen.getByText('John Doe'));

      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2024-01-15');

      const startTimeInput = screen.getByLabelText(/start time/i);
      await user.type(startTimeInput, '10:00');

      const endTimeInput = screen.getByLabelText(/end time/i);
      await user.type(endTimeInput, '18:00');

      // Should trigger conflict validation
      await waitFor(() => {
        expect(validateConflictsMock).toHaveBeenCalled();
      });

      // Should show conflict warning
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations Workflow', () => {
    it('should create multiple shifts with conflict handling', async () => {
      const bulkCreateMock = vi.mocked(require('@/lib/shifts').shiftsApiService.bulkCreateShifts);
      
      bulkCreateMock.mockResolvedValue({
        successful: [
          { id: 3, company_employee_id: 1, shift_date: '2024-01-16', start_time: '09:00', end_time: '17:00' },
          { id: 4, company_employee_id: 2, shift_date: '2024-01-16', start_time: '09:00', end_time: '17:00' },
        ],
        skipped: [],
        total_requested: 2,
      });

      render(
        <TestWrapper>
          <BulkShiftForm
            employees={mockEmployees}
            templates={mockTemplates}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </TestWrapper>
      );

      // Select multiple employees
      const employeeSelect = screen.getByLabelText(/employees/i);
      await user.click(employeeSelect);
      await user.click(screen.getByText('John Doe'));
      await user.click(screen.getByText('Jane Smith'));

      // Select dates
      const dateInput = screen.getByLabelText(/dates/i);
      await user.type(dateInput, '2024-01-16');

      // Select template
      const templateSelect = screen.getByLabelText(/template/i);
      await user.click(templateSelect);
      await user.click(screen.getByText('Morning Shift'));

      // Preview operation
      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      // Should show preview
      await waitFor(() => {
        expect(screen.getByText(/2 shifts will be created/i)).toBeInTheDocument();
      });

      // Confirm creation
      const confirmButton = screen.getByRole('button', { name: /create shifts/i });
      await user.click(confirmButton);

      // Verify API call
      await waitFor(() => {
        expect(bulkCreateMock).toHaveBeenCalledWith({
          employee_ids: [1, 2],
          dates: ['2024-01-16'],
          template_id: 1,
          conflict_resolution: 'skip',
          preview_only: false,
        });
      });

      // Should show success notification
      await waitFor(() => {
        expect(screen.getByText(/2 shifts created successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should handle keyboard shortcuts correctly', async () => {
      const onNewShift = vi.fn();
      const onDuplicate = vi.fn();

      render(
        <TestWrapper>
          <ShiftsView 
            shifts={mockShifts}
            employees={mockEmployees}
            onNewShift={onNewShift}
            onDuplicate={onDuplicate}
          />
        </TestWrapper>
      );

      // Test Ctrl+N for new shift
      await user.keyboard('{Control>}n{/Control}');
      expect(onNewShift).toHaveBeenCalled();

      // Test Ctrl+D for duplicate (with shift selected)
      const shiftElement = screen.getByText('Regular shift');
      await user.click(shiftElement);
      await user.keyboard('{Control>}d{/Control}');
      expect(onDuplicate).toHaveBeenCalled();

      // Test ? for help
      await user.keyboard('?');
      await waitFor(() => {
        expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
      });

      // Test Escape to close help
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText(/keyboard shortcuts/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const getTemplatesMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.getTemplates);
      getTemplatesMock.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ShiftTemplateManager />
        </TestWrapper>
      );

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/connection problem/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle validation errors with user-friendly messages', async () => {
      const createShiftMock = vi.mocked(require('@/lib/shifts').shiftsApiService.createShift);
      createShiftMock.mockRejectedValue(new Error('SHIFT_OVERLAP'));

      render(
        <TestWrapper>
          <EnhancedShiftForm
            employees={mockEmployees}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </TestWrapper>
      );

      // Fill and submit form
      const employeeSelect = screen.getByLabelText(/employee/i);
      await user.click(employeeSelect);
      await user.click(screen.getByText('John Doe'));

      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2024-01-15');

      const startTimeInput = screen.getByLabelText(/start time/i);
      await user.type(startTimeInput, '09:00');

      const endTimeInput = screen.getByLabelText(/end time/i);
      await user.type(endTimeInput, '17:00');

      const submitButton = screen.getByRole('button', { name: /create shift/i });
      await user.click(submitButton);

      // Should show user-friendly error message
      await waitFor(() => {
        expect(screen.getByText(/conflicts with an existing shift/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should cache template data and avoid unnecessary API calls', async () => {
      const getTemplatesMock = vi.mocked(require('@/lib/shift-templates').shiftTemplatesApiService.getTemplates);
      getTemplatesMock.mockResolvedValue(mockTemplates);

      const { rerender } = render(
        <TestWrapper>
          <ShiftTemplateManager />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      });

      expect(getTemplatesMock).toHaveBeenCalledTimes(1);

      // Rerender component
      rerender(
        <TestWrapper>
          <ShiftTemplateManager />
        </TestWrapper>
      );

      // Should use cached data, not make another API call
      await waitFor(() => {
        expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      });

      // Should still be only 1 call due to caching
      expect(getTemplatesMock).toHaveBeenCalledTimes(1);
    });

    it('should debounce conflict validation to avoid excessive API calls', async () => {
      const validateConflictsMock = vi.mocked(require('@/lib/shifts').shiftsApiService.validateConflicts);
      validateConflictsMock.mockResolvedValue({ has_conflicts: false, conflicts: [] });

      render(
        <TestWrapper>
          <EnhancedShiftForm
            employees={mockEmployees}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        </TestWrapper>
      );

      const startTimeInput = screen.getByLabelText(/start time/i);

      // Type multiple characters quickly
      await user.type(startTimeInput, '09:00');

      // Should debounce and only make one API call
      await waitFor(() => {
        expect(validateConflictsMock).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });
});
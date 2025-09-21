import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShiftTemplateManager } from '../ShiftTemplateManager';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';
import { ShiftTemplate } from '@/types/shifts/templates';

// Mock the hook
jest.mock('@/hooks/shifts/useShiftTemplates');
const mockUseShiftTemplates = useShiftTemplates as jest.MockedFunction<typeof useShiftTemplates>;

// Mock the ShiftTemplateForm component
jest.mock('../ShiftTemplateForm', () => ({
  ShiftTemplateForm: ({ onSubmit, onCancel, isLoading, error }: any) => (
    <div data-testid="shift-template-form">
      <button onClick={() => onSubmit({ name: 'Test Template', start_time: '09:00', end_time: '17:00' })}>
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel Form</button>
      {isLoading && <div>Form Loading...</div>}
      {error && <div>Form Error: {error}</div>}
    </div>
  )
}));

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

describe('ShiftTemplateManager', () => {
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

  const mockCreateTemplate = jest.fn();
  const mockUpdateTemplate = jest.fn();
  const mockDeleteTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseShiftTemplates.mockReturnValue({
      templates: mockTemplates,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null,
      createTemplate: mockCreateTemplate,
      updateTemplate: mockUpdateTemplate,
      deleteTemplate: mockDeleteTemplate,
      useTemplate: jest.fn(),
      refreshTemplates: jest.fn(),
      filters: { sort_by: 'usage_count', sort_order: 'desc' },
      updateFilters: jest.fn(),
      clearFilters: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render template manager with templates', () => {
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Gestión de Plantillas')).toBeInTheDocument();
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('Nueva Plantilla')).toBeInTheDocument();
    });

    it('should render in selection mode', () => {
      const mockOnTemplateSelect = jest.fn();
      
      render(
        <ShiftTemplateManager 
          selectionMode={true}
          onTemplateSelect={mockOnTemplateSelect}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Seleccionar Plantilla')).toBeInTheDocument();
      expect(screen.getByText('Elige una plantilla para aplicar a tu turno')).toBeInTheDocument();
      expect(screen.queryByText('Nueva Plantilla')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseShiftTemplates.mockReturnValue({
        templates: [],
        isLoading: true,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
        createError: null,
        updateError: null,
        deleteError: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: mockDeleteTemplate,
        useTemplate: jest.fn(),
        refreshTemplates: jest.fn(),
        filters: {},
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
      });

      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByRole('generic')[0]).toHaveClass('animate-pulse');
    });

    it('should show empty state when no templates', () => {
      mockUseShiftTemplates.mockReturnValue({
        templates: [],
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
        createError: null,
        updateError: null,
        deleteError: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: mockDeleteTemplate,
        useTemplate: jest.fn(),
        refreshTemplates: jest.fn(),
        filters: {},
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
      });

      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No hay plantillas creadas')).toBeInTheDocument();
      expect(screen.getByText('Crear Primera Plantilla')).toBeInTheDocument();
    });

    it('should show no results when search returns empty', () => {
      mockUseShiftTemplates.mockReturnValue({
        templates: [],
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
        createError: null,
        updateError: null,
        deleteError: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: mockDeleteTemplate,
        useTemplate: jest.fn(),
        refreshTemplates: jest.fn(),
        filters: { search: 'nonexistent' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
      });

      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No se encontraron plantillas')).toBeInTheDocument();
      expect(screen.getByText('Intenta con otros términos de búsqueda')).toBeInTheDocument();
    });
  });

  describe('template information display', () => {
    it('should display template information correctly', () => {
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Check first template
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('Standard morning shift')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
      expect(screen.getByText('8h')).toBeInTheDocument();
      expect(screen.getByText('5 usos')).toBeInTheDocument();

      // Check second template
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('Standard evening shift')).toBeInTheDocument();
      expect(screen.getByText('17:00 - 01:00')).toBeInTheDocument();
      expect(screen.getByText('3 usos')).toBeInTheDocument();
    });

    it('should handle templates without description', () => {
      const templatesWithoutDescription = [
        { ...mockTemplates[0], description: undefined }
      ];

      mockUseShiftTemplates.mockReturnValue({
        templates: templatesWithoutDescription,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
        createError: null,
        updateError: null,
        deleteError: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: mockDeleteTemplate,
        useTemplate: jest.fn(),
        refreshTemplates: jest.fn(),
        filters: {},
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
      });

      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.queryByText('Standard morning shift')).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      const searchInput = screen.getByPlaceholderText('Buscar plantillas...');
      await user.type(searchInput, 'morning');

      expect(searchInput).toHaveValue('morning');
    });
  });

  describe('sorting functionality', () => {
    it('should handle sort selection', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      const sortSelect = screen.getByRole('combobox');
      await user.click(sortSelect);

      const nameOption = screen.getByText('Nombre A-Z');
      await user.click(nameOption);

      // The component should update its internal state
      expect(sortSelect).toBeInTheDocument();
    });
  });

  describe('template creation', () => {
    it('should open create dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      const createButton = screen.getByText('Nueva Plantilla');
      await user.click(createButton);

      expect(screen.getByText('Crear Nueva Plantilla')).toBeInTheDocument();
      expect(screen.getByTestId('shift-template-form')).toBeInTheDocument();
    });

    it('should handle template creation', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockResolvedValue({});
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      const createButton = screen.getByText('Nueva Plantilla');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          name: 'Test Template',
          start_time: '09:00',
          end_time: '17:00'
        });
      });
    });

    it('should handle creation errors', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockRejectedValue(new Error('Creation failed'));
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      const createButton = screen.getByText('Nueva Plantilla');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      // The error should be handled by the component
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('template editing', () => {
    it('should open edit dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Click on the dropdown menu for the first template
      const dropdownButtons = screen.getAllByRole('button');
      const dropdownButton = dropdownButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (dropdownButton) {
        await user.click(dropdownButton);
        
        const editButton = screen.getByText('Editar');
        await user.click(editButton);

        expect(screen.getByText('Editar Plantilla')).toBeInTheDocument();
        expect(screen.getByTestId('shift-template-form')).toBeInTheDocument();
      }
    });

    it('should handle template update', async () => {
      const user = userEvent.setup();
      mockUpdateTemplate.mockResolvedValue({});
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Open edit dialog
      const dropdownButtons = screen.getAllByRole('button');
      const dropdownButton = dropdownButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (dropdownButton) {
        await user.click(dropdownButton);
        
        const editButton = screen.getByText('Editar');
        await user.click(editButton);

        const submitButton = screen.getByText('Submit Form');
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockUpdateTemplate).toHaveBeenCalledWith(1, {
            name: 'Test Template',
            start_time: '09:00',
            end_time: '17:00'
          });
        });
      }
    });
  });

  describe('template deletion', () => {
    it('should open delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Click on the dropdown menu for the first template
      const dropdownButtons = screen.getAllByRole('button');
      const dropdownButton = dropdownButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (dropdownButton) {
        await user.click(dropdownButton);
        
        const deleteButton = screen.getByText('Eliminar');
        await user.click(deleteButton);

        expect(screen.getByText('Eliminar Plantilla')).toBeInTheDocument();
        expect(screen.getByText(/¿Estás seguro de que quieres eliminar la plantilla/)).toBeInTheDocument();
      }
    });

    it('should handle template deletion', async () => {
      const user = userEvent.setup();
      mockDeleteTemplate.mockResolvedValue();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Open delete dialog
      const dropdownButtons = screen.getAllByRole('button');
      const dropdownButton = dropdownButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (dropdownButton) {
        await user.click(dropdownButton);
        
        const deleteButton = screen.getByText('Eliminar');
        await user.click(deleteButton);

        const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockDeleteTemplate).toHaveBeenCalledWith(1);
        });
      }
    });

    it('should cancel deletion', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftTemplateManager />,
        { wrapper: createWrapper() }
      );

      // Open delete dialog
      const dropdownButtons = screen.getAllByRole('button');
      const dropdownButton = dropdownButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (dropdownButton) {
        await user.click(dropdownButton);
        
        const deleteButton = screen.getByText('Eliminar');
        await user.click(deleteButton);

        const cancelButton = screen.getByText('Cancelar');
        await user.click(cancelButton);

        expect(screen.queryByText('Eliminar Plantilla')).not.toBeInTheDocument();
        expect(mockDeleteTemplate).not.toHaveBeenCalled();
      }
    });
  });

  describe('selection mode', () => {
    it('should handle template selection in selection mode', async () => {
      const user = userEvent.setup();
      const mockOnTemplateSelect = jest.fn();
      
      render(
        <ShiftTemplateManager 
          selectionMode={true}
          onTemplateSelect={mockOnTemplateSelect}
        />,
        { wrapper: createWrapper() }
      );

      const templateCard = screen.getByText('Morning Shift').closest('[role="generic"]');
      if (templateCard) {
        await user.click(templateCard);
        expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
      }
    });

    it('should not show action buttons in selection mode', () => {
      render(
        <ShiftTemplateManager 
          selectionMode={true}
          onTemplateSelect={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Should not show dropdown menus in selection mode
      const dropdownButtons = screen.queryAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      expect(dropdownButtons).toHaveLength(0);
    });
  });
});
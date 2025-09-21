import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShiftTemplateForm } from '../ShiftTemplateForm';
import { ShiftTemplate } from '@/types/shifts/templates';

describe('ShiftTemplateForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render form fields correctly', () => {
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Nombre de la Plantilla *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción (Opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora de Inicio *')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora de Fin *')).toBeInTheDocument();
    expect(screen.getByText('Crear Plantilla')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('should populate form with initial data', () => {
    const initialData: Partial<ShiftTemplate> = {
      id: 1,
      name: 'Morning Shift',
      description: 'Standard morning shift',
      start_time: '09:00',
      end_time: '17:00',
    };

    render(
      <ShiftTemplateForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Morning Shift')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Standard morning shift')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
    expect(screen.getByText('Actualizar Plantilla')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Crear Plantilla');
    await user.click(submitButton);

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(screen.getByText('La hora de inicio es requerida')).toBeInTheDocument();
    expect(screen.getByText('La hora de fin es requerida')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate name length', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    
    // Test minimum length
    await user.type(nameInput, 'A');
    await user.click(screen.getByText('Crear Plantilla'));
    
    expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();

    // Test maximum length
    await user.clear(nameInput);
    await user.type(nameInput, 'A'.repeat(101));
    await user.click(screen.getByText('Crear Plantilla'));
    
    expect(screen.getByText('El nombre no puede exceder 100 caracteres')).toBeInTheDocument();
  });

  it('should validate time format', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(nameInput, 'Test Shift');
    await user.type(startTimeInput, '25:00'); // Invalid hour
    await user.type(endTimeInput, '17:60'); // Invalid minute

    await user.click(screen.getByText('Crear Plantilla'));

    expect(screen.getAllByText('Formato de hora inválido')).toHaveLength(2);
  });

  it('should validate time range', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(nameInput, 'Test Shift');
    await user.type(startTimeInput, '17:00');
    await user.type(endTimeInput, '09:00'); // End before start

    await user.click(screen.getByText('Crear Plantilla'));

    expect(screen.getByText('La hora de fin debe ser posterior a la hora de inicio')).toBeInTheDocument();
  });

  it('should validate minimum duration', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(nameInput, 'Test Shift');
    await user.type(startTimeInput, '09:00');
    await user.type(endTimeInput, '09:15'); // Only 15 minutes

    await user.click(screen.getByText('Crear Plantilla'));

    expect(screen.getByText('El turno debe durar al menos 30 minutos')).toBeInTheDocument();
  });

  it('should show duration preview', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(startTimeInput, '09:00');
    await user.type(endTimeInput, '17:30');

    expect(screen.getByText('Vista previa:')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 17:30')).toBeInTheDocument();
    expect(screen.getByText('(8h 30m)')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    const descriptionInput = screen.getByLabelText('Descripción (Opcional)');
    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(nameInput, 'Morning Shift');
    await user.type(descriptionInput, 'Standard morning shift');
    await user.type(startTimeInput, '09:00');
    await user.type(endTimeInput, '17:00');

    await user.click(screen.getByText('Crear Plantilla'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Morning Shift',
        description: 'Standard morning shift',
        start_time: '09:00',
        end_time: '17:00',
      });
    });
  });

  it('should handle form submission error', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    const startTimeInput = screen.getByLabelText('Hora de Inicio *');
    const endTimeInput = screen.getByLabelText('Hora de Fin *');

    await user.type(nameInput, 'Test Shift');
    await user.type(startTimeInput, '09:00');
    await user.type(endTimeInput, '17:00');

    await user.click(screen.getByText('Crear Plantilla'));

    await waitFor(() => {
      expect(screen.getByText('Error al guardar la plantilla. Inténtalo de nuevo.')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('Creando...')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la Plantilla *')).toBeDisabled();
    expect(screen.getByLabelText('Hora de Inicio *')).toBeDisabled();
    expect(screen.getByLabelText('Hora de Fin *')).toBeDisabled();
  });

  it('should show external error', () => {
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error="External error message"
      />
    );

    expect(screen.getByText('External error message')).toBeInTheDocument();
  });

  it('should handle cancel with confirmation when form is dirty', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Make form dirty
    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    await user.type(nameInput, 'Test');

    // Click cancel
    await user.click(screen.getByText('Cancelar'));

    expect(global.confirm).toHaveBeenCalledWith(
      '¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.'
    );
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should not cancel when user rejects confirmation', async () => {
    const user = userEvent.setup();
    (global.confirm as jest.Mock).mockReturnValue(false);
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Make form dirty
    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    await user.type(nameInput, 'Test');

    // Click cancel
    await user.click(screen.getByText('Cancelar'));

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Trigger validation error
    await user.click(screen.getByText('Crear Plantilla'));
    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();

    // Start typing to clear error
    const nameInput = screen.getByLabelText('Nombre de la Plantilla *');
    await user.type(nameInput, 'T');

    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
  });

  it('should show character count for description', async () => {
    const user = userEvent.setup();
    
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const descriptionInput = screen.getByLabelText('Descripción (Opcional)');
    await user.type(descriptionInput, 'Test description');

    expect(screen.getByText('16/500 caracteres')).toBeInTheDocument();
  });

  it('should disable submit button when form is not dirty', () => {
    render(
      <ShiftTemplateForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Crear Plantilla');
    expect(submitButton).toBeDisabled();
  });
});
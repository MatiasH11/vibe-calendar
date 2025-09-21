import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConflictValidator } from '../ConflictValidator';
import { ConflictInfo } from '@/types/shifts/templates';

describe('ConflictValidator', () => {
  const mockConflicts: ConflictInfo[] = [
    {
      employee_id: 1,
      employee_name: 'Juan Pérez',
      date: '2024-01-15',
      conflicting_shifts: [
        {
          id: 1,
          start_time: '09:00',
          end_time: '17:00',
          notes: 'Turno regular'
        },
        {
          id: 2,
          start_time: '15:00',
          end_time: '23:00',
          notes: 'Turno extra'
        }
      ],
      suggested_alternatives: [
        {
          start_time: '07:00',
          end_time: '15:00',
          reason: 'Disponible'
        },
        {
          start_time: '23:00',
          end_time: '07:00',
          reason: 'Turno nocturno'
        }
      ]
    },
    {
      employee_id: 2,
      employee_name: 'María García',
      date: '2024-01-16',
      conflicting_shifts: [
        {
          id: 3,
          start_time: '10:00',
          end_time: '18:00'
        }
      ],
      suggested_alternatives: []
    }
  ];

  const mockOnAlternativeSelect = jest.fn();
  const mockOnConflictResolve = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering states', () => {
    it('should show validating state', () => {
      render(
        <ConflictValidator
          conflicts={[]}
          isValidating={true}
        />
      );

      expect(screen.getByText('Validando conflictos...')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    it('should show no conflicts state', () => {
      render(
        <ConflictValidator
          conflicts={[]}
          isValidating={false}
        />
      );

      expect(screen.getByText('No se detectaron conflictos de horarios')).toBeInTheDocument();
    });

    it('should show conflicts when present', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.getByText('Se detectaron 2 conflictos de horarios')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('should show single conflict correctly', () => {
      render(
        <ConflictValidator
          conflicts={[mockConflicts[0]]}
          isValidating={false}
        />
      );

      expect(screen.getByText('Se detectaron 1 conflicto de horarios')).toBeInTheDocument();
    });
  });

  describe('conflict details', () => {
    it('should display employee information', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      // Check that dates are formatted (exact format may vary by locale)
      expect(screen.getByText(/15/)).toBeInTheDocument();
      expect(screen.getByText(/16/)).toBeInTheDocument();
    });

    it('should display conflicting shifts', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('3:00 PM - 11:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument();
    });

    it('should display shift notes when available', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.getByText(/Turno regular/)).toBeInTheDocument();
      expect(screen.getByText(/Turno extra/)).toBeInTheDocument();
    });
  });

  describe('alternative suggestions', () => {
    it('should display alternative suggestions', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          onAlternativeSelect={mockOnAlternativeSelect}
          showAlternatives={true}
        />
      );

      expect(screen.getByText('Horarios alternativos sugeridos:')).toBeInTheDocument();
      expect(screen.getByText('7:00 AM - 3:00 PM')).toBeInTheDocument();
      expect(screen.getByText('11:00 PM - 7:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Disponible')).toBeInTheDocument();
      expect(screen.getByText('Turno nocturno')).toBeInTheDocument();
    });

    it('should handle alternative selection', async () => {
      const user = userEvent.setup();
      
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          onAlternativeSelect={mockOnAlternativeSelect}
          showAlternatives={true}
        />
      );

      const alternativeButton = screen.getByText('7:00 AM - 3:00 PM').closest('button');
      if (alternativeButton) {
        await user.click(alternativeButton);
        
        expect(mockOnAlternativeSelect).toHaveBeenCalledWith(1, {
          start_time: '07:00',
          end_time: '15:00',
          reason: 'Disponible'
        });
      }
    });

    it('should hide alternatives when showAlternatives is false', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          showAlternatives={false}
        />
      );

      expect(screen.queryByText('Horarios alternativos sugeridos:')).not.toBeInTheDocument();
    });

    it('should not show alternatives section when no alternatives exist', () => {
      render(
        <ConflictValidator
          conflicts={[mockConflicts[1]]} // María García has no alternatives
          isValidating={false}
          showAlternatives={true}
        />
      );

      expect(screen.queryByText('Horarios alternativos sugeridos:')).not.toBeInTheDocument();
    });
  });

  describe('conflict resolution', () => {
    it('should show resolution actions when onConflictResolve is provided', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          onConflictResolve={mockOnConflictResolve}
        />
      );

      expect(screen.getByText('¿Cómo deseas proceder con estos conflictos?')).toBeInTheDocument();
      expect(screen.getByText('Resolver manualmente')).toBeInTheDocument();
    });

    it('should handle conflict resolution', async () => {
      const user = userEvent.setup();
      
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          onConflictResolve={mockOnConflictResolve}
        />
      );

      const resolveButton = screen.getByText('Resolver manualmente');
      await user.click(resolveButton);

      expect(mockOnConflictResolve).toHaveBeenCalledWith(mockConflicts);
    });

    it('should not show resolution actions when onConflictResolve is not provided', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.queryByText('¿Cómo deseas proceder con estos conflictos?')).not.toBeInTheDocument();
      expect(screen.queryByText('Resolver manualmente')).not.toBeInTheDocument();
    });
  });

  describe('help text', () => {
    it('should show help text when conflicts exist', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      expect(screen.getByText(/Los conflictos ocurren cuando hay solapamiento de horarios/)).toBeInTheDocument();
    });

    it('should not show help text when no conflicts', () => {
      render(
        <ConflictValidator
          conflicts={[]}
          isValidating={false}
        />
      );

      expect(screen.queryByText(/Los conflictos ocurren cuando hay solapamiento de horarios/)).not.toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format times correctly for AM/PM', () => {
      const morningConflict: ConflictInfo = {
        employee_id: 1,
        employee_name: 'Test Employee',
        date: '2024-01-15',
        conflicting_shifts: [
          {
            id: 1,
            start_time: '08:30',
            end_time: '16:45'
          }
        ],
        suggested_alternatives: []
      };

      render(
        <ConflictValidator
          conflicts={[morningConflict]}
          isValidating={false}
        />
      );

      expect(screen.getByText('8:30 AM - 4:45 PM')).toBeInTheDocument();
    });

    it('should handle midnight and noon correctly', () => {
      const midnightConflict: ConflictInfo = {
        employee_id: 1,
        employee_name: 'Test Employee',
        date: '2024-01-15',
        conflicting_shifts: [
          {
            id: 1,
            start_time: '00:00',
            end_time: '12:00'
          }
        ],
        suggested_alternatives: []
      };

      render(
        <ConflictValidator
          conflicts={[midnightConflict]}
          isValidating={false}
        />
      );

      expect(screen.getByText('12:00 AM - 12:00 PM')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
        />
      );

      // Check for alert role
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <ConflictValidator
          conflicts={mockConflicts}
          isValidating={false}
          onAlternativeSelect={mockOnAlternativeSelect}
          showAlternatives={true}
        />
      );

      // Tab to the first alternative button
      await user.tab();
      const firstAlternative = screen.getByText('7:00 AM - 3:00 PM').closest('button');
      
      if (firstAlternative) {
        expect(firstAlternative).toHaveFocus();
        
        // Press Enter to select
        await user.keyboard('{Enter}');
        expect(mockOnAlternativeSelect).toHaveBeenCalled();
      }
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ConflictValidator
          conflicts={[]}
          isValidating={false}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
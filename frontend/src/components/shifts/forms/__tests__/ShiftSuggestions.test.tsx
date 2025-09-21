import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShiftSuggestions } from '../ShiftSuggestions';
import { TimeSuggestion } from '@/types/shifts/templates';

describe('ShiftSuggestions', () => {
  const mockSuggestions: TimeSuggestion[] = [
    {
      start_time: '09:00',
      end_time: '17:00',
      frequency: 5,
      source: 'template',
      label: 'Turno Mañana',
      template_id: 1
    },
    {
      start_time: '14:00',
      end_time: '22:00',
      frequency: 3,
      source: 'pattern',
      label: 'Patrón frecuente',
      pattern_id: 2
    },
    {
      start_time: '22:00',
      end_time: '06:00',
      frequency: 1,
      source: 'recent',
      label: 'Usado recientemente'
    },
    {
      start_time: '10:30',
      end_time: '14:30',
      frequency: 1,
      source: 'template',
      label: 'Turno corto'
    }
  ];

  const mockOnSuggestionSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering states', () => {
    it('should show loading state', () => {
      render(
        <ShiftSuggestions
          suggestions={[]}
          onSuggestionSelect={mockOnSuggestionSelect}
          isLoading={true}
        />
      );

      expect(screen.getByText('Cargando sugerencias...')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    it('should show empty state when no suggestions', () => {
      render(
        <ShiftSuggestions
          suggestions={[]}
          onSuggestionSelect={mockOnSuggestionSelect}
          isLoading={false}
        />
      );

      expect(screen.getByText('No hay sugerencias disponibles')).toBeInTheDocument();
    });

    it('should show suggestions when available', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
          isLoading={false}
        />
      );

      expect(screen.getByText('Sugerencias de horarios')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10:00 PM - 6:00 AM')).toBeInTheDocument();
      expect(screen.getByText('10:30 AM - 2:30 PM')).toBeInTheDocument();
    });
  });

  describe('suggestion display', () => {
    it('should display suggestion labels correctly', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText(/Turno Mañana/)).toBeInTheDocument();
      expect(screen.getByText(/Patrón frecuente/)).toBeInTheDocument();
      expect(screen.getByText(/Usado recientemente/)).toBeInTheDocument();
      expect(screen.getByText(/Turno corto/)).toBeInTheDocument();
    });

    it('should show frequency badges for suggestions with frequency > 1', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('5x')).toBeInTheDocument();
      expect(screen.getByText('3x')).toBeInTheDocument();
      // Frequency 1 should not show badge
      expect(screen.queryByText('1x')).not.toBeInTheDocument();
    });

    it('should display source badges correctly', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getAllByText('Plantilla')).toHaveLength(2);
      expect(screen.getByText('Patrón')).toBeInTheDocument();
      expect(screen.getByText('Reciente')).toBeInTheDocument();
    });

    it('should calculate and display duration correctly', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText(/8h/)).toBeInTheDocument(); // 9:00-17:00
      expect(screen.getByText(/4h/)).toBeInTheDocument(); // 10:30-14:30
    });

    it('should handle overnight shifts duration correctly', () => {
      const overnightSuggestion: TimeSuggestion = {
        start_time: '22:00',
        end_time: '06:00',
        frequency: 1,
        source: 'template',
        label: 'Turno nocturno'
      };

      render(
        <ShiftSuggestions
          suggestions={[overnightSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText(/8h/)).toBeInTheDocument(); // 22:00-06:00 = 8 hours
    });

    it('should handle minutes-only duration', () => {
      const shortSuggestion: TimeSuggestion = {
        start_time: '10:00',
        end_time: '10:30',
        frequency: 1,
        source: 'template',
        label: 'Turno muy corto'
      };

      render(
        <ShiftSuggestions
          suggestions={[shortSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText(/30m/)).toBeInTheDocument();
    });

    it('should handle mixed hours and minutes duration', () => {
      const mixedSuggestion: TimeSuggestion = {
        start_time: '09:15',
        end_time: '17:45',
        frequency: 1,
        source: 'template',
        label: 'Turno mixto'
      };

      render(
        <ShiftSuggestions
          suggestions={[mixedSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText(/8h 30m/)).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format AM times correctly', () => {
      const amSuggestion: TimeSuggestion = {
        start_time: '08:30',
        end_time: '11:45',
        frequency: 1,
        source: 'template',
        label: 'Morning shift'
      };

      render(
        <ShiftSuggestions
          suggestions={[amSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('8:30 AM - 11:45 AM')).toBeInTheDocument();
    });

    it('should format PM times correctly', () => {
      const pmSuggestion: TimeSuggestion = {
        start_time: '13:15',
        end_time: '18:30',
        frequency: 1,
        source: 'template',
        label: 'Afternoon shift'
      };

      render(
        <ShiftSuggestions
          suggestions={[pmSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('1:15 PM - 6:30 PM')).toBeInTheDocument();
    });

    it('should handle midnight and noon correctly', () => {
      const midnightNoonSuggestion: TimeSuggestion = {
        start_time: '00:00',
        end_time: '12:00',
        frequency: 1,
        source: 'template',
        label: 'Midnight to noon'
      };

      render(
        <ShiftSuggestions
          suggestions={[midnightNoonSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('12:00 AM - 12:00 PM')).toBeInTheDocument();
    });
  });

  describe('suggestion selection', () => {
    it('should handle suggestion selection', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      const firstSuggestion = screen.getByText('9:00 AM - 5:00 PM').closest('button');
      if (firstSuggestion) {
        await user.click(firstSuggestion);
        
        expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
      }
    });

    it('should handle multiple suggestion selections', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      // Click first suggestion
      const firstSuggestion = screen.getByText('9:00 AM - 5:00 PM').closest('button');
      if (firstSuggestion) {
        await user.click(firstSuggestion);
      }

      // Click second suggestion
      const secondSuggestion = screen.getByText('2:00 PM - 10:00 PM').closest('button');
      if (secondSuggestion) {
        await user.click(secondSuggestion);
      }

      expect(mockOnSuggestionSelect).toHaveBeenCalledTimes(2);
      expect(mockOnSuggestionSelect).toHaveBeenNthCalledWith(1, mockSuggestions[0]);
      expect(mockOnSuggestionSelect).toHaveBeenNthCalledWith(2, mockSuggestions[1]);
    });
  });

  describe('source icons and colors', () => {
    it('should display correct icons for different sources', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      // Check that icons are rendered (we can't easily test specific icons, but we can check they exist)
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(mockSuggestions.length);
      
      // Each button should have an icon
      buttons.forEach(button => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should apply correct colors for different sources', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      const templateBadges = screen.getAllByText('Plantilla');
      const patternBadge = screen.getByText('Patrón');
      const recentBadge = screen.getByText('Reciente');

      // Check that badges have appropriate classes (colors)
      templateBadges.forEach(badge => {
        expect(badge).toHaveClass('text-blue-800');
      });
      expect(patternBadge).toHaveClass('text-green-800');
      expect(recentBadge).toHaveClass('text-orange-800');
    });
  });

  describe('help text', () => {
    it('should show help text when suggestions are available', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('Haz clic en una sugerencia para aplicar los horarios automáticamente')).toBeInTheDocument();
    });

    it('should not show help text when no suggestions', () => {
      render(
        <ShiftSuggestions
          suggestions={[]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.queryByText('Haz clic en una sugerencia para aplicar los horarios automáticamente')).not.toBeInTheDocument();
    });

    it('should not show help text when loading', () => {
      render(
        <ShiftSuggestions
          suggestions={[]}
          onSuggestionSelect={mockOnSuggestionSelect}
          isLoading={true}
        />
      );

      expect(screen.queryByText('Haz clic en una sugerencia para aplicar los horarios automáticamente')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      // Tab to first suggestion
      await user.tab();
      const firstButton = screen.getByText('9:00 AM - 5:00 PM').closest('button');
      expect(firstButton).toHaveFocus();

      // Press Enter to select
      await user.keyboard('{Enter}');
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should have proper button roles', () => {
      render(
        <ShiftSuggestions
          suggestions={mockSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(mockSuggestions.length);
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ShiftSuggestions
          suggestions={[]}
          onSuggestionSelect={mockOnSuggestionSelect}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('edge cases', () => {
    it('should handle suggestions with missing optional fields', () => {
      const minimalSuggestion: TimeSuggestion = {
        start_time: '09:00',
        end_time: '17:00',
        frequency: 1,
        source: 'template',
        label: 'Minimal suggestion'
        // No template_id or pattern_id
      };

      render(
        <ShiftSuggestions
          suggestions={[minimalSuggestion]}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Minimal suggestion')).toBeInTheDocument();
    });

    it('should handle duplicate suggestions gracefully', () => {
      const duplicateSuggestions: TimeSuggestion[] = [
        {
          start_time: '09:00',
          end_time: '17:00',
          frequency: 1,
          source: 'template',
          label: 'First'
        },
        {
          start_time: '09:00',
          end_time: '17:00',
          frequency: 1,
          source: 'pattern',
          label: 'Second'
        }
      ];

      render(
        <ShiftSuggestions
          suggestions={duplicateSuggestions}
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );

      expect(screen.getAllByText('9:00 AM - 5:00 PM')).toHaveLength(2);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutHelp, CompactShortcutHelp, useShortcutHelp } from '../ShortcutHelp';
import { KeyboardShortcut } from '@/types/shifts/shortcuts';
import { renderHook, act } from '@testing-library/react';

// Mock the hooks
jest.mock('@/hooks/shifts/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(() => ({
    formatShortcutKeys: jest.fn((shortcut) => {
      const parts = [];
      if (shortcut.ctrlKey) parts.push('Ctrl');
      if (shortcut.altKey) parts.push('Alt');
      if (shortcut.shiftKey) parts.push('Shift');
      parts.push(shortcut.key.toUpperCase());
      return parts.join(' + ');
    })
  })),
  useModalShortcuts: jest.fn()
}));

const mockShortcuts: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrlKey: true,
    action: 'CREATE_SHIFT',
    description: 'Create new shift',
    context: 'global'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: 'DUPLICATE_SHIFT',
    description: 'Duplicate shift',
    context: 'global'
  },
  {
    key: 'Escape',
    action: 'ESCAPE_ACTION',
    description: 'Cancel/Close',
    context: 'modal'
  },
  {
    key: 'Enter',
    action: 'SAVE_FORM',
    description: 'Save form',
    context: 'form'
  },
  {
    key: '?',
    action: 'SHOW_HELP',
    description: 'Show help',
    context: 'global'
  },
  {
    key: 'ArrowLeft',
    action: 'NAVIGATE_WEEK_PREV',
    description: 'Previous week',
    context: 'calendar'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: 'FOCUS_SEARCH',
    description: 'Focus search',
    context: 'template-manager'
  }
];

describe('ShortcutHelp', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render help dialog when open', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Press ? to toggle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search shortcuts...')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ShortcutHelp
        isOpen={false}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('should display shortcuts in all shortcuts tab', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    // Should show shortcuts grouped by category
    expect(screen.getByText('Create new shift')).toBeInTheDocument();
    expect(screen.getByText('Duplicate shift')).toBeInTheDocument();
    expect(screen.getByText('Cancel/Close')).toBeInTheDocument();
    expect(screen.getByText('Save form')).toBeInTheDocument();
  });

  it('should filter shortcuts by search query', async () => {
    const user = userEvent.setup();
    
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    await user.type(searchInput, 'create');

    expect(screen.getByText('Create new shift')).toBeInTheDocument();
    expect(screen.queryByText('Duplicate shift')).not.toBeInTheDocument();
  });

  it('should show context-specific shortcuts in context tab', async () => {
    const user = userEvent.setup();
    
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        currentContext="modal"
        shortcuts={mockShortcuts}
      />
    );

    const contextTab = screen.getByText('Current Context');
    await user.click(contextTab);

    expect(screen.getByText('Modal Context')).toBeInTheDocument();
    expect(screen.getByText('Cancel/Close')).toBeInTheDocument();
    // Should also show global shortcuts
    expect(screen.getByText('Create new shift')).toBeInTheDocument();
  });

  it('should show categories view', async () => {
    const user = userEvent.setup();
    
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    const categoriesTab = screen.getByText('By Category');
    await user.click(categoriesTab);

    // Should show categories in grid layout
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Modal & Dialogs')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
  });

  it('should show empty state when no context shortcuts', async () => {
    const user = userEvent.setup();
    
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        currentContext="nonexistent" as any
        shortcuts={mockShortcuts}
      />
    );

    const contextTab = screen.getByText('Current Context');
    await user.click(contextTab);

    expect(screen.getByText('No shortcuts available for this context')).toBeInTheDocument();
  });

  it('should handle keyboard events for help toggle', () => {
    const { rerender } = render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    // Simulate ? key press
    fireEvent.keyDown(document, { key: '?' });

    // onClose should be called when help is open and ? is pressed
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not handle keyboard events when typing in input', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    searchInput.focus();

    // Simulate ? key press while input is focused
    fireEvent.keyDown(document, { 
      key: '?',
      target: searchInput
    });

    // onClose should not be called when typing in input
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display correct context labels and icons', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    // Check that context badges are displayed
    expect(screen.getByText('Modals')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('should format shortcut keys correctly', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    // Check that shortcuts are formatted properly
    expect(screen.getByText('CTRL + N')).toBeInTheDocument();
    expect(screen.getByText('CTRL + D')).toBeInTheDocument();
    expect(screen.getByText('ESCAPE')).toBeInTheDocument();
  });

  it('should show tips in footer', () => {
    render(
      <ShortcutHelp
        isOpen={true}
        onClose={mockOnClose}
        shortcuts={mockShortcuts}
      />
    );

    expect(screen.getByText(/Press.*anytime to toggle this help/)).toBeInTheDocument();
    expect(screen.getByText(/Shortcuts work differently depending on your current context/)).toBeInTheDocument();
    expect(screen.getByText(/Some shortcuts are disabled when typing in input fields/)).toBeInTheDocument();
  });
});

describe('CompactShortcutHelp', () => {
  it('should render compact shortcuts', () => {
    render(
      <CompactShortcutHelp
        shortcuts={mockShortcuts.slice(0, 3)}
        maxItems={3}
      />
    );

    expect(screen.getByText('Create new shift')).toBeInTheDocument();
    expect(screen.getByText('Duplicate shift')).toBeInTheDocument();
    expect(screen.getByText('Cancel/Close')).toBeInTheDocument();
  });

  it('should limit displayed shortcuts to maxItems', () => {
    render(
      <CompactShortcutHelp
        shortcuts={mockShortcuts}
        maxItems={2}
      />
    );

    expect(screen.getByText('Create new shift')).toBeInTheDocument();
    expect(screen.getByText('Duplicate shift')).toBeInTheDocument();
    expect(screen.queryByText('Cancel/Close')).not.toBeInTheDocument();
    expect(screen.getByText('+5 more')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CompactShortcutHelp
        shortcuts={mockShortcuts.slice(0, 2)}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should not show "more" indicator when all shortcuts fit', () => {
    render(
      <CompactShortcutHelp
        shortcuts={mockShortcuts.slice(0, 2)}
        maxItems={3}
      />
    );

    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });
});

describe('useShortcutHelp', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  it('should initialize with help hidden', () => {
    const { result } = renderHook(() => useShortcutHelp());

    expect(result.current.isVisible).toBe(false);
  });

  it('should show and hide help', () => {
    const { result } = renderHook(() => useShortcutHelp());

    act(() => {
      result.current.show();
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.hide();
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should toggle help visibility', () => {
    const { result } = renderHook(() => useShortcutHelp());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should handle ? key press to toggle help', () => {
    const { result } = renderHook(() => useShortcutHelp());

    expect(result.current.isVisible).toBe(false);

    // Simulate ? key press
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(true);

    // Press ? again to hide
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should not toggle help when typing in input field', () => {
    const { result } = renderHook(() => useShortcutHelp());

    // Create and focus an input
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(result.current.isVisible).toBe(false);

    // Simulate ? key press while input is focused
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(false);

    document.body.removeChild(input);
  });

  it('should not toggle help with modifier keys', () => {
    const { result } = renderHook(() => useShortcutHelp());

    expect(result.current.isVisible).toBe(false);

    // Simulate Ctrl+? key press
    act(() => {
      const event = new KeyboardEvent('keydown', { 
        key: '?', 
        ctrlKey: true 
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(false);

    // Simulate Alt+? key press
    act(() => {
      const event = new KeyboardEvent('keydown', { 
        key: '?', 
        altKey: true 
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(false);

    // Simulate Meta+? key press
    act(() => {
      const event = new KeyboardEvent('keydown', { 
        key: '?', 
        metaKey: true 
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useShortcutHelp());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
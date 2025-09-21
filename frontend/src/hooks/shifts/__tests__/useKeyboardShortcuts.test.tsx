import { renderHook, act } from '@testing-library/react';
import { 
  useKeyboardShortcuts,
  useModalShortcuts,
  useFormShortcuts,
  KeyboardShortcutsProvider,
  useKeyboardShortcutsContext
} from '../useKeyboardShortcuts';
import { KeyboardShortcut, ShortcutAction } from '@/types/shifts/shortcuts';

// Mock shortcuts for testing
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
  }
];

// Test wrapper with provider
const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useKeyboardShortcuts', () => {
  let mockOnShortcut: jest.Mock;

  beforeEach(() => {
    mockOnShortcut = jest.fn();
    // Clear any existing event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      expect(result.current.enabled).toBe(true);
      expect(result.current.shortcuts).toEqual(mockShortcuts);
      expect(typeof result.current.enable).toBe('function');
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
    });

    it('should initialize as disabled when enabled is false', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          enabled: false,
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      expect(result.current.enabled).toBe(false);
    });
  });

  describe('keyboard event handling', () => {
    it('should trigger shortcut on matching key combination', () => {
      renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      // Simulate Ctrl+N
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(mockOnShortcut).toHaveBeenCalledWith({
        type: 'CREATE_SHIFT',
        payload: { event, shortcut: mockShortcuts[0] }
      });
    });

    it('should not trigger shortcut when disabled', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          enabled: false,
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(mockOnShortcut).not.toHaveBeenCalled();
    });

    it('should not trigger shortcut when typing in input field', () => {
      renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      // Create input element and focus it
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      // Mock event target
      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      // Should still trigger for Ctrl+N as it's allowed in inputs
      expect(mockOnShortcut).toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should allow certain shortcuts in input fields', () => {
      renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Test Escape key (should be allowed)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      Object.defineProperty(escapeEvent, 'target', {
        value: input,
        enumerable: true
      });

      act(() => {
        document.dispatchEvent(escapeEvent);
      });

      expect(mockOnShortcut).toHaveBeenCalledWith({
        type: 'ESCAPE_ACTION',
        payload: { event: escapeEvent, shortcut: mockShortcuts[2] }
      });

      document.body.removeChild(input);
    });

    it('should match shortcuts with different modifier combinations', () => {
      const shiftShortcut: KeyboardShortcut = {
        key: 'D',
        shiftKey: true,
        action: 'DUPLICATE_SHIFT',
        description: 'Duplicate with shift',
        context: 'global'
      };

      renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: [shiftShortcut],
          onShortcut: mockOnShortcut
        })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'D',
        shiftKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(mockOnShortcut).toHaveBeenCalledWith({
        type: 'DUPLICATE_SHIFT',
        payload: { event, shortcut: shiftShortcut }
      });
    });
  });

  describe('context filtering', () => {
    it('should only trigger shortcuts for current context', () => {
      renderHook(() => 
        useKeyboardShortcuts({
          context: 'modal',
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      // Try global shortcut (should work as global shortcuts work everywhere)
      const globalEvent = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(globalEvent);
      });

      expect(mockOnShortcut).toHaveBeenCalledWith({
        type: 'CREATE_SHIFT',
        payload: { event: globalEvent, shortcut: mockShortcuts[0] }
      });

      mockOnShortcut.mockClear();

      // Try modal-specific shortcut
      const modalEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(modalEvent);
      });

      expect(mockOnShortcut).toHaveBeenCalledWith({
        type: 'ESCAPE_ACTION',
        payload: { event: modalEvent, shortcut: mockShortcuts[2] }
      });
    });

    it('should filter shortcuts by context correctly', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          context: 'form',
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      const activeShortcuts = result.current.getActiveShortcuts();
      
      // Should include global and form shortcuts
      expect(activeShortcuts).toHaveLength(3); // 2 global + 1 form
      expect(activeShortcuts.some(s => s.context === 'global')).toBe(true);
      expect(activeShortcuts.some(s => s.context === 'form')).toBe(true);
      expect(activeShortcuts.some(s => s.context === 'modal')).toBe(false);
    });
  });

  describe('action handlers', () => {
    it('should register and use local action handlers', () => {
      const localHandler = jest.fn();
      
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      act(() => {
        result.current.registerActionHandler('CREATE_SHIFT', localHandler);
      });

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      // Local handler should be called instead of onShortcut
      expect(localHandler).toHaveBeenCalledWith({
        event,
        shortcut: mockShortcuts[0]
      });
      expect(mockOnShortcut).not.toHaveBeenCalled();
    });

    it('should unregister action handlers', () => {
      const localHandler = jest.fn();
      
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      act(() => {
        result.current.registerActionHandler('CREATE_SHIFT', localHandler);
        result.current.unregisterActionHandler('CREATE_SHIFT');
      });

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      // Should fall back to onShortcut
      expect(localHandler).not.toHaveBeenCalled();
      expect(mockOnShortcut).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should enable and disable shortcuts', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.disable();
      });

      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.enable();
      });

      expect(result.current.enabled).toBe(true);
    });

    it('should toggle shortcuts', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.enabled).toBe(true);
    });

    it('should find shortcuts by action', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      const shortcut = result.current.getShortcutByAction('CREATE_SHIFT');
      expect(shortcut).toEqual(mockShortcuts[0]);

      const nonExistent = result.current.getShortcutByAction('NON_EXISTENT');
      expect(nonExistent).toBeUndefined();
    });

    it('should format shortcut keys correctly', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      expect(result.current.formatShortcutKeys(mockShortcuts[0])).toBe('Ctrl + N');
      expect(result.current.formatShortcutKeys(mockShortcuts[2])).toBe('Esc');
      
      const complexShortcut: KeyboardShortcut = {
        key: 'F',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        action: 'COMPLEX',
        description: 'Complex shortcut'
      };

      expect(result.current.formatShortcutKeys(complexShortcut)).toBe('Ctrl + Alt + Shift + F');
    });

    it('should format special keys correctly', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          onShortcut: mockOnShortcut
        })
      );

      const arrowShortcut: KeyboardShortcut = {
        key: 'ArrowLeft',
        action: 'NAVIGATE_LEFT',
        description: 'Navigate left'
      };

      expect(result.current.formatShortcutKeys(arrowShortcut)).toBe('←');

      const spaceShortcut: KeyboardShortcut = {
        key: ' ',
        action: 'SPACE_ACTION',
        description: 'Space action'
      };

      expect(result.current.formatShortcutKeys(spaceShortcut)).toBe('Space');
    });
  });
});

describe('useModalShortcuts', () => {
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSave = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle modal shortcuts when open', () => {
    renderHook(() => useModalShortcuts(true, mockOnClose, mockOnSave));

    // Test Escape key
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(escapeEvent);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not handle shortcuts when modal is closed', () => {
    renderHook(() => useModalShortcuts(false, mockOnClose, mockOnSave));

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(escapeEvent);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle save shortcuts', () => {
    renderHook(() => useModalShortcuts(true, mockOnClose, mockOnSave));

    const saveEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(saveEvent);
    });

    expect(mockOnSave).toHaveBeenCalled();
  });
});

describe('useFormShortcuts', () => {
  let mockOnSave: jest.Mock;
  let mockOnCancel: jest.Mock;

  beforeEach(() => {
    mockOnSave = jest.fn();
    mockOnCancel = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle form save shortcuts', () => {
    renderHook(() => useFormShortcuts(mockOnSave, mockOnCancel));

    const saveEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(saveEvent);
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should handle form cancel shortcuts', () => {
    renderHook(() => useFormShortcuts(mockOnSave, mockOnCancel));

    const cancelEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(cancelEvent);
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle Enter key for form submission', () => {
    renderHook(() => useFormShortcuts(mockOnSave, mockOnCancel));

    // Create a non-textarea element
    const input = document.createElement('input');
    document.body.appendChild(input);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    });

    Object.defineProperty(enterEvent, 'target', {
      value: input,
      enumerable: true
    });

    act(() => {
      document.dispatchEvent(enterEvent);
    });

    expect(mockOnSave).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not submit form on Enter in textarea', () => {
    renderHook(() => useFormShortcuts(mockOnSave, mockOnCancel));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    });

    Object.defineProperty(enterEvent, 'target', {
      value: textarea,
      enumerable: true
    });

    act(() => {
      document.dispatchEvent(enterEvent);
    });

    expect(mockOnSave).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should not handle shortcuts when disabled', () => {
    renderHook(() => useFormShortcuts(mockOnSave, mockOnCancel, undefined, false));

    const saveEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });

    act(() => {
      document.dispatchEvent(saveEvent);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });
});

describe('KeyboardShortcutsProvider', () => {
  it('should provide context value', () => {
    const TestComponent = () => {
      const context = useKeyboardShortcutsContext();
      expect(context).toBeDefined();
      expect(typeof context.registerShortcuts).toBe('function');
      expect(typeof context.unregisterShortcuts).toBe('function');
      expect(typeof context.setActiveContext).toBe('function');
      expect(typeof context.executeAction).toBe('function');
      return null;
    };

    renderHook(() => <TestComponent />, { wrapper: createWrapper() });
  });

  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useKeyboardShortcutsContext();
      return null;
    };

    expect(() => {
      renderHook(() => <TestComponent />);
    }).toThrow('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  });
});
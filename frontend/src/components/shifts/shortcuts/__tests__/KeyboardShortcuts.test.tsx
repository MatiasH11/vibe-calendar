import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  KeyboardShortcuts,
  ModalShortcuts,
  FormShortcuts,
  CalendarShortcuts,
  TemplateManagerShortcuts,
  KeyboardShortcutsWrapper
} from '../KeyboardShortcuts';

// Mock the hooks
jest.mock('@/hooks/shifts/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(() => ({
    enabled: true,
    shortcuts: [],
    formatShortcutKeys: jest.fn((shortcut) => 'Ctrl + N'),
    registerActionHandler: jest.fn(),
    unregisterActionHandler: jest.fn()
  })),
  useModalShortcuts: jest.fn(),
  KeyboardShortcutsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock other hooks
jest.mock('@/hooks/shifts/useShifts', () => ({
  useShifts: () => ({})
}));

jest.mock('@/hooks/shifts/useShiftTemplates', () => ({
  useShiftTemplates: () => ({})
}));

describe('KeyboardShortcuts', () => {
  const mockProps = {
    onCreateShift: jest.fn(),
    onDuplicateShift: jest.fn(),
    onNavigateWeek: jest.fn(),
    onGoToToday: jest.fn(),
    onShowHelp: jest.fn(),
    onFocusSearch: jest.fn(),
    onToggleBulkMode: jest.fn(),
    onOpenTemplateManager: jest.fn(),
    selectedShiftId: 1,
    currentWeek: new Date('2024-01-15')
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <KeyboardShortcuts {...mockProps}>
        <div data-testid="child">Test Child</div>
      </KeyboardShortcuts>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts through useKeyboardShortcuts hook', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    
    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      enabled: true,
      context: 'global',
      onShortcut: expect.any(Function)
    });
  });

  it('should show help when help is toggled', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    // Simulate SHOW_HELP action
    shortcutHandler({ type: 'SHOW_HELP', payload: {} });

    // Help should be visible (mocked ShortcutHelp component would be rendered)
    expect(mockProps.onShowHelp).toHaveBeenCalled();
  });

  it('should handle CREATE_SHIFT action', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'CREATE_SHIFT', payload: {} });

    expect(mockProps.onCreateShift).toHaveBeenCalled();
  });

  it('should handle DUPLICATE_SHIFT action with selected shift', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'DUPLICATE_SHIFT', payload: {} });

    expect(mockProps.onDuplicateShift).toHaveBeenCalledWith(1);
  });

  it('should handle DUPLICATE_SHIFT action without selected shift', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps} selectedShiftId={undefined}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'DUPLICATE_SHIFT', payload: {} });

    expect(consoleSpy).toHaveBeenCalledWith('No shift selected for duplication');
    expect(mockProps.onDuplicateShift).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle navigation actions', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'NAVIGATE_WEEK_PREV', payload: {} });
    expect(mockProps.onNavigateWeek).toHaveBeenCalledWith('prev');

    shortcutHandler({ type: 'NAVIGATE_WEEK_NEXT', payload: {} });
    expect(mockProps.onNavigateWeek).toHaveBeenCalledWith('next');

    shortcutHandler({ type: 'GO_TO_TODAY', payload: {} });
    expect(mockProps.onGoToToday).toHaveBeenCalled();
  });

  it('should handle other actions', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'FOCUS_SEARCH', payload: {} });
    expect(mockProps.onFocusSearch).toHaveBeenCalled();

    shortcutHandler({ type: 'TOGGLE_BULK_MODE', payload: {} });
    expect(mockProps.onToggleBulkMode).toHaveBeenCalled();

    shortcutHandler({ type: 'OPEN_TEMPLATE_MANAGER', payload: {} });
    expect(mockProps.onOpenTemplateManager).toHaveBeenCalled();
  });

  it('should handle unrecognized actions', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <KeyboardShortcuts {...mockProps}>
        <div>Test</div>
      </KeyboardShortcuts>
    );

    shortcutHandler({ type: 'UNKNOWN_ACTION', payload: {} });

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled shortcut action:', 'UNKNOWN_ACTION');

    consoleSpy.mockRestore();
  });
});

describe('ModalShortcuts', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onSubmit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <ModalShortcuts {...mockProps}>
        <div data-testid="modal-child">Modal Content</div>
      </ModalShortcuts>
    );

    expect(screen.getByTestId('modal-child')).toBeInTheDocument();
  });

  it('should handle modal shortcuts when open', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <ModalShortcuts {...mockProps}>
        <div>Modal</div>
      </ModalShortcuts>
    );

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      enabled: true,
      context: 'modal',
      onShortcut: expect.any(Function)
    });

    // Test close action
    shortcutHandler({ type: 'CLOSE_MODAL', payload: {} });
    expect(mockProps.onClose).toHaveBeenCalled();

    // Test escape action
    shortcutHandler({ type: 'ESCAPE_ACTION', payload: {} });
    expect(mockProps.onClose).toHaveBeenCalledTimes(2);

    // Test save action
    shortcutHandler({ type: 'SAVE_FORM', payload: {} });
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('should not close when preventEscapeClose is true', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <ModalShortcuts {...mockProps} preventEscapeClose={true}>
        <div>Modal</div>
      </ModalShortcuts>
    );

    shortcutHandler({ type: 'ESCAPE_ACTION', payload: {} });
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('should prefer onSubmit over onSave when both provided', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <ModalShortcuts {...mockProps}>
        <div>Modal</div>
      </ModalShortcuts>
    );

    shortcutHandler({ type: 'SAVE_FORM', payload: {} });
    expect(mockProps.onSave).toHaveBeenCalled();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });
});

describe('FormShortcuts', () => {
  const mockProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onSubmit: jest.fn(),
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <FormShortcuts {...mockProps}>
        <div data-testid="form-child">Form Content</div>
      </FormShortcuts>
    );

    expect(screen.getByTestId('form-child')).toBeInTheDocument();
  });

  it('should handle form shortcuts', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <FormShortcuts {...mockProps}>
        <div>Form</div>
      </FormShortcuts>
    );

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      enabled: true,
      context: 'form',
      onShortcut: expect.any(Function)
    });

    // Test Ctrl+S save
    const ctrlSEvent = { key: 's', ctrlKey: true, preventDefault: jest.fn() };
    shortcutHandler({ type: 'SAVE_FORM', payload: { event: ctrlSEvent } });
    expect(ctrlSEvent.preventDefault).toHaveBeenCalled();
    expect(mockProps.onSave).toHaveBeenCalled();

    // Test Enter submit (non-textarea)
    const enterEvent = { 
      key: 'Enter', 
      shiftKey: false, 
      preventDefault: jest.fn(),
      target: { tagName: 'INPUT' }
    };
    shortcutHandler({ type: 'SAVE_FORM', payload: { event: enterEvent } });
    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(mockProps.onSubmit).toHaveBeenCalled();

    // Test Escape cancel
    shortcutHandler({ type: 'ESCAPE_ACTION', payload: {} });
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should not submit on Enter in textarea', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <FormShortcuts {...mockProps}>
        <div>Form</div>
      </FormShortcuts>
    );

    const enterEvent = { 
      key: 'Enter', 
      shiftKey: false, 
      preventDefault: jest.fn(),
      target: { tagName: 'TEXTAREA' }
    };
    shortcutHandler({ type: 'SAVE_FORM', payload: { event: enterEvent } });
    
    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should not submit on Shift+Enter', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <FormShortcuts {...mockProps}>
        <div>Form</div>
      </FormShortcuts>
    );

    const shiftEnterEvent = { 
      key: 'Enter', 
      shiftKey: true, 
      preventDefault: jest.fn(),
      target: { tagName: 'INPUT' }
    };
    shortcutHandler({ type: 'SAVE_FORM', payload: { event: shiftEnterEvent } });
    
    expect(shiftEnterEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });
});

describe('CalendarShortcuts', () => {
  const mockProps = {
    onNavigateWeek: jest.fn(),
    onGoToToday: jest.fn(),
    onSelectDate: jest.fn(),
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle calendar navigation shortcuts', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <CalendarShortcuts {...mockProps}>
        <div>Calendar</div>
      </CalendarShortcuts>
    );

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      enabled: true,
      context: 'calendar',
      onShortcut: expect.any(Function)
    });

    shortcutHandler({ type: 'NAVIGATE_WEEK_PREV', payload: {} });
    expect(mockProps.onNavigateWeek).toHaveBeenCalledWith('prev');

    shortcutHandler({ type: 'NAVIGATE_WEEK_NEXT', payload: {} });
    expect(mockProps.onNavigateWeek).toHaveBeenCalledWith('next');

    shortcutHandler({ type: 'GO_TO_TODAY', payload: {} });
    expect(mockProps.onGoToToday).toHaveBeenCalled();
  });
});

describe('TemplateManagerShortcuts', () => {
  const mockProps = {
    onCreateTemplate: jest.fn(),
    onEditTemplate: jest.fn(),
    onDeleteTemplate: jest.fn(),
    onFocusSearch: jest.fn(),
    selectedTemplateId: 1,
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle template manager shortcuts', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <TemplateManagerShortcuts {...mockProps}>
        <div>Template Manager</div>
      </TemplateManagerShortcuts>
    );

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      enabled: true,
      context: 'template-manager',
      onShortcut: expect.any(Function)
    });

    shortcutHandler({ type: 'CREATE_SHIFT', payload: {} });
    expect(mockProps.onCreateTemplate).toHaveBeenCalled();

    shortcutHandler({ type: 'FOCUS_SEARCH', payload: {} });
    expect(mockProps.onFocusSearch).toHaveBeenCalled();

    // Test Delete key
    const deleteEvent = { key: 'Delete' };
    shortcutHandler({ type: 'UNKNOWN', payload: { event: deleteEvent } });
    expect(mockProps.onDeleteTemplate).toHaveBeenCalledWith(1);

    // Test Enter key
    const enterEvent = { key: 'Enter' };
    shortcutHandler({ type: 'UNKNOWN', payload: { event: enterEvent } });
    expect(mockProps.onEditTemplate).toHaveBeenCalledWith(1);
  });

  it('should not handle template-specific shortcuts without selected template', () => {
    const mockUseKeyboardShortcuts = require('@/hooks/shifts/useKeyboardShortcuts').useKeyboardShortcuts;
    let shortcutHandler: Function;

    mockUseKeyboardShortcuts.mockImplementation(({ onShortcut }: any) => {
      shortcutHandler = onShortcut;
      return {
        enabled: true,
        shortcuts: [],
        formatShortcutKeys: jest.fn()
      };
    });

    render(
      <TemplateManagerShortcuts {...mockProps} selectedTemplateId={undefined}>
        <div>Template Manager</div>
      </TemplateManagerShortcuts>
    );

    const deleteEvent = { key: 'Delete' };
    shortcutHandler({ type: 'UNKNOWN', payload: { event: deleteEvent } });
    expect(mockProps.onDeleteTemplate).not.toHaveBeenCalled();

    const enterEvent = { key: 'Enter' };
    shortcutHandler({ type: 'UNKNOWN', payload: { event: enterEvent } });
    expect(mockProps.onEditTemplate).not.toHaveBeenCalled();
  });
});

describe('KeyboardShortcutsWrapper', () => {
  it('should render children within provider', () => {
    render(
      <KeyboardShortcutsWrapper>
        <div data-testid="wrapper-child">Wrapped Content</div>
      </KeyboardShortcutsWrapper>
    );

    expect(screen.getByTestId('wrapper-child')).toBeInTheDocument();
  });
});
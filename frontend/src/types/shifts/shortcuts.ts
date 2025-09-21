// Keyboard Shortcuts Types

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
  context?: ShortcutContext;
  preventDefault?: boolean;
}

export type ShortcutContext = 
  | 'global' 
  | 'modal' 
  | 'form' 
  | 'calendar' 
  | 'template-manager';

export interface ShortcutAction {
  type: ShortcutActionType;
  payload?: any;
}

export type ShortcutActionType =
  | 'CREATE_SHIFT'
  | 'DUPLICATE_SHIFT'
  | 'CLOSE_MODAL'
  | 'SAVE_FORM'
  | 'NAVIGATE_WEEK_PREV'
  | 'NAVIGATE_WEEK_NEXT'
  | 'GO_TO_TODAY'
  | 'SHOW_HELP'
  | 'FOCUS_SEARCH'
  | 'TOGGLE_BULK_MODE'
  | 'OPEN_TEMPLATE_MANAGER'
  | 'ESCAPE_ACTION';

export interface ShortcutContextState {
  activeContext: ShortcutContext;
  modalOpen: boolean;
  formFocused: boolean;
  inputFocused: boolean;
}

export interface ShortcutHelpItem {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
    context?: ShortcutContext;
  }>;
}

// Default shortcuts configuration
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrlKey: true,
    action: 'CREATE_SHIFT',
    description: 'Create new shift',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'd',
    ctrlKey: true,
    action: 'DUPLICATE_SHIFT',
    description: 'Duplicate selected shift',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'Escape',
    action: 'CLOSE_MODAL',
    description: 'Close modal or cancel action',
    context: 'modal',
    preventDefault: true
  },
  {
    key: 'Enter',
    action: 'SAVE_FORM',
    description: 'Save form',
    context: 'form',
    preventDefault: false // Let forms handle Enter naturally
  },
  {
    key: 'ArrowLeft',
    action: 'NAVIGATE_WEEK_PREV',
    description: 'Previous week',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'ArrowRight',
    action: 'NAVIGATE_WEEK_NEXT',
    description: 'Next week',
    context: 'global',
    preventDefault: true
  },
  {
    key: 't',
    action: 'GO_TO_TODAY',
    description: 'Go to current week',
    context: 'global',
    preventDefault: true
  },
  {
    key: '?',
    action: 'SHOW_HELP',
    description: 'Show keyboard shortcuts help',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'f',
    ctrlKey: true,
    action: 'FOCUS_SEARCH',
    description: 'Focus search/filter',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'b',
    ctrlKey: true,
    action: 'TOGGLE_BULK_MODE',
    description: 'Toggle bulk mode',
    context: 'global',
    preventDefault: true
  },
  {
    key: 'm',
    ctrlKey: true,
    action: 'OPEN_TEMPLATE_MANAGER',
    description: 'Open template manager',
    context: 'global',
    preventDefault: true
  }
];

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  context?: ShortcutContext;
  shortcuts?: KeyboardShortcut[];
  onShortcut?: (action: ShortcutAction) => void;
}

export interface KeyboardShortcutsState {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
  context: ShortcutContext;
  helpVisible: boolean;
}
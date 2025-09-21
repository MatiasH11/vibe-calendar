import { useEffect } from 'react';
import hotkeys from 'hotkeys-js';

interface HotkeyHandlers {
  onCreateShift?: () => void;
  onDuplicateShift?: () => void;
  onNavigateWeek?: (direction: 'prev' | 'next') => void;
  onGoToToday?: () => void;
  onShowHelp?: () => void;
  onFocusSearch?: () => void;
  onToggleTemplates?: () => void;
}

export const useHotkeys = (handlers: HotkeyHandlers, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Set a custom scope for our hotkeys
    const scope = 'shifts';
    hotkeys.setScope(scope);

    // Configure hotkeys filter to prevent conflicts with input fields
    const originalFilter = hotkeys.filter;
    hotkeys.filter = function(event) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || 
                     target.contentEditable === 'true' || 
                     target.getAttribute('contenteditable') === 'true';
      
      // For input fields, only allow certain keys
      if (isInput) {
        const key = event.key?.toLowerCase();
        const allowedKeys = ['escape', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
        const isAltCombo = event.altKey;
        const allowedInInput = allowedKeys.includes(key) || isAltCombo;
        
        return allowedInInput;
      }
      
      return true;
    };

    // Register shortcuts using Alt combinations (browser-safe)
    try {
      // Alt combinations for main actions
      hotkeys('alt+n', scope, (event, handler) => {
        event.preventDefault();
        event.stopPropagation();
        handlers.onCreateShift?.();
      });

      hotkeys('alt+d', scope, (event, handler) => {
        event.preventDefault();
        event.stopPropagation();
        handlers.onDuplicateShift?.();
      });

      hotkeys('alt+f', scope, (event, handler) => {
        event.preventDefault();
        event.stopPropagation();
        handlers.onFocusSearch?.();
      });

      hotkeys('alt+m', scope, (event, handler) => {
        event.preventDefault();
        event.stopPropagation();
        handlers.onToggleTemplates?.();
      });

      // Navigation keys
      hotkeys('left', scope, (event, handler) => {
        event.preventDefault();
        handlers.onNavigateWeek?.('prev');
      });

      hotkeys('right', scope, (event, handler) => {
        event.preventDefault();
        handlers.onNavigateWeek?.('next');
      });

      hotkeys('t', scope, (event, handler) => {
        event.preventDefault();
        handlers.onGoToToday?.();
      });

      hotkeys('?', scope, (event, handler) => {
        event.preventDefault();
        handlers.onShowHelp?.();
      });

    } catch (error) {
      console.error('Error registering hotkeys:', error);
    }

    // Cleanup function
    return () => {
      // Restore original filter
      hotkeys.filter = originalFilter;
      
      // Unbind our specific keys
      const keysToUnbind = ['alt+n', 'alt+d', 'alt+f', 'alt+m', 'left', 'right', 't', '?'];
      keysToUnbind.forEach(key => {
        hotkeys.unbind(key, scope);
      });
      
      // Reset to default scope
      hotkeys.setScope('all');
    };
  }, [handlers, enabled]);

  return {
    enabled
  };
};
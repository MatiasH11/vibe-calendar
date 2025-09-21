/**
 * Notification System Component
 * Provides toast notifications with different types and actions
 */

import React from 'react';
import { toast, Toaster } from 'sonner';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: NotificationAction;
  dismissible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

class NotificationManager {
  /**
   * Show success notification
   */
  success(message: string, options: NotificationOptions = {}) {
    return toast.success(message, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      icon: <CheckCircle className="h-4 w-4" />,
    });
  }

  /**
   * Show error notification
   */
  error(message: string, options: NotificationOptions = {}) {
    return toast.error(message, {
      description: options.description,
      duration: options.duration || 6000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      icon: <XCircle className="h-4 w-4" />,
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, options: NotificationOptions = {}) {
    return toast.warning(message, {
      description: options.description,
      duration: options.duration || 5000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  }

  /**
   * Show info notification
   */
  info(message: string, options: NotificationOptions = {}) {
    return toast.info(message, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      icon: <Info className="h-4 w-4" />,
    });
  }

  /**
   * Show loading notification
   */
  loading(message: string, options: NotificationOptions = {}) {
    return toast.loading(message, {
      description: options.description,
      duration: options.duration || Infinity,
    });
  }

  /**
   * Show custom notification
   */
  custom(content: React.ReactNode, options: NotificationOptions = {}) {
    return toast.custom((id) => content as React.ReactElement, {
      duration: options.duration || 4000,
    });
  }

  /**
   * Show promise-based notification
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options: NotificationOptions = {}
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: options.duration,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Dismiss notification
   */
  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    toast.dismiss();
  }
}

// Singleton instance
export const notifications = new NotificationManager();

/**
 * Notification Provider Component
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        toastOptions={{
          className: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          descriptionClassName: 'group-[.toast]:text-muted-foreground',
        }}
      />
    </>
  );
}

/**
 * React hook for notifications
 */
export function useNotifications() {
  return {
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
    loading: notifications.loading.bind(notifications),
    custom: notifications.custom.bind(notifications),
    promise: notifications.promise.bind(notifications),
    dismiss: notifications.dismiss.bind(notifications),
    dismissAll: notifications.dismissAll.bind(notifications),
  };
}

/**
 * Predefined notification templates
 */
export const NotificationTemplates = {
  // Template operations
  templateCreated: (name: string) => 
    notifications.success(`Template "${name}" created successfully`),
  
  templateUpdated: (name: string) => 
    notifications.success(`Template "${name}" updated successfully`),
  
  templateDeleted: (name: string) => 
    notifications.success(`Template "${name}" deleted successfully`),

  // Shift operations
  shiftCreated: () => 
    notifications.success('Shift created successfully'),
  
  shiftUpdated: () => 
    notifications.success('Shift updated successfully'),
  
  shiftDeleted: () => 
    notifications.success('Shift deleted successfully'),

  shiftDuplicated: (count: number) => 
    notifications.success(`${count} shift${count > 1 ? 's' : ''} duplicated successfully`),

  // Bulk operations
  bulkOperationStarted: (count: number, operation: string) => 
    notifications.loading(`${operation} ${count} shifts...`),

  bulkOperationCompleted: (successful: number, failed: number, operation: string) => {
    if (failed === 0) {
      notifications.success(`${operation} completed successfully for ${successful} shifts`);
    } else {
      notifications.warning(
        `${operation} completed with issues`,
        {
          description: `${successful} successful, ${failed} failed`,
          action: {
            label: 'View Details',
            onClick: () => {
              // This would open a detailed results modal
              console.log('Show bulk operation results');
            },
          },
        }
      );
    }
  },

  // Conflict notifications
  conflictsDetected: (count: number) => 
    notifications.warning(
      `${count} conflict${count > 1 ? 's' : ''} detected`,
      {
        description: 'Please review and resolve before proceeding',
        action: {
          label: 'Review',
          onClick: () => {
            // This would open conflict resolution modal
            console.log('Show conflict resolution');
          },
        },
      }
    ),

  // Error notifications
  networkError: () => 
    notifications.error(
      'Connection problem',
      {
        description: 'Please check your internet connection and try again',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      }
    ),

  validationError: (message: string) => 
    notifications.error('Validation Error', { description: message }),

  serverError: () => 
    notifications.error(
      'Server error',
      {
        description: 'Something went wrong on our end. Please try again later.',
        action: {
          label: 'Contact Support',
          onClick: () => window.open('mailto:support@example.com', '_blank'),
        },
      }
    ),

  // Success with undo
  actionWithUndo: (message: string, undoAction: () => void) => 
    notifications.success(message, {
      action: {
        label: 'Undo',
        onClick: undoAction,
      },
    }),
};
/**
 * Comprehensive Error Handling System
 * Provides centralized error handling with user-friendly messages and recovery options
 */

import { toast } from 'sonner';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  CONFLICT = 'CONFLICT',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, any>;
  recoveryOptions?: RecoveryOption[];
  timestamp: number;
}

export interface RecoveryOption {
  label: string;
  action: () => void | Promise<void>;
  type: 'primary' | 'secondary' | 'destructive';
}

class ErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private readonly MAX_LOG_SIZE = 100;

  /**
   * Handle and categorize errors
   */
  handleError(error: any, context?: string): ErrorInfo {
    const errorInfo = this.categorizeError(error, context);
    this.logError(errorInfo);
    this.showUserFeedback(errorInfo);
    return errorInfo;
  }

  /**
   * Categorize error based on type and content
   */
  private categorizeError(error: any, context?: string): ErrorInfo {
    const timestamp = Date.now();
    let errorInfo: ErrorInfo;

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      errorInfo = {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Network error occurred',
        userMessage: 'Connection problem. Please check your internet connection and try again.',
        timestamp,
        recoveryOptions: [
          {
            label: 'Retry',
            action: () => window.location.reload(),
            type: 'primary',
          },
          {
            label: 'Check Connection',
            action: () => {
              window.open('https://www.google.com', '_blank');
            },
            type: 'secondary',
          },
        ],
      };
    }
    // Validation errors
    else if (error.message?.includes('VALIDATION') || error.status === 400) {
      errorInfo = {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Validation error',
        userMessage: this.getValidationMessage(error.message),
        code: error.code,
        timestamp,
        recoveryOptions: [
          {
            label: 'Fix and Retry',
            action: () => {}, // Will be handled by the form
            type: 'primary',
          },
        ],
      };
    }
    // Authorization errors
    else if (error.status === 401 || error.status === 403) {
      errorInfo = {
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Authorization error',
        userMessage: 'You don\'t have permission to perform this action. Please contact your administrator.',
        timestamp,
        recoveryOptions: [
          {
            label: 'Login Again',
            action: () => {
              window.location.href = '/login';
            },
            type: 'primary',
          },
        ],
      };
    }
    // Conflict errors
    else if (error.message?.includes('CONFLICT') || error.message?.includes('OVERLAP')) {
      errorInfo = {
        type: ErrorType.CONFLICT,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Conflict detected',
        userMessage: this.getConflictMessage(error.message),
        timestamp,
        recoveryOptions: [
          {
            label: 'Resolve Conflicts',
            action: () => {}, // Will be handled by conflict resolver
            type: 'primary',
          },
          {
            label: 'Cancel',
            action: () => {},
            type: 'secondary',
          },
        ],
      };
    }
    // Not found errors
    else if (error.status === 404) {
      errorInfo = {
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Resource not found',
        userMessage: 'The requested item could not be found. It may have been deleted or moved.',
        timestamp,
        recoveryOptions: [
          {
            label: 'Go Back',
            action: () => window.history.back(),
            type: 'primary',
          },
          {
            label: 'Refresh',
            action: () => window.location.reload(),
            type: 'secondary',
          },
        ],
      };
    }
    // Rate limit errors
    else if (error.status === 429) {
      errorInfo = {
        type: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        timestamp,
        recoveryOptions: [
          {
            label: 'Wait and Retry',
            action: () => {
              setTimeout(() => window.location.reload(), 5000);
            },
            type: 'primary',
          },
        ],
      };
    }
    // Server errors
    else if (error.status >= 500) {
      errorInfo = {
        type: ErrorType.SERVER,
        severity: ErrorSeverity.HIGH,
        message: error.message || 'Server error',
        userMessage: 'A server error occurred. Our team has been notified. Please try again later.',
        timestamp,
        recoveryOptions: [
          {
            label: 'Try Again',
            action: () => window.location.reload(),
            type: 'primary',
          },
          {
            label: 'Contact Support',
            action: () => {
              window.open('mailto:support@example.com', '_blank');
            },
            type: 'secondary',
          },
        ],
      };
    }
    // Unknown errors
    else {
      errorInfo = {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Unknown error',
        userMessage: 'An unexpected error occurred. Please try again.',
        details: { error: error.toString(), context },
        timestamp,
        recoveryOptions: [
          {
            label: 'Try Again',
            action: () => window.location.reload(),
            type: 'primary',
          },
        ],
      };
    }

    return errorInfo;
  }

  /**
   * Get user-friendly validation message
   */
  private getValidationMessage(errorMessage: string): string {
    const validationMessages: Record<string, string> = {
      'DUPLICATE_TEMPLATE_NAME': 'A template with this name already exists. Please choose a different name.',
      'INVALID_TIME_FORMAT': 'Please enter a valid time in HH:MM format.',
      'OVERNIGHT_NOT_ALLOWED': 'Overnight shifts are not supported. End time must be after start time.',
      'SHIFT_OVERLAP': 'This shift overlaps with an existing shift. Please adjust the times.',
      'TEMPLATE_NOT_FOUND': 'The selected template could not be found.',
      'EMPLOYEE_NOT_AVAILABLE': 'The selected employee is not available for this shift.',
      'INVALID_DATE_RANGE': 'Please select a valid date range.',
    };

    for (const [key, message] of Object.entries(validationMessages)) {
      if (errorMessage?.includes(key)) {
        return message;
      }
    }

    return 'Please check your input and try again.';
  }

  /**
   * Get user-friendly conflict message
   */
  private getConflictMessage(errorMessage: string): string {
    const conflictMessages: Record<string, string> = {
      'SHIFT_OVERLAP': 'This shift conflicts with an existing shift. Please choose different times or resolve the conflict.',
      'DUPLICATION_CONFLICTS_DETECTED': 'Some shifts could not be duplicated due to conflicts. Please review and resolve.',
      'BULK_CREATION_CONFLICTS_DETECTED': 'Some shifts could not be created due to conflicts. Please review the conflicts.',
    };

    for (const [key, message] of Object.entries(conflictMessages)) {
      if (errorMessage?.includes(key)) {
        return message;
      }
    }

    return 'A scheduling conflict was detected. Please review and resolve.';
  }

  /**
   * Show user feedback based on error severity
   */
  private showUserFeedback(errorInfo: ErrorInfo): void {
    const { severity, userMessage, recoveryOptions } = errorInfo;

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(userMessage, {
          duration: Infinity,
          action: recoveryOptions?.[0] ? {
            label: recoveryOptions[0].label,
            onClick: recoveryOptions[0].action,
          } : undefined,
        });
        break;

      case ErrorSeverity.HIGH:
        toast.error(userMessage, {
          duration: 8000,
          action: recoveryOptions?.[0] ? {
            label: recoveryOptions[0].label,
            onClick: recoveryOptions[0].action,
          } : undefined,
        });
        break;

      case ErrorSeverity.MEDIUM:
        toast.warning(userMessage, {
          duration: 5000,
          action: recoveryOptions?.[0] ? {
            label: recoveryOptions[0].label,
            onClick: recoveryOptions[0].action,
          } : undefined,
        });
        break;

      case ErrorSeverity.LOW:
        toast.info(userMessage, {
          duration: 3000,
        });
        break;
    }
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(errorInfo: ErrorInfo): void {
    // Add to internal log
    this.errorLog.push(errorInfo);
    
    // Keep log size manageable
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-this.MAX_LOG_SIZE);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${errorInfo.type}] - ${errorInfo.severity}`);
      console.error('Message:', errorInfo.message);
      console.error('User Message:', errorInfo.userMessage);
      if (errorInfo.details) {
        console.error('Details:', errorInfo.details);
      }
      if (errorInfo.recoveryOptions) {
        console.info('Recovery Options:', errorInfo.recoveryOptions.map(o => o.label));
      }
      console.groupEnd();
    }

    // Send to analytics/monitoring service in production
    if (process.env.NODE_ENV === 'production' && errorInfo.severity !== ErrorSeverity.LOW) {
      this.sendToMonitoring(errorInfo);
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(errorInfo: ErrorInfo): void {
    // This would integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Sentry.captureException(errorInfo);
      console.log('📊 Error sent to monitoring:', errorInfo);
    } catch (error) {
      console.warn('Failed to send error to monitoring service:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: ErrorInfo[];
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => byType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => bySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent: this.errorLog.slice(-10),
    };
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return errorHandler.handleError(error, context);
  };

  const getErrorStats = () => {
    return errorHandler.getErrorStats();
  };

  const clearErrorLog = () => {
    errorHandler.clearLog();
  };

  return {
    handleError,
    getErrorStats,
    clearErrorLog,
  };
}

/**
 * Error boundary wrapper for React components
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handleError(error, context);
      throw error; // Re-throw to allow component-level handling
    }
  }) as T;
}
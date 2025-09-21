/**
 * Bug Fixes and Optimizations
 * Collection of fixes for common issues and performance optimizations
 */

import { templateCache } from '@/lib/cache/template-cache';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { errorHandler } from '@/lib/error-handling/error-handler';

/**
 * Memory leak prevention utilities
 */
export class MemoryLeakPrevention {
  private static intervals = new Set<NodeJS.Timeout>();
  private static timeouts = new Set<NodeJS.Timeout>();
  private static eventListeners = new Map<EventTarget, Array<{ event: string; handler: EventListener }>>();

  /**
   * Safe interval creation with automatic cleanup
   */
  static createInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Safe timeout creation with automatic cleanup
   */
  static createTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      callback();
      this.timeouts.delete(timeout);
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  /**
   * Safe event listener registration with automatic cleanup
   */
  static addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, []);
    }
    this.eventListeners.get(target)!.push({ event, handler });
  }

  /**
   * Clean up all registered intervals, timeouts, and event listeners
   */
  static cleanup(): void {
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Clear timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach(({ event, handler }) => {
        target.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  /**
   * Clear specific target's event listeners
   */
  static cleanupTarget(target: EventTarget): void {
    const listeners = this.eventListeners.get(target);
    if (listeners) {
      listeners.forEach(({ event, handler }) => {
        target.removeEventListener(event, handler);
      });
      this.eventListeners.delete(target);
    }
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  /**
   * Optimize React component re-renders
   */
  static memoizeCallback<T extends (...args: any[]) => any>(
    callback: T,
    dependencies: any[]
  ): T {
    let memoizedCallback: T;
    let lastDeps: any[];

    return ((...args: any[]) => {
      if (!lastDeps || !this.shallowEqual(dependencies, lastDeps)) {
        memoizedCallback = callback;
        lastDeps = [...dependencies];
      }
      return memoizedCallback(...args);
    }) as T;
  }

  /**
   * Shallow equality check for dependency arrays
   */
  private static shallowEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Optimize large list rendering with virtualization
   */
  static createVirtualizedList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    scrollTop: number
  ): { visibleItems: T[]; startIndex: number; endIndex: number } {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
    };
  }

  /**
   * Debounce function with immediate execution option
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;
    let result: ReturnType<T>;

    const debounced = ((...args: any[]) => {
      const later = () => {
        timeout = null;
        if (!immediate) result = func(...args);
      };

      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) result = func(...args);
      return result;
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    return debounced;
  }

  /**
   * Throttle function for high-frequency events
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T & { cancel: () => void } {
    let inThrottle: boolean;
    let lastResult: ReturnType<T>;

    const throttled = ((...args: any[]) => {
      if (!inThrottle) {
        lastResult = func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
      return lastResult;
    }) as T & { cancel: () => void };

    throttled.cancel = () => {
      inThrottle = false;
    };

    return throttled;
  }
}

/**
 * Common bug fixes
 */
export class BugFixes {
  /**
   * Fix timezone-related date issues
   */
  static normalizeDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Fix time format inconsistencies
   */
  static normalizeTime(time: string): string {
    // Handle various time formats and normalize to HH:MM
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i;
    const match = time.match(timeRegex);
    
    if (!match) {
      throw new Error('Invalid time format');
    }

    let [, hours, minutes, , period] = match;
    let hour = parseInt(hours, 10);
    
    // Handle 12-hour format
    if (period) {
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }

  /**
   * Fix race conditions in async operations
   */
  static createCancellablePromise<T>(
    promise: Promise<T>
  ): { promise: Promise<T>; cancel: () => void } {
    let isCancelled = false;

    const cancellablePromise = new Promise<T>((resolve, reject) => {
      promise
        .then(value => {
          if (!isCancelled) {
            resolve(value);
          }
        })
        .catch(error => {
          if (!isCancelled) {
            reject(error);
          }
        });
    });

    return {
      promise: cancellablePromise,
      cancel: () => {
        isCancelled = true;
      },
    };
  }

  /**
   * Fix form validation edge cases
   */
  static validateShiftTimes(startTime: string, endTime: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const normalizedStart = this.normalizeTime(startTime);
      const normalizedEnd = this.normalizeTime(endTime);

      // Check if end time is after start time
      if (normalizedStart >= normalizedEnd) {
        errors.push('End time must be after start time');
      }

      // Check for reasonable shift duration (not more than 24 hours)
      const startMinutes = this.timeToMinutes(normalizedStart);
      const endMinutes = this.timeToMinutes(normalizedEnd);
      const duration = endMinutes - startMinutes;

      if (duration > 24 * 60) {
        errors.push('Shift duration cannot exceed 24 hours');
      }

      if (duration < 15) {
        errors.push('Shift duration must be at least 15 minutes');
      }

    } catch (error) {
      errors.push('Invalid time format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert time string to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Fix keyboard event handling issues
   */
  static normalizeKeyboardEvent(event: KeyboardEvent): {
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  } {
    return {
      key: event.key.toLowerCase(),
      ctrlKey: event.ctrlKey || event.metaKey, // Handle Mac Cmd key
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    };
  }

  /**
   * Fix scroll position restoration issues
   */
  static saveScrollPosition(key: string): void {
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
    };
    sessionStorage.setItem(`scroll-${key}`, JSON.stringify(scrollPosition));
  }

  static restoreScrollPosition(key: string): void {
    const saved = sessionStorage.getItem(`scroll-${key}`);
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        window.scrollTo(x, y);
      } catch (error) {
        console.warn('Failed to restore scroll position:', error);
      }
    }
  }
}

/**
 * System health monitoring
 */
export class HealthMonitor {
  private static healthChecks = new Map<string, () => boolean>();
  private static lastHealthCheck = 0;
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Register a health check
   */
  static registerHealthCheck(name: string, check: () => boolean): void {
    this.healthChecks.set(name, check);
  }

  /**
   * Run all health checks
   */
  static runHealthChecks(): { healthy: boolean; issues: string[] } {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return { healthy: true, issues: [] };
    }

    this.lastHealthCheck = now;
    const issues: string[] = [];

    // Check cache health
    const cacheStats = templateCache.getStats();
    if (cacheStats.hitRate < 30) {
      issues.push('Low cache hit rate detected');
    }

    // Check performance
    const perfStats = performanceMonitor.getStats();
    if (perfStats.totalOperations > 0) {
      const avgDuration = perfStats.averageDuration;
      if (avgDuration > 2000) {
        issues.push('High average operation duration detected');
      }
    }

    // Check error rate
    const errorStats = errorHandler.getErrorStats();
    if (errorStats.total > 50) {
      issues.push('High error count detected');
    }

    // Run custom health checks
    this.healthChecks.forEach((check, name) => {
      try {
        if (!check()) {
          issues.push(`Health check failed: ${name}`);
        }
      } catch (error) {
        issues.push(`Health check error: ${name}`);
      }
    });

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  /**
   * Auto-recovery actions
   */
  static performAutoRecovery(): void {
    const health = this.runHealthChecks();
    
    if (!health.healthy) {
      console.warn('🏥 Health issues detected, performing auto-recovery:', health.issues);

      // Clear caches if hit rate is low
      if (health.issues.some(issue => issue.includes('cache hit rate'))) {
        templateCache.clearAll();
        console.log('🧹 Cleared template cache for recovery');
      }

      // Clear performance metrics if they're stale
      if (health.issues.some(issue => issue.includes('operation duration'))) {
        performanceMonitor.clear();
        console.log('🧹 Cleared performance metrics for recovery');
      }

      // Clear error log if it's too large
      if (health.issues.some(issue => issue.includes('error count'))) {
        errorHandler.clearLog();
        console.log('🧹 Cleared error log for recovery');
      }
    }
  }
}

// Initialize health monitoring
if (typeof window !== 'undefined') {
  // Register default health checks
  HealthMonitor.registerHealthCheck('memory', () => {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize < memory.jsHeapSizeLimit * 0.9;
    }
    return true;
  });

  // Run health checks periodically
  MemoryLeakPrevention.createInterval(() => {
    HealthMonitor.performAutoRecovery();
  }, 60000); // Every minute

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    MemoryLeakPrevention.cleanup();
  });
}

// All classes are already exported individually above
/**
 * Performance Monitoring Utility
 * Tracks performance metrics for shift operations
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;
  private timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    this.timers.set(operationId, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(operationId: string, operationName: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      console.warn(`⚠️ No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationId);

    this.recordMetric({
      name: operationName,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (metric.duration > 1000) { // > 1 second
      console.warn(`🐌 Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName?: string): PerformanceStats {
    const filteredMetrics = operationName 
      ? this.metrics.filter(m => m.name === operationName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
      };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      totalOperations: filteredMetrics.length,
      averageDuration: total / filteredMetrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Get performance report
   */
  getReport(): {
    overall: PerformanceStats;
    byOperation: Record<string, PerformanceStats>;
    slowOperations: PerformanceMetric[];
  } {
    const operationNames = Array.from(new Set(this.metrics.map(m => m.name)));
    const byOperation: Record<string, PerformanceStats> = {};

    operationNames.forEach(name => {
      byOperation[name] = this.getStats(name);
    });

    const slowOperations = this.metrics
      .filter(m => m.duration > 500) // > 500ms
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      overall: this.getStats(),
      byOperation,
      slowOperations,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for async functions
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    performanceMonitor.startTimer(operationId);

    try {
      const result = await fn(...args);
      performanceMonitor.endTimer(operationId, operationName, { success: true });
      return result;
    } catch (error) {
      performanceMonitor.endTimer(operationId, operationName, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }) as T;
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const startOperation = (operationName: string) => {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    performanceMonitor.startTimer(operationId);
    return operationId;
  };

  const endOperation = (operationId: string, operationName: string, metadata?: Record<string, any>) => {
    return performanceMonitor.endTimer(operationId, operationName, metadata);
  };

  const getStats = (operationName?: string) => {
    return performanceMonitor.getStats(operationName);
  };

  const getReport = () => {
    return performanceMonitor.getReport();
  };

  return {
    startOperation,
    endOperation,
    getStats,
    getReport,
  };
}

// Auto-report performance stats in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setInterval(() => {
    const report = performanceMonitor.getReport();
    if (report.overall.totalOperations > 0) {
      console.group('📊 Performance Report');
      console.log('Overall Stats:', report.overall);
      console.log('By Operation:', report.byOperation);
      if (report.slowOperations.length > 0) {
        console.warn('Slow Operations:', report.slowOperations);
      }
      console.groupEnd();
    }
  }, 30000); // Every 30 seconds
}
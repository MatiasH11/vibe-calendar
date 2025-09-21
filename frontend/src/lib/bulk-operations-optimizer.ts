/**
 * Bulk Operations Optimizer
 * Optimizes bulk shift operations for better performance
 */

import { ShiftFormData } from '@/types/shifts/forms';
import { ConflictValidationRequest } from '@/types/shifts/templates';
import { performanceMonitor } from './performance/performance-monitor';

interface BulkOperationConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: string }>;
  totalProcessed: number;
  duration: number;
}

class BulkOperationsOptimizer {
  private readonly defaultConfig: BulkOperationConfig = {
    batchSize: 50,
    maxConcurrency: 3,
    retryAttempts: 2,
    retryDelay: 1000,
  };

  /**
   * Process items in optimized batches
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    config: Partial<BulkOperationConfig> = {}
  ): Promise<BulkOperationResult<R>> {
    const operationId = `bulk-operation-${Date.now()}`;
    performanceMonitor.startTimer(operationId);
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const successful: R[] = [];
    const failed: Array<{ item: T; error: string }> = [];
    
    // Split items into batches
    const batches = this.createBatches(items, finalConfig.batchSize);
    
    try {
      // Process batches with controlled concurrency
      await this.processBatchesConcurrently(
        batches,
        async (batch) => {
          const batchResults = await this.processSingleBatch(
            batch,
            processor,
            finalConfig
          );
          successful.push(...batchResults.successful);
          failed.push(...batchResults.failed);
        },
        finalConfig.maxConcurrency
      );

      const duration = performanceMonitor.endTimer(
        operationId,
        'bulk-operation',
        {
          totalItems: items.length,
          successful: successful.length,
          failed: failed.length,
          batchSize: finalConfig.batchSize,
          maxConcurrency: finalConfig.maxConcurrency,
        }
      );

      return {
        successful,
        failed,
        totalProcessed: items.length,
        duration,
      };
    } catch (error) {
      performanceMonitor.endTimer(operationId, 'bulk-operation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalItems: items.length,
      });
      throw error;
    }
  }

  /**
   * Optimize conflict validation for bulk operations
   */
  async optimizeConflictValidation(
    shifts: ShiftFormData[],
    validator: (request: ConflictValidationRequest) => Promise<any>
  ): Promise<any> {
    // Group shifts by employee and date for more efficient validation
    const groupedShifts = this.groupShiftsByEmployeeAndDate(shifts);
    
    // Process each group separately to minimize conflict checking overhead
    const validationPromises = Object.entries(groupedShifts).map(
      async ([key, employeeShifts]) => {
        const [employeeId, date] = key.split('-');
        
        const request: ConflictValidationRequest = {
          shifts: employeeShifts.map(shift => ({
            company_employee_id: shift.company_employee_id,
            shift_date: shift.shift_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
          }))
        };

        return validator(request);
      }
    );

    // Execute validations with controlled concurrency
    return this.processBatchesConcurrently(
      validationPromises,
      (promise) => promise,
      3 // Max 3 concurrent validations
    );
  }

  /**
   * Optimize template usage tracking
   */
  async optimizeTemplateUsage(
    templateUsages: Array<{ templateId: number; count: number }>,
    updater: (templateId: number, count: number) => Promise<void>
  ): Promise<void> {
    // Batch template usage updates to reduce API calls
    const batchedUpdates = templateUsages.map(({ templateId, count }) => 
      () => updater(templateId, count)
    );

    await this.processBatch(
      batchedUpdates,
      (updateFn) => updateFn(),
      { batchSize: 10, maxConcurrency: 2 }
    );
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processSingleBatch<T, R>(
    batch: T[],
    processor: (item: T) => Promise<R>,
    config: BulkOperationConfig
  ): Promise<{ successful: R[]; failed: Array<{ item: T; error: string }> }> {
    const successful: R[] = [];
    const failed: Array<{ item: T; error: string }> = [];

    await Promise.allSettled(
      batch.map(async (item) => {
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
          try {
            const result = await processor(item);
            successful.push(result);
            return;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            
            if (attempt < config.retryAttempts) {
              await this.delay(config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            }
          }
        }
        
        failed.push({
          item,
          error: lastError?.message || 'Unknown error',
        });
      })
    );

    return { successful, failed };
  }

  private async processBatchesConcurrently<T>(
    batches: T[],
    processor: (batch: T) => Promise<void>,
    maxConcurrency: number
  ): Promise<void> {
    const semaphore = new Semaphore(maxConcurrency);
    
    await Promise.all(
      batches.map(async (batch) => {
        await semaphore.acquire();
        try {
          await processor(batch);
        } finally {
          semaphore.release();
        }
      })
    );
  }

  private groupShiftsByEmployeeAndDate(shifts: ShiftFormData[]): Record<string, ShiftFormData[]> {
    return shifts.reduce((groups, shift) => {
      const key = `${shift.company_employee_id}-${shift.shift_date}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(shift);
      return groups;
    }, {} as Record<string, ShiftFormData[]>);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Simple semaphore implementation for concurrency control
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

// Singleton instance
export const bulkOperationsOptimizer = new BulkOperationsOptimizer();

/**
 * Hook for optimized bulk operations
 */
export function useBulkOperationsOptimizer() {
  const processBatch = async <T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    config?: Partial<BulkOperationConfig>
  ) => {
    return bulkOperationsOptimizer.processBatch(items, processor, config);
  };

  const optimizeConflictValidation = async (
    shifts: ShiftFormData[],
    validator: (request: ConflictValidationRequest) => Promise<any>
  ) => {
    return bulkOperationsOptimizer.optimizeConflictValidation(shifts, validator);
  };

  const optimizeTemplateUsage = async (
    templateUsages: Array<{ templateId: number; count: number }>,
    updater: (templateId: number, count: number) => Promise<void>
  ) => {
    return bulkOperationsOptimizer.optimizeTemplateUsage(templateUsages, updater);
  };

  return {
    processBatch,
    optimizeConflictValidation,
    optimizeTemplateUsage,
  };
}
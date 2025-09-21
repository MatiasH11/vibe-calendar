/**
 * Performance Tests for Bulk Operations
 * Tests performance characteristics of bulk shift operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bulkOperationsOptimizer } from '@/lib/bulk-operations-optimizer';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { templateCache } from '@/lib/cache/template-cache';

// Mock data generators
function generateMockShifts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    company_employee_id: (i % 10) + 1, // 10 different employees
    shift_date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`, // 30 different dates
    start_time: '09:00',
    end_time: '17:00',
    notes: `Shift ${i + 1}`,
  }));
}

function generateMockTemplates(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Template ${i + 1}`,
    description: `Description ${i + 1}`,
    start_time: '09:00',
    end_time: '17:00',
    usage_count: Math.floor(Math.random() * 100),
    company_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }));
}

describe('Bulk Operations Performance', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    templateCache.clearAll();
    vi.clearAllMocks();
  });

  describe('Bulk Processing Performance', () => {
    it('should process small batches efficiently', async () => {
      const shifts = generateMockShifts(50);
      const processor = vi.fn().mockImplementation(async (shift) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return { ...shift, id: Math.random() };
      });

      const startTime = performance.now();
      
      const result = await bulkOperationsOptimizer.processBatch(
        shifts,
        processor,
        { batchSize: 10, maxConcurrency: 3 }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (allowing for concurrency)
      expect(duration).toBeLessThan(300); // 300ms for 50 items with 10ms each and concurrency
      expect(result.successful).toHaveLength(50);
      expect(result.failed).toHaveLength(0);
      expect(processor).toHaveBeenCalledTimes(50);
    });

    it('should handle large batches with controlled memory usage', async () => {
      const shifts = generateMockShifts(1000);
      const processor = vi.fn().mockImplementation(async (shift) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return { ...shift, id: Math.random() };
      });

      const startTime = performance.now();
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const result = await bulkOperationsOptimizer.processBatch(
        shifts,
        processor,
        { batchSize: 50, maxConcurrency: 5 }
      );

      const endTime = performance.now();
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds for 1000 items
      expect(result.successful).toHaveLength(1000);
      expect(result.failed).toHaveLength(0);

      // Memory usage should not grow excessively
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });

    it('should handle failures gracefully without blocking other operations', async () => {
      const shifts = generateMockShifts(100);
      const processor = vi.fn().mockImplementation(async (shift, index) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // Fail every 10th item
        if (shift.company_employee_id % 10 === 0) {
          throw new Error(`Failed processing shift ${index}`);
        }
        
        return { ...shift, id: Math.random() };
      });

      const result = await bulkOperationsOptimizer.processBatch(
        shifts,
        processor,
        { batchSize: 20, maxConcurrency: 4, retryAttempts: 1 }
      );

      // Should have some successes and some failures
      expect(result.successful.length).toBeGreaterThan(0);
      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.successful.length + result.failed.length).toBe(100);
    });
  });

  describe('Cache Performance', () => {
    it('should provide fast template lookups', async () => {
      const templates = generateMockTemplates(1000);
      const companyId = 1;

      // Warm up cache
      templateCache.setTemplates(companyId, templates);

      // Measure cache lookup performance
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const result = templateCache.getTemplates(companyId);
        expect(result).toHaveLength(1000);
      }

      const endTime = performance.now();
      const avgLookupTime = (endTime - startTime) / iterations;

      // Cache lookups should be very fast
      expect(avgLookupTime).toBeLessThan(1); // Less than 1ms per lookup
    });

    it('should handle cache eviction efficiently', () => {
      const companyId = 1;

      // Fill cache beyond capacity
      for (let i = 0; i < 2000; i++) {
        const templates = generateMockTemplates(10);
        templateCache.setTemplates(companyId, templates, { page: i });
      }

      const stats = templateCache.getStats();
      
      // Cache should have evicted old entries
      expect(stats.size).toBeLessThan(2000);
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should maintain good hit rates under normal usage', () => {
      const companyId = 1;
      const templates = generateMockTemplates(100);

      // Simulate normal usage pattern
      for (let i = 0; i < 100; i++) {
        // Set templates occasionally
        if (i % 10 === 0) {
          templateCache.setTemplates(companyId, templates, { page: i % 5 });
        }
        
        // Get templates frequently
        templateCache.getTemplates(companyId, { page: i % 5 });
      }

      const stats = templateCache.getStats();
      
      // Should have a reasonable hit rate
      expect(stats.hitRate).toBeGreaterThan(50); // At least 50% hit rate
    });
  });

  describe('Conflict Validation Performance', () => {
    it('should validate conflicts efficiently for large datasets', async () => {
      const shifts = generateMockShifts(500);
      const validator = vi.fn().mockImplementation(async (request) => {
        // Simulate conflict validation processing time
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          has_conflicts: Math.random() > 0.8, // 20% chance of conflicts
          conflicts: [],
        };
      });

      const startTime = performance.now();

      await bulkOperationsOptimizer.optimizeConflictValidation(shifts, validator);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete validation efficiently
      expect(duration).toBeLessThan(1000); // Less than 1 second
      
      // Should group validations to reduce API calls
      expect(validator).toHaveBeenCalledTimes(shifts.length / 10); // Grouped by employee-date
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance accurately', async () => {
      const operationName = 'test-operation';
      const operationId = 'test-123';

      performanceMonitor.startTimer(operationId);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = performanceMonitor.endTimer(operationId, operationName);

      expect(duration).toBeGreaterThan(90); // Should be around 100ms
      expect(duration).toBeLessThan(150); // Allow for some variance

      const stats = performanceMonitor.getStats(operationName);
      expect(stats.totalOperations).toBe(1);
      expect(stats.averageDuration).toBeCloseTo(duration, 10);
    });

    it('should identify slow operations', async () => {
      const slowOperationName = 'slow-operation';
      const fastOperationName = 'fast-operation';

      // Record slow operation
      performanceMonitor.recordMetric({
        name: slowOperationName,
        duration: 2000, // 2 seconds
        timestamp: Date.now(),
      });

      // Record fast operation
      performanceMonitor.recordMetric({
        name: fastOperationName,
        duration: 50, // 50ms
        timestamp: Date.now(),
      });

      const report = performanceMonitor.getReport();

      expect(report.slowOperations).toHaveLength(1);
      expect(report.slowOperations[0].name).toBe(slowOperationName);
      expect(report.byOperation[slowOperationName].averageDuration).toBe(2000);
      expect(report.byOperation[fastOperationName].averageDuration).toBe(50);
    });

    it('should calculate percentiles correctly', () => {
      const operationName = 'percentile-test';
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      durations.forEach(duration => {
        performanceMonitor.recordMetric({
          name: operationName,
          duration,
          timestamp: Date.now(),
        });
      });

      const stats = performanceMonitor.getStats(operationName);

      expect(stats.totalOperations).toBe(10);
      expect(stats.minDuration).toBe(10);
      expect(stats.maxDuration).toBe(100);
      expect(stats.averageDuration).toBe(55);
      expect(stats.p95Duration).toBe(100); // 95th percentile
      expect(stats.p99Duration).toBe(100); // 99th percentile
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up resources properly', () => {
      // Fill performance monitor with metrics
      for (let i = 0; i < 2000; i++) {
        performanceMonitor.recordMetric({
          name: `operation-${i % 10}`,
          duration: Math.random() * 1000,
          timestamp: Date.now(),
        });
      }

      const initialStats = performanceMonitor.getStats();
      expect(initialStats.totalOperations).toBe(1000); // Should be capped at MAX_METRICS

      // Clear and verify cleanup
      performanceMonitor.clear();
      const clearedStats = performanceMonitor.getStats();
      expect(clearedStats.totalOperations).toBe(0);
    });

    it('should handle concurrent operations without race conditions', async () => {
      const operationName = 'concurrent-test';
      const concurrentOperations = 50;

      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const operationId = `concurrent-${i}`;
        performanceMonitor.startTimer(operationId);
        
        // Simulate varying work durations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        return performanceMonitor.endTimer(operationId, operationName);
      });

      const durations = await Promise.all(promises);

      expect(durations).toHaveLength(concurrentOperations);
      durations.forEach(duration => {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThan(100);
      });

      const stats = performanceMonitor.getStats(operationName);
      expect(stats.totalOperations).toBe(concurrentOperations);
    });
  });
});
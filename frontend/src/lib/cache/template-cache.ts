/**
 * Template and Pattern Caching System
 * Implements in-memory caching with TTL and invalidation strategies
 */

import { ShiftTemplate, EmployeeShiftPattern, TimeSuggestion } from '@/types/shifts/templates';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

class TemplateCache {
  private templateCache = new Map<string, CacheEntry<ShiftTemplate[]>>();
  private patternCache = new Map<number, CacheEntry<EmployeeShiftPattern[]>>();
  private suggestionCache = new Map<string, CacheEntry<TimeSuggestion[]>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  // Cache TTL in milliseconds
  private readonly TEMPLATE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PATTERN_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly SUGGESTION_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Get templates from cache
   */
  getTemplates(companyId: number, filters?: any): ShiftTemplate[] | null {
    const key = this.generateTemplateKey(companyId, filters);
    const entry = this.templateCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.templateCache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set templates in cache
   */
  setTemplates(companyId: number, templates: ShiftTemplate[], filters?: any): void {
    const key = this.generateTemplateKey(companyId, filters);
    
    this.templateCache.set(key, {
      data: templates,
      timestamp: Date.now(),
      ttl: this.TEMPLATE_TTL,
    });

    this.enforceMaxSize();
    this.updateStats();
  }

  /**
   * Get employee patterns from cache
   */
  getPatterns(employeeId: number): EmployeeShiftPattern[] | null {
    const entry = this.patternCache.get(employeeId);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.patternCache.delete(employeeId);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set employee patterns in cache
   */
  setPatterns(employeeId: number, patterns: EmployeeShiftPattern[]): void {
    this.patternCache.set(employeeId, {
      data: patterns,
      timestamp: Date.now(),
      ttl: this.PATTERN_TTL,
    });

    this.enforceMaxSize();
    this.updateStats();
  }

  /**
   * Get suggestions from cache
   */
  getSuggestions(employeeId: number, context?: string): TimeSuggestion[] | null {
    const key = this.generateSuggestionKey(employeeId, context);
    const entry = this.suggestionCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.suggestionCache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set suggestions in cache
   */
  setSuggestions(employeeId: number, suggestions: TimeSuggestion[], context?: string): void {
    const key = this.generateSuggestionKey(employeeId, context);
    
    this.suggestionCache.set(key, {
      data: suggestions,
      timestamp: Date.now(),
      ttl: this.SUGGESTION_TTL,
    });

    this.enforceMaxSize();
    this.updateStats();
  }

  /**
   * Invalidate templates cache for a company
   */
  invalidateTemplates(companyId: number): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of Array.from(this.templateCache.entries())) {
      if (key.startsWith(`templates:${companyId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.templateCache.delete(key);
      this.stats.evictions++;
    });

    this.updateStats();
  }

  /**
   * Invalidate patterns cache for an employee
   */
  invalidatePatterns(employeeId: number): void {
    if (this.patternCache.delete(employeeId)) {
      this.stats.evictions++;
      this.updateStats();
    }
  }

  /**
   * Invalidate suggestions cache for an employee
   */
  invalidateSuggestions(employeeId: number): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of Array.from(this.suggestionCache.entries())) {
      if (key.startsWith(`suggestions:${employeeId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.suggestionCache.delete(key);
      this.stats.evictions++;
    });

    this.updateStats();
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    const totalSize = this.templateCache.size + this.patternCache.size + this.suggestionCache.size;
    
    this.templateCache.clear();
    this.patternCache.clear();
    this.suggestionCache.clear();
    
    this.stats.evictions += totalSize;
    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let evicted = 0;

    // Cleanup templates
    for (const [key, entry] of Array.from(this.templateCache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.templateCache.delete(key);
        evicted++;
      }
    }

    // Cleanup patterns
    for (const [key, entry] of Array.from(this.patternCache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.patternCache.delete(key);
        evicted++;
      }
    }

    // Cleanup suggestions
    for (const [key, entry] of Array.from(this.suggestionCache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.suggestionCache.delete(key);
        evicted++;
      }
    }

    this.stats.evictions += evicted;
    this.updateStats();
  }

  private generateTemplateKey(companyId: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'default';
    return `templates:${companyId}:${filterStr}`;
  }

  private generateSuggestionKey(employeeId: number, context?: string): string {
    return `suggestions:${employeeId}:${context || 'default'}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private enforceMaxSize(): void {
    const totalSize = this.templateCache.size + this.patternCache.size + this.suggestionCache.size;
    
    if (totalSize > this.MAX_CACHE_SIZE) {
      // Remove oldest entries from each cache proportionally
      const templatesToRemove = Math.floor(this.templateCache.size * 0.1);
      const patternsToRemove = Math.floor(this.patternCache.size * 0.1);
      const suggestionsToRemove = Math.floor(this.suggestionCache.size * 0.1);

      this.removeOldestEntries(this.templateCache, templatesToRemove);
      this.removeOldestEntries(this.patternCache, patternsToRemove);
      this.removeOldestEntries(this.suggestionCache, suggestionsToRemove);
    }
  }

  private removeOldestEntries<T>(cache: Map<any, CacheEntry<T>>, count: number): void {
    if (count <= 0) return;

    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    entries.forEach(([key]) => {
      cache.delete(key);
      this.stats.evictions++;
    });
  }

  private updateStats(): void {
    this.stats.size = this.templateCache.size + this.patternCache.size + this.suggestionCache.size;
  }
}

// Singleton instance
export const templateCache = new TemplateCache();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    templateCache.cleanup();
  }, 5 * 60 * 1000);
}
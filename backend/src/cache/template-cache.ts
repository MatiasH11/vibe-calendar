/**
 * Backend Template Caching System
 * Implements Redis-like caching for shift templates and patterns
 */

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

class BackendTemplateCache {
  private templateCache = new Map<string, CacheEntry<any>>();
  private patternCache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  // Cache TTL in milliseconds
  private readonly TEMPLATE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly PATTERN_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 5000;

  /**
   * Get templates from cache
   */
  getTemplates(companyId: number, filters?: any): any | null {
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
  setTemplates(companyId: number, templates: any, filters?: any): void {
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
  getPatterns(employeeId: number): any[] | null {
    const key = `patterns:${employeeId}`;
    const entry = this.patternCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.patternCache.delete(key);
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
  setPatterns(employeeId: number, patterns: any[]): void {
    const key = `patterns:${employeeId}`;
    
    this.patternCache.set(key, {
      data: patterns,
      timestamp: Date.now(),
      ttl: this.PATTERN_TTL,
    });

    this.enforceMaxSize();
    this.updateStats();
  }

  /**
   * Invalidate templates cache for a company
   */
  invalidateTemplates(companyId: number): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.templateCache) {
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
    const key = `patterns:${employeeId}`;
    if (this.patternCache.delete(key)) {
      this.stats.evictions++;
      this.updateStats();
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    const totalSize = this.templateCache.size + this.patternCache.size;
    
    this.templateCache.clear();
    this.patternCache.clear();
    
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
    for (const [key, entry] of this.templateCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.templateCache.delete(key);
        evicted++;
      }
    }

    // Cleanup patterns
    for (const [key, entry] of this.patternCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.patternCache.delete(key);
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

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private enforceMaxSize(): void {
    const totalSize = this.templateCache.size + this.patternCache.size;
    
    if (totalSize > this.MAX_CACHE_SIZE) {
      // Remove oldest entries from each cache proportionally
      const templatesToRemove = Math.floor(this.templateCache.size * 0.1);
      const patternsToRemove = Math.floor(this.patternCache.size * 0.1);

      this.removeOldestEntries(this.templateCache, templatesToRemove);
      this.removeOldestEntries(this.patternCache, patternsToRemove);
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
    this.stats.size = this.templateCache.size + this.patternCache.size;
  }
}

// Singleton instance
export const backendTemplateCache = new BackendTemplateCache();

// Auto-cleanup every 10 minutes
setInterval(() => {
  backendTemplateCache.cleanup();
}, 10 * 60 * 1000);
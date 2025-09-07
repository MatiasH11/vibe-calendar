interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtener item del cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Guardar item en cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Eliminar item del cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpiar cache por patrón
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new MemoryCache();

export class CacheHelper {
  /**
   * Generar clave de cache para empleados
   */
  static getEmployeeCacheKey(company_id: number, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `employees:${company_id}:${Buffer.from(filterString).toString('base64')}`;
  }

  /**
   * Generar clave de cache para roles
   */
  static getRoleCacheKey(company_id: number, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `roles:${company_id}:${Buffer.from(filterString).toString('base64')}`;
  }

  /**
   * Generar clave de cache para estadísticas
   */
  static getStatsCacheKey(company_id: number, type: string): string {
    return `stats:${company_id}:${type}`;
  }

  /**
   * Invalidar cache relacionado con empleados
   */
  static invalidateEmployeeCache(company_id: number): void {
    cacheService.deletePattern(`employees:${company_id}:`);
    cacheService.deletePattern(`stats:${company_id}:`);
  }

  /**
   * Invalidar cache relacionado con roles
   */
  static invalidateRoleCache(company_id: number): void {
    cacheService.deletePattern(`roles:${company_id}:`);
    cacheService.deletePattern(`stats:${company_id}:`);
  }
}

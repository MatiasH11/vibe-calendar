# 📄 FASE 4: Paginación Optimizada y Performance

## 🎯 Objetivo
Optimizar la paginación para manejar grandes volúmenes de datos, implementar cursor-based pagination para mejor performance y agregar cache inteligente para consultas frecuentes.

## 📝 PASO 1: Utilidad de Paginación Avanzada

### `src/utils/pagination.util.ts`
Crear utilidades de paginación reutilizables:

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    startIndex: number;
    endIndex: number;
  };
}

export interface CursorPaginationParams {
  cursor?: string; // Base64 encoded cursor
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    total?: number; // Opcional, costoso de calcular
  };
}

export class PaginationHelper {
  /**
   * Calcula metadata de paginación estándar
   */
  static calculatePagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex,
      endIndex,
    };
  }

  /**
   * Valida parámetros de paginación
   */
  static validatePaginationParams(page: number, limit: number) {
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  /**
   * Genera cursor para cursor-based pagination
   */
  static generateCursor(data: any, sortField: string): string {
    if (!data || !data[sortField]) {
      return '';
    }
    
    const cursorData = {
      value: data[sortField],
      id: data.id,
      timestamp: new Date().toISOString(),
    };
    
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decodifica cursor
   */
  static decodeCursor(cursor: string): { value: any; id: number; timestamp: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Construye condiciones WHERE para cursor pagination
   */
  static buildCursorConditions(
    cursor: string | undefined, 
    sortField: string, 
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    if (!cursor) {
      return {};
    }

    const decodedCursor = this.decodeCursor(cursor);
    if (!decodedCursor) {
      return {};
    }

    const { value, id } = decodedCursor;
    
    if (sortOrder === 'desc') {
      return {
        OR: [
          { [sortField]: { lt: value } },
          { 
            [sortField]: value,
            id: { lt: id }
          }
        ]
      };
    } else {
      return {
        OR: [
          { [sortField]: { gt: value } },
          { 
            [sortField]: value,
            id: { gt: id }
          }
        ]
      };
    }
  }
}
```

## 📝 PASO 2: Cache Service

### `src/services/cache.service.ts`
Implementar cache simple en memoria (en producción usar Redis):

```typescript
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
```

## 📝 PASO 3: Actualizar Servicio de Empleados con Cache

### Actualizar `src/services/employee.service.ts`
Agregar cache y cursor pagination:

```typescript
import { cacheService, CacheHelper } from './cache.service';
import { PaginationHelper, CursorPaginationParams, CursorPaginationResult } from '../utils/pagination.util';

// En el objeto employee_service, agregar estos métodos:

export const employee_service = {
  // ... métodos existentes mantenidos ...

  // NUEVO: Búsqueda con cache
  async findByCompanyWithFiltersAndCache(company_id: number, filters: EmployeeFiltersQuery) {
    const cacheKey = CacheHelper.getEmployeeCacheKey(company_id, filters);
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.findByCompanyWithFilters(company_id, filters);
    
    // Cache por 2 minutos para consultas frecuentes
    cacheService.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  },

  // NUEVO: Cursor-based pagination para listas grandes
  async findByCompanyWithCursor(
    company_id: number, 
    params: CursorPaginationParams & { search?: string; role_id?: number; is_active?: boolean }
  ): Promise<CursorPaginationResult<any>> {
    const { cursor, limit, sort_by = 'created_at', sort_order = 'desc', ...filters } = params;

    // Validar límites
    if (limit > 50) {
      throw new Error('Cursor pagination limit cannot exceed 50');
    }

    // Construir condiciones base
    const whereConditions: any = {
      company_id,
      deleted_at: null,
    };

    // Agregar filtros
    if (filters.role_id) {
      whereConditions.role_id = filters.role_id;
    }
    if (filters.is_active !== undefined) {
      whereConditions.is_active = filters.is_active;
    }
    if (filters.search) {
      whereConditions.OR = [
        { user: { first_name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { last_name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { role: { name: { contains: filters.search, mode: 'insensitive' } } },
        { position: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Agregar condiciones de cursor
    const cursorConditions = PaginationHelper.buildCursorConditions(cursor, sort_by, sort_order);
    if (Object.keys(cursorConditions).length > 0) {
      whereConditions.AND = [cursorConditions];
    }

    // Configurar ordenamiento
    const orderBy: any = {};
    switch (sort_by) {
      case 'user.first_name':
        orderBy.user = { first_name: sort_order };
        break;
      case 'user.last_name':
        orderBy.user = { last_name: sort_order };
        break;
      case 'role.name':
        orderBy.role = { name: sort_order };
        break;
      case 'created_at':
      default:
        orderBy.created_at = sort_order;
        break;
    }

    // Obtener datos (limit + 1 para saber si hay más)
    const employees = await prisma.company_employee.findMany({
      where: whereConditions,
      include: { 
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        }, 
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          }
        } 
      },
      orderBy: [orderBy, { id: sort_order }], // Ordenar por ID como tiebreaker
      take: limit + 1,
    });

    // Determinar si hay más páginas
    const hasNext = employees.length > limit;
    const data = hasNext ? employees.slice(0, limit) : employees;

    // Generar cursors
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (hasNext && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = PaginationHelper.generateCursor(lastItem, sort_by);
    }

    if (cursor && data.length > 0) {
      const firstItem = data[0];
      prevCursor = PaginationHelper.generateCursor(firstItem, sort_by);
    }

    return {
      data,
      pagination: {
        limit,
        hasNext,
        hasPrev: !!cursor,
        nextCursor,
        prevCursor,
      },
    };
  },

  // NUEVO: Invalidar cache después de operaciones de escritura
  async add(data: AddEmployeeBody, company_id: number) {
    // ... código existente del método add ...
    const result = await this.addEmployeeTransaction(data, company_id);
    
    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);
    
    return result;
  },

  async update(id: number, data: UpdateEmployeeBody, company_id: number) {
    // ... código existente del método update ...
    const result = await this.updateEmployeeTransaction(id, data, company_id);
    
    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);
    
    return result;
  },

  async softDelete(id: number, company_id: number) {
    // ... código existente del método softDelete ...
    const result = await this.softDeleteEmployeeTransaction(id, company_id);
    
    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);
    
    return result;
  },

  // Métodos auxiliares para transacciones (extraer lógica existente)
  private async addEmployeeTransaction(data: AddEmployeeBody, company_id: number) {
    // Mover aquí la lógica existente del método add original
    // ... lógica de transacción ...
  },

  private async updateEmployeeTransaction(id: number, data: UpdateEmployeeBody, company_id: number) {
    // Mover aquí la lógica existente del método update original
    // ... lógica de actualización ...
  },

  private async softDeleteEmployeeTransaction(id: number, company_id: number) {
    // Mover aquí la lógica existente del método softDelete original
    // ... lógica de soft delete ...
  },
};
```

## 📝 PASO 4: Actualizar Controller de Empleados

### Actualizar `src/controllers/employee.controller.ts`
Agregar endpoint de cursor pagination:

```typescript
// Agregar al final del archivo

// NUEVO: Handler con cursor pagination para listas grandes
export const getEmployeesWithCursorHandler = async (
  req: Request<{}, {}, {}, CursorPaginationParams & { search?: string; role_id?: number; is_active?: boolean }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    
    // Validar parámetros
    const limit = parseInt(req.query.limit?.toString() || '20');
    if (limit > 50) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_LIMIT', message: 'Cursor pagination limit cannot exceed 50' }
      });
    }

    const params = {
      ...req.query,
      limit,
      role_id: req.query.role_id ? parseInt(req.query.role_id.toString()) : undefined,
    };

    const result = await employee_service.findByCompanyWithCursor(company_id, params);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error?.message?.includes('pagination limit')) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'PAGINATION_ERROR', message: error.message }
      });
    }
    next(error);
  }
};

// NUEVO: Handler optimizado con cache
export const getEmployeesOptimizedHandler = async (
  req: Request<{}, {}, {}, EmployeeFiltersQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    
    // Usar cache para consultas frecuentes
    const result = await employee_service.findByCompanyWithFiltersAndCache(company_id, req.query);
    
    // Agregar header de cache
    res.set('X-Cache', 'MISS'); // En una implementación real, verificar si vino del cache
    
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.employees,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
```

## 📝 PASO 5: Middleware de Cache

### `src/middlewares/cache.middleware.ts`
Crear middleware de cache para endpoints específicos:

```typescript
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';

export interface CacheOptions {
  ttl?: number; // Time to live en milliseconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

/**
 * Middleware de cache genérico
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutos por defecto
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Saltar cache si está configurado
    if (skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = cacheService.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Interceptar el response
    const originalSend = res.send;
    res.send = function(data: any) {
      // Solo cachear respuestas exitosas
      if (res.statusCode === 200) {
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          if (parsedData.success) {
            cacheService.set(cacheKey, parsedData, ttl);
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }
      
      res.set('X-Cache', 'MISS');
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Generador de clave de cache por defecto
 */
function defaultKeyGenerator(req: Request): string {
  const company_id = req.user?.company_id || 'unknown';
  const path = req.path;
  const query = JSON.stringify(req.query);
  return `api:${company_id}:${path}:${Buffer.from(query).toString('base64')}`;
}

/**
 * Middleware específico para estadísticas (cache más largo)
 */
export const statsCache = cacheMiddleware({
  ttl: 10 * 60 * 1000, // 10 minutos para estadísticas
  keyGenerator: (req) => {
    const company_id = req.user?.company_id || 'unknown';
    return `stats:${company_id}:${req.path}`;
  },
});

/**
 * Middleware específico para listas (cache corto)
 */
export const listCache = cacheMiddleware({
  ttl: 2 * 60 * 1000, // 2 minutos para listas
  skipCache: (req) => {
    // No cachear si hay filtros de búsqueda dinámicos
    return !!(req.query.search && req.query.search.toString().length > 0);
  },
});
```

## 📝 PASO 6: Actualizar Rutas con Cache

### Actualizar `src/routes/employee.routes.ts`
Agregar cache y cursor pagination:

```typescript
import { cacheMiddleware, listCache } from '../middlewares/cache.middleware';

// Agregar nuevas rutas con cache

/**
 * @openapi
 * /employees/cursor:
 *   get:
 *     summary: List employees with cursor pagination (NEW - For large datasets)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Pagination cursor (base64 encoded)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *         description: Items per page (max 50 for performance)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name, email, role, position
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *         description: Filter by specific role
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ { id: 5, position: "Staff" } ]
 *               pagination: { limit: 20, hasNext: true, hasPrev: false, nextCursor: "eyJ2YWx1ZSI6I..." }
 */
router.get('/cursor', authMiddleware, adminMiddleware, getEmployeesWithCursorHandler);

/**
 * @openapi
 * /employees/optimized:
 *   get:
 *     summary: List employees with cache optimization (NEW)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search term
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *         description: Filter by role
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Items per page
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           X-Cache:
 *             schema: { type: string, enum: [HIT, MISS] }
 *             description: Cache status
 */
router.get('/optimized', authMiddleware, adminMiddleware, listCache, validate_query(employee_filters_schema), getEmployeesOptimizedHandler);
```

## ✅ Validación de la Fase 4

```bash
# 1. OBLIGATORIO: Verificar que no hay errores de TypeScript
cd backend && npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 2. Probar cursor pagination
curl "http://localhost:3001/api/v1/employees/cursor?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Probar con cursor específico
curl "http://localhost:3001/api/v1/employees/cursor?limit=5&cursor=CURSOR_FROM_PREVIOUS_RESPONSE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Probar endpoint optimizado con cache
curl "http://localhost:3001/api/v1/employees/optimized?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v  # Para ver headers de cache

# 5. Probar segunda vez (debería venir del cache)
curl "http://localhost:3001/api/v1/employees/optimized?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v  # X-Cache: HIT

# 6. Verificar performance con límites altos
curl "http://localhost:3001/api/v1/employees/cursor?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**CHECKLIST DE LA FASE 4:**
□ Utilidad de paginación implementada
□ Cache service funcional
□ Cursor pagination implementada
□ Cache middleware configurado
□ Endpoints optimizados con cache
□ Invalidación de cache automática
□ Performance mejorada para listas grandes
□ Headers de cache informativos
□ Límites de paginación validados
□ Build sin errores de TypeScript

## 🎯 Resultado de la Fase 4

- ✅ **Paginación cursor-based** para grandes datasets
- ✅ **Cache inteligente** con invalidación automática
- ✅ **Performance optimizada** para consultas frecuentes
- ✅ **Middleware reutilizable** de cache
- ✅ **Utilidades de paginación** centralizadas
- ✅ **Headers informativos** de estado de cache
- ✅ **Límites apropiados** para prevenir sobrecarga
- ✅ **Build sin errores** de TypeScript

**Paginación optimizada implementada** - Listo para validación y testing final en la siguiente fase.

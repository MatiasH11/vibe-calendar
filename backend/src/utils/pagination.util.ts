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

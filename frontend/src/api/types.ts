/**
 * Common API types used across all API modules
 */

// Pagination response
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Generic list response with pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Bulk operation result
export interface BulkOperationResult<T = unknown> {
  succeeded: T[];
  failed: Array<{
    index: number;
    item: unknown;
    error: string;
  }>;
  successCount: number;
  failureCount: number;
}

// Filter base interface
export interface BaseFilters {
  page?: string;
  limit?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Common response wrapper from backend
export interface ApiResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  statusCode?: number;
}

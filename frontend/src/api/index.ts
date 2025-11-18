/**
 * API Module Registry
 * Centralized exports for all API modules
 */

// Export all API modules
export { shiftAssignmentApi } from './shiftAssignmentApi';
export { templateShiftApi } from './templateShiftApi';
export { dayTemplateApi } from './dayTemplateApi';
export { employeeApi } from './employeeApi';
export { departmentApi } from './departmentApi';
export { locationApi } from './locationApi';
export { jobPositionApi } from './jobPositionApi';

// Export common types
export type {
  PaginationMeta,
  PaginatedResponse,
  BulkOperationResult,
  BaseFilters,
  ApiResponseWrapper,
} from './types';

// API Registry Object - Commented out temporarily due to build issues
// Provides a single import point for all API modules
// export const api = {
//   shiftAssignment: shiftAssignmentApi,
//   templateShift: templateShiftApi,
//   dayTemplate: dayTemplateApi,
//   employee: employeeApi,
//   department: departmentApi,
//   location: locationApi,
//   jobPosition: jobPositionApi,
// } as const;

// Type for the API registry
// export type ApiRegistry = typeof api;

/**
 * Usage examples:
 *
 * // Import specific module
 * import { shiftAssignmentApi } from '@/api';
 * const shifts = await shiftAssignmentApi.getAll();
 *
 * // Import registry
 * import { api } from '@/api';
 * const shifts = await api.shiftAssignment.getAll();
 *
 * // Import types
 * import type { PaginatedResponse } from '@/api';
 */

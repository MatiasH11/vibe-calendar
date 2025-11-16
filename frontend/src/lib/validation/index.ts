/**
 * Validation system - Single source of truth for frontend validation
 * Exports schemas, types, and React Hook Form resolvers
 */

// Export all schemas
export * from './schemas';

// Export all types
export type {
  // Shift Assignment
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentInput,
  ShiftAssignmentFilters,
  BulkCreateShiftAssignmentInput,
  BulkUpdateShiftAssignmentInput,
  BulkDeleteShiftAssignmentInput,
  ShiftAssignment,

  // Day Template
  CreateDayTemplateInput,
  UpdateDayTemplateInput,
  DayTemplateFilters,
  BulkCreateDayTemplateInput,
  DayTemplate,

  // Template Shift
  CreateTemplateShiftInput,
  UpdateTemplateShiftInput,
  TemplateShift,

  // Common
  PaginationParams,
  SortParams,
  DateRange,
  TimeRange,

  // Bulk Operations
  BulkOperationResult,

  // Validation
  ConflictInfo,
  RuleViolation,
  ValidationResult,

  // Coverage
  CoverageAnalysis,
  CoverageReport,
} from './types';

// Export all resolvers
export {
  // Shift Assignment resolvers
  createShiftAssignmentResolver,
  updateShiftAssignmentResolver,
  shiftAssignmentFiltersResolver,

  // Day Template resolvers
  createDayTemplateResolver,
  updateDayTemplateResolver,
  dayTemplateFiltersResolver,

  // Template Shift resolvers
  createTemplateShiftResolver,
  updateTemplateShiftResolver,

  // Common resolvers
  paginationResolver,
  sortResolver,
  dateRangeResolver,
  timeRangeResolver,

  // Helper functions
  createCustomResolver,
  createTimeRangeResolver,
  createDateRangeResolver,
} from './resolvers';

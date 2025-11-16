/**
 * TypeScript types extracted from Zod schemas
 * These types provide compile-time type safety matching backend validation
 */

import { z } from 'zod';
import * as schemas from './schemas';

// ============================================================================
// SHIFT ASSIGNMENT TYPES
// ============================================================================

export type CreateShiftAssignmentInput = z.infer<typeof schemas.createShiftAssignmentSchema>;
export type UpdateShiftAssignmentInput = z.infer<typeof schemas.updateShiftAssignmentSchema>;
export type ShiftAssignmentFilters = z.infer<typeof schemas.shiftAssignmentFiltersSchema>;
export type BulkCreateShiftAssignmentInput = z.infer<typeof schemas.bulkCreateShiftAssignmentSchema>;
export type BulkUpdateShiftAssignmentInput = z.infer<typeof schemas.bulkUpdateShiftAssignmentSchema>;
export type BulkDeleteShiftAssignmentInput = z.infer<typeof schemas.bulkDeleteShiftAssignmentSchema>;

// ============================================================================
// DAY TEMPLATE TYPES
// ============================================================================

export type CreateDayTemplateInput = z.infer<typeof schemas.createDayTemplateSchema>;
export type UpdateDayTemplateInput = z.infer<typeof schemas.updateDayTemplateSchema>;
export type DayTemplateFilters = z.infer<typeof schemas.dayTemplateFiltersSchema>;
export type BulkCreateDayTemplateInput = z.infer<typeof schemas.bulkCreateDayTemplateSchema>;

// ============================================================================
// TEMPLATE SHIFT TYPES
// ============================================================================

export type CreateTemplateShiftInput = z.infer<typeof schemas.createTemplateShiftSchema>;
export type UpdateTemplateShiftInput = z.infer<typeof schemas.updateTemplateShiftSchema>;

// ============================================================================
// COMMON TYPES
// ============================================================================

export type PaginationParams = z.infer<typeof schemas.paginationSchema>;
export type SortParams = z.infer<typeof schemas.sortSchema>;
export type DateRange = z.infer<typeof schemas.dateRangeSchema>;
export type TimeRange = z.infer<typeof schemas.timeRangeSchema>;

// ============================================================================
// API RESPONSE TYPES (Matching backend responses)
// ============================================================================

export interface ShiftAssignment {
  id: number;
  location_id: number;
  employee_id: number;
  job_position_id: number;
  template_shift_id?: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  assigned_by?: number;
  confirmed_by?: number;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DayTemplate {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface TemplateShift {
  id: number;
  day_template_id: number;
  name?: string;
  start_time: string;
  end_time: string;
  color?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// BULK OPERATION RESULT TYPES
// ============================================================================

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

// ============================================================================
// CONFLICT & VALIDATION TYPES
// ============================================================================

export interface ConflictInfo {
  type: 'overlap' | 'adjacent' | 'duplicate';
  existingShift: ShiftAssignment;
  message: string;
}

export interface RuleViolation {
  rule: string;
  message: string;
  details?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts?: ConflictInfo[];
  violations?: RuleViolation[];
}

// ============================================================================
// COVERAGE ANALYSIS TYPES
// ============================================================================

export interface CoverageAnalysis {
  date: string;
  position: string;
  required: number;
  assigned: number;
  confirmed: number;
  coverage: number; // Percentage
  status: 'understaffed' | 'optimal' | 'overstaffed';
}

export interface CoverageReport {
  startDate: string;
  endDate: string;
  totalDays: number;
  analysis: CoverageAnalysis[];
  summary: {
    totalRequired: number;
    totalAssigned: number;
    totalConfirmed: number;
    averageCoverage: number;
  };
}

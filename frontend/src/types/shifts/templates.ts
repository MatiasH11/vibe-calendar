// Shift Template Types
export interface ShiftTemplate {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  usage_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateShiftTemplateRequest {
  name: string;
  description?: string;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
}

export interface UpdateShiftTemplateRequest {
  name?: string;
  description?: string;
  start_time?: string; // HH:mm format
  end_time?: string;   // HH:mm format
}

// Employee Shift Pattern Types
export interface EmployeeShiftPattern {
  id: number;
  company_employee_id: number;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  frequency_count: number;
  last_used: string;  // ISO timestamp
  created_at: string;
  updated_at: string;
}

// Time Suggestion Types
export interface TimeSuggestion {
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  frequency: number;
  source: 'template' | 'pattern' | 'recent';
  label: string;
  template_id?: number; // If source is 'template'
  pattern_id?: number;  // If source is 'pattern'
}

// Bulk Operations Types
export interface ShiftDuplicationRequest {
  source_shift_ids: number[];
  target_dates?: string[];      // YYYY-MM-DD format
  target_employee_ids?: number[];
  preserve_employee?: boolean;
  preserve_date?: boolean;
}

export interface BulkShiftCreationRequest {
  employee_ids: number[];
  dates: string[];              // YYYY-MM-DD format
  start_time: string;           // HH:mm format
  end_time: string;             // HH:mm format
  notes?: string;
  template_id?: number;
}

export interface BulkOperationPreview {
  total_shifts: number;
  shifts_to_create: Array<{
    employee_id: number;
    employee_name: string;
    date: string;
    start_time: string;
    end_time: string;
  }>;
  conflicts: ConflictInfo[];
  warnings: string[];
}

// Conflict Resolution Types
export interface ConflictInfo {
  employee_id: number;
  employee_name: string;
  date: string;
  conflicting_shifts: Array<{
    id: number;
    start_time: string;
    end_time: string;
    notes?: string;
  }>;
  suggested_alternatives: Array<{
    start_time: string;
    end_time: string;
    reason: string;
  }>;
}

export interface ConflictValidationRequest {
  shifts: Array<{
    company_employee_id: number;
    shift_date: string;    // YYYY-MM-DD format
    start_time: string;    // HH:mm format
    end_time: string;      // HH:mm format
  }>;
}

export interface ConflictValidationResponse {
  has_conflicts: boolean;
  conflicts: ConflictInfo[];
  total_conflicts: number;
}

export enum ConflictResolution {
  SKIP = 'skip',           // Skip shifts with conflicts
  OVERWRITE = 'overwrite', // Overwrite existing shifts
  ADJUST = 'adjust',       // Auto-adjust times
  MANUAL = 'manual'        // Manual resolution required
}

export interface ConflictResolutionOptions {
  strategy: ConflictResolution;
  require_notes: boolean;
  auto_adjust_minutes: number;
  notify_affected_employees: boolean;
}

// Template Management Types
export interface TemplateListResponse {
  templates: ShiftTemplate[];
  total: number;
  page?: number;
  limit?: number;
}

export interface TemplateFilters {
  search?: string;
  sort_by?: 'name' | 'usage_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// Pattern and Suggestion Types
export interface EmployeePatternResponse {
  employee_id: number;
  patterns: EmployeeShiftPattern[];
  suggestions: TimeSuggestion[];
}

export interface SuggestionRequest {
  employee_id: number;
  date?: string;          // YYYY-MM-DD format, optional for context
  limit?: number;         // Max suggestions to return
}
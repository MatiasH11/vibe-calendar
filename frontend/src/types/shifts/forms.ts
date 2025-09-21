export interface ShiftFormData {
  company_employee_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

// Enhanced form data with template and bulk functionality
export interface EnhancedShiftFormData extends ShiftFormData {
  // Template functionality
  template_id?: number;
  use_template: boolean;
  
  // Bulk mode functionality
  bulk_mode: boolean;
  selected_employees?: number[];
  selected_dates?: string[];
  
  // Duplication functionality
  duplicate_source?: number;
  
  // Enhanced validation
  skip_conflict_validation?: boolean;
}

export interface ShiftFormErrors {
  company_employee_id?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  general?: string;
}

// Enhanced form errors with new validation types
export interface EnhancedShiftFormErrors extends ShiftFormErrors {
  template_id?: string;
  selected_employees?: string;
  selected_dates?: string;
  conflicts?: string;
  bulk_operation?: string;
}

import { EmployeeWithShifts } from './employee';
import { ShiftTemplate, TimeSuggestion, ConflictInfo } from './templates';

export interface ShiftFormProps {
  initialData?: Partial<ShiftFormData>;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  employees: EmployeeWithShifts[];
  selectedDate?: string;
  selectedEmployee?: number;
}

// Enhanced form props with template and suggestion support
export interface EnhancedShiftFormProps {
  initialData?: Partial<EnhancedShiftFormData>;
  onSubmit: (data: EnhancedShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  employees: EmployeeWithShifts[];
  selectedDate?: string;
  selectedEmployee?: number;
  
  // Enhanced functionality props
  enableTemplates?: boolean;
  enableShortcuts?: boolean;
  enableSuggestions?: boolean;
  enableBulkMode?: boolean;
  enableConflictValidation?: boolean;
  
  // Data for enhanced features
  templates?: ShiftTemplate[];
  suggestions?: TimeSuggestion[];
  conflicts?: ConflictInfo[];
  
  // Callbacks for enhanced features
  onTemplateSelect?: (template: ShiftTemplate) => void;
  onSuggestionSelect?: (suggestion: TimeSuggestion) => void;
  onConflictResolution?: (conflicts: ConflictInfo[]) => void;
}

// Form state for enhanced functionality
export interface ShiftFormEnhancements {
  templates: ShiftTemplate[];
  patterns: TimeSuggestion[];
  suggestions: TimeSuggestion[];
  conflicts: ConflictInfo[];
  shortcuts_enabled: boolean;
  real_time_validation: boolean;
}

// Form mode types
export type ShiftFormMode = 'create' | 'edit' | 'duplicate' | 'bulk' | 'template';

// Form validation state
export interface ShiftFormValidationState {
  isValidating: boolean;
  hasConflicts: boolean;
  conflicts: ConflictInfo[];
  suggestions: TimeSuggestion[];
  lastValidated: Date | null;
}

// Re-export types from shift.ts
export type { CreateShiftRequest, UpdateShiftRequest } from './shift';

// Re-export template types for convenience
export type { 
  ShiftTemplate, 
  TimeSuggestion, 
  ConflictInfo,
  ConflictResolution,
  BulkOperationPreview 
} from './templates';
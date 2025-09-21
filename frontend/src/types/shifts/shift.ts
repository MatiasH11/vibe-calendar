export interface Shift {
  id: number;
  company_employee_id: number;
  shift_date: string; // ISO date string (YYYY-MM-DD)
  start_time: string | Date; // HH:mm format or Date object
  end_time: string | Date;   // HH:mm format or Date object
  notes?: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  company_employee: {
    id: number;
    company_id: number;
    user_id: number;
    role_id: number;
    position?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      created_at: string;
      updated_at: string;
      deleted_at?: string;
    };
    role: {
      id: number;
      company_id: number;
      name: string;
      description?: string;
      color: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export interface CreateShiftRequest {
  company_employee_id: number;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  notes?: string;
}

export interface UpdateShiftRequest {
  company_employee_id?: number;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface ShiftFilters {
  start_date?: string;
  end_date?: string;
  employee_id?: number;
  role_id?: number;
  company_id?: number;
}

export interface ShiftListResponse {
  shifts: Shift[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Re-export types from other files
export type { WeekViewData, DayData, ShiftCell, ShiftGridProps } from './calendar';
export type { EmployeeWithShifts, ShiftByDay, EmployeeShiftSummary } from './employee';
export type { 
  ShiftTemplate, 
  CreateShiftTemplateRequest, 
  UpdateShiftTemplateRequest,
  EmployeeShiftPattern,
  TimeSuggestion,
  ShiftDuplicationRequest,
  BulkShiftCreationRequest,
  BulkOperationPreview,
  ConflictInfo,
  ConflictValidationRequest,
  ConflictValidationResponse,
  ConflictResolution,
  ConflictResolutionOptions,
  TemplateListResponse,
  TemplateFilters,
  EmployeePatternResponse,
  SuggestionRequest
} from './templates';
export type {
  KeyboardShortcut,
  ShortcutContext,
  ShortcutAction,
  ShortcutActionType,
  ShortcutContextState,
  ShortcutHelpItem,
  UseKeyboardShortcutsOptions,
  KeyboardShortcutsState
} from './shortcuts';
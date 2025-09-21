import { WeekViewData, EmployeeWithShifts, Shift, ShiftFilters } from './shift';
import { 
  ShiftTemplate, 
  EmployeeShiftPattern, 
  TimeSuggestion, 
  ConflictInfo,
  TemplateFilters,
  BulkOperationPreview 
} from './templates';

export interface ShiftsState {
  // Datos
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  currentWeek: string; // YYYY-MM-DD del lunes
  
  // Estados de carga
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Filtros
  filters: ShiftFilters;
  
  // UI State
  selectedShift: Shift | null;
  selectedEmployee: number | null;
  selectedDate: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  
  // Template Management State
  templates: ShiftTemplate[];
  templateFilters: TemplateFilters;
  isLoadingTemplates: boolean;
  isCreatingTemplate: boolean;
  isUpdatingTemplate: boolean;
  isDeletingTemplate: boolean;
  selectedTemplate: ShiftTemplate | null;
  showTemplateModal: boolean;
  showTemplateManager: boolean;
  
  // Pattern and Suggestion State
  employeePatterns: Map<number, EmployeeShiftPattern[]>;
  suggestions: TimeSuggestion[];
  isLoadingPatterns: boolean;
  isLoadingSuggestions: boolean;
  
  // Conflict Validation State
  conflicts: ConflictInfo[];
  isValidatingConflicts: boolean;
  realTimeValidation: boolean;
  
  // Bulk Operations State
  bulkMode: boolean;
  selectedEmployees: number[];
  selectedDates: string[];
  bulkPreview: BulkOperationPreview | null;
  isGeneratingPreview: boolean;
  isBulkCreating: boolean;
  
  // Keyboard Shortcuts State
  shortcutsEnabled: boolean;
  showShortcutHelp: boolean;
  
  // Acciones
  setWeekData: (data: WeekViewData) => void;
  setEmployees: (employees: EmployeeWithShifts[]) => void;
  setCurrentWeek: (week: string) => void;
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setFilters: (filters: Partial<ShiftFilters>) => void;
  setSelectedShift: (shift: Shift | null) => void;
  setSelectedEmployee: (employeeId: number | null) => void;
  setSelectedDate: (date: string | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  
  // Template Management Actions
  setTemplates: (templates: ShiftTemplate[]) => void;
  setTemplateFilters: (filters: Partial<TemplateFilters>) => void;
  setLoadingTemplates: (loading: boolean) => void;
  setCreatingTemplate: (creating: boolean) => void;
  setUpdatingTemplate: (updating: boolean) => void;
  setDeletingTemplate: (deleting: boolean) => void;
  setSelectedTemplate: (template: ShiftTemplate | null) => void;
  setShowTemplateModal: (show: boolean) => void;
  setShowTemplateManager: (show: boolean) => void;
  addTemplate: (template: ShiftTemplate) => void;
  updateTemplate: (template: ShiftTemplate) => void;
  removeTemplate: (templateId: number) => void;
  
  // Pattern and Suggestion Actions
  setEmployeePatterns: (employeeId: number, patterns: EmployeeShiftPattern[]) => void;
  setSuggestions: (suggestions: TimeSuggestion[]) => void;
  setLoadingPatterns: (loading: boolean) => void;
  setLoadingSuggestions: (loading: boolean) => void;
  clearPatterns: (employeeId?: number) => void;
  
  // Conflict Validation Actions
  setConflicts: (conflicts: ConflictInfo[]) => void;
  setValidatingConflicts: (validating: boolean) => void;
  setRealTimeValidation: (enabled: boolean) => void;
  clearConflicts: () => void;
  
  // Bulk Operations Actions
  setBulkMode: (enabled: boolean) => void;
  setSelectedEmployees: (employeeIds: number[]) => void;
  setSelectedDates: (dates: string[]) => void;
  setBulkPreview: (preview: BulkOperationPreview | null) => void;
  setGeneratingPreview: (generating: boolean) => void;
  setBulkCreating: (creating: boolean) => void;
  clearBulkSelection: () => void;
  
  // Keyboard Shortcuts Actions
  setShortcutsEnabled: (enabled: boolean) => void;
  setShowShortcutHelp: (show: boolean) => void;
  
  // Enhanced data actions
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  removeShift: (shiftId: number) => void;
  refreshWeekData: () => Promise<void>;
  navigateWeek: (direction: 'prev' | 'next') => void;
  
  // Enhanced template management actions
  loadTemplates: () => Promise<void>;
  createTemplate: (templateData: any) => Promise<ShiftTemplate>;
  updateTemplateById: (id: number, templateData: any) => Promise<ShiftTemplate>;
  deleteTemplate: (id: number) => Promise<void>;
  
  // Enhanced pattern management actions
  loadEmployeePatterns: (employeeId: number) => Promise<void>;
  generateSuggestions: (employeeId: number, context?: any) => Promise<void>;
  
  // Enhanced conflict validation actions
  validateConflicts: (shifts: any[]) => Promise<ConflictInfo[]>;
  
  // Enhanced bulk operations actions
  generateBulkPreview: (request: any) => Promise<BulkOperationPreview>;
  executeBulkOperation: (request: any) => Promise<any>;
  
  // Cache management
  clearCache: () => void;
  
  // Utility methods
  getEmployeePatterns: (employeeId: number) => EmployeeShiftPattern[];
  getMostUsedTemplates: (limit?: number) => ShiftTemplate[];
  getRecentPatterns: (employeeId: number, limit?: number) => EmployeeShiftPattern[];
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShiftsState } from '@/types/shifts/store';
import type {
  WeekViewData,
  EmployeeWithShifts,
  Shift,
  ShiftTemplate,
  EmployeeShiftPattern,
  TimeSuggestion,
  ConflictInfo,
  TemplateFilters,
  BulkOperationPreview
} from '@/types/shifts/shift';

/**
 * Shifts Store - Refactored to integrate with new API pattern
 *
 * This store now focuses on:
 * - Cross-component UI state (modals, selections, filters)
 * - Client-side data caching and transformations
 * - Complex state coordination between multiple components
 *
 * API calls should be made through hooks (useShift, useTemplateShift, etc.)
 * This store provides convenience methods for backward compatibility but
 * components should migrate to using hooks directly.
 *
 * DEPRECATED methods are marked and will be removed in future versions.
 */

export const useShiftsStore = create<ShiftsState>()(
  persist(
    (set, get) => ({
  // Estado inicial - Datos
  weekData: null,
  employees: [],
  currentWeek: new Date().toISOString().split('T')[0],
  
  // Estados de carga
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  
  // Filtros
  filters: {},
  
  // UI State
  selectedShift: null,
  selectedEmployee: null,
  selectedDate: null,
  showCreateModal: false,
  showEditModal: false,
  showDeleteModal: false,
  
  // Template Management State
  templates: [],
  templateFilters: {},
  isLoadingTemplates: false,
  isCreatingTemplate: false,
  isUpdatingTemplate: false,
  isDeletingTemplate: false,
  selectedTemplate: null,
  showTemplateModal: false,
  showTemplateManager: false,
  
  // Pattern and Suggestion State
  employeePatterns: new Map<number, EmployeeShiftPattern[]>(),
  suggestions: [],
  isLoadingPatterns: false,
  isLoadingSuggestions: false,
  
  // Conflict Validation State
  conflicts: [],
  isValidatingConflicts: false,
  realTimeValidation: false,
  
  // Bulk Operations State
  bulkMode: false,
  selectedEmployees: [],
  selectedDates: [],
  bulkPreview: null,
  isGeneratingPreview: false,
  isBulkCreating: false,
  
  // Keyboard Shortcuts State
  shortcutsEnabled: true,
  showShortcutHelp: false,

  // Setters básicos
  setWeekData: (data) => set({ weekData: data }),
  setEmployees: (employees) => set({ employees }),
  setCurrentWeek: (week) => set({ currentWeek: week }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCreating: (creating) => set({ isCreating: creating }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setDeleting: (deleting) => set({ isDeleting: deleting }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedShift: (shift) => set({ selectedShift: shift }),
  setSelectedEmployee: (employeeId) => set({ selectedEmployee: employeeId }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowEditModal: (show) => set({ showEditModal: show }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  
  // Template Management Actions
  setTemplates: (templates) => set({ templates }),
  setTemplateFilters: (filters) => set({ templateFilters: { ...get().templateFilters, ...filters } }),
  setLoadingTemplates: (loading) => set({ isLoadingTemplates: loading }),
  setCreatingTemplate: (creating) => set({ isCreatingTemplate: creating }),
  setUpdatingTemplate: (updating) => set({ isUpdatingTemplate: updating }),
  setDeletingTemplate: (deleting) => set({ isDeletingTemplate: deleting }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setShowTemplateModal: (show) => set({ showTemplateModal: show }),
  setShowTemplateManager: (show) => set({ showTemplateManager: show }),
  addTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (template) => set((state) => ({ 
    templates: state.templates.map(t => t.id === template.id ? template : t) 
  })),
  removeTemplate: (templateId) => set((state) => ({ 
    templates: state.templates.filter(t => t.id !== templateId) 
  })),
  
  // Pattern and Suggestion Actions
  setEmployeePatterns: (employeeId, patterns) => set((state) => {
    const newPatterns = new Map(state.employeePatterns);
    newPatterns.set(employeeId, patterns);
    return { employeePatterns: newPatterns };
  }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoadingPatterns: (loading) => set({ isLoadingPatterns: loading }),
  setLoadingSuggestions: (loading) => set({ isLoadingSuggestions: loading }),
  clearPatterns: (employeeId) => set((state) => {
    if (employeeId) {
      const newPatterns = new Map(state.employeePatterns);
      newPatterns.delete(employeeId);
      return { employeePatterns: newPatterns };
    }
    return { employeePatterns: new Map() };
  }),
  
  // Conflict Validation Actions
  setConflicts: (conflicts) => set({ conflicts }),
  setValidatingConflicts: (validating) => set({ isValidatingConflicts: validating }),
  setRealTimeValidation: (enabled) => set({ realTimeValidation: enabled }),
  clearConflicts: () => set({ conflicts: [] }),
  
  // Bulk Operations Actions
  setBulkMode: (enabled) => set({ bulkMode: enabled }),
  setSelectedEmployees: (employeeIds) => set({ selectedEmployees: employeeIds }),
  setSelectedDates: (dates) => set({ selectedDates: dates }),
  setBulkPreview: (preview) => set({ bulkPreview: preview }),
  setGeneratingPreview: (generating) => set({ isGeneratingPreview: generating }),
  setBulkCreating: (creating) => set({ isBulkCreating: creating }),
  clearBulkSelection: () => set({ 
    selectedEmployees: [], 
    selectedDates: [], 
    bulkPreview: null 
  }),
  
  // Keyboard Shortcuts Actions
  setShortcutsEnabled: (enabled) => set({ shortcutsEnabled: enabled }),
  setShowShortcutHelp: (show) => set({ showShortcutHelp: show }),

  // Enhanced data actions with template and pattern integration
  addShift: (shift) => {
    const state = get();
    
    // Update week data if available
    if (state.weekData) {
      const updatedWeekData = { ...state.weekData };
      // Find the correct day and add the shift
      const shiftDate = typeof shift.shift_date === 'string' ? shift.shift_date : shift.shift_date;
      const dayData = updatedWeekData.days.find(day => day.date === shiftDate);
      if (dayData) {
        dayData.shifts.push(shift);
      }
      set({ weekData: updatedWeekData });
    }
    
    // Update employee patterns based on the new shift
    const employeeId = shift.company_employee_id;
    const startTime = typeof shift.start_time === 'string' ? shift.start_time : 
      shift.start_time.toTimeString().slice(0, 5);
    const endTime = typeof shift.end_time === 'string' ? shift.end_time : 
      shift.end_time.toTimeString().slice(0, 5);
    
    // Update pattern frequency
    const currentPatterns = state.employeePatterns.get(employeeId) || [];
    const existingPattern = currentPatterns.find(p => 
      p.start_time === startTime && p.end_time === endTime
    );
    
    if (existingPattern) {
      existingPattern.frequency_count += 1;
      existingPattern.last_used = new Date().toISOString();
    } else {
      currentPatterns.push({
        id: Date.now(), // Temporary ID
        company_employee_id: employeeId,
        start_time: startTime,
        end_time: endTime,
        frequency_count: 1,
        last_used: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    get().setEmployeePatterns(employeeId, currentPatterns);
  },

  updateShift: (shift) => {
    const state = get();
    if (state.weekData) {
      const updatedWeekData = { ...state.weekData };
      // Find and update the shift in the week data
      updatedWeekData.days.forEach(day => {
        const shiftIndex = day.shifts.findIndex(s => s.id === shift.id);
        if (shiftIndex !== -1) {
          day.shifts[shiftIndex] = shift;
        }
      });
      set({ weekData: updatedWeekData });
    }
  },

  removeShift: (shiftId) => {
    const state = get();
    if (state.weekData) {
      const updatedWeekData = { ...state.weekData };
      // Remove the shift from week data
      updatedWeekData.days.forEach(day => {
        day.shifts = day.shifts.filter(s => s.id !== shiftId);
      });
      set({ weekData: updatedWeekData });
    }
  },

  /**
   * @deprecated Use useShift().loadWeekView() instead
   * Kept for backward compatibility
   */
  refreshWeekData: async () => {
    const state = get();
    set({ isLoading: true });
    try {
      // DEPRECATED: This method makes direct API calls
      // Components should use useShift().loadWeekView() instead
      console.warn('[DEPRECATED] refreshWeekData: Use useShift().loadWeekView() instead');

      // Keeping implementation for backward compatibility
      // TODO: Remove this method once all components are migrated
      set({ weekData: null }); // Clear for now - components should use hooks
    } catch (error) {
      console.error('Error refreshing week data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  navigateWeek: (direction) => {
    const state = get();
    const currentDate = new Date(state.currentWeek);
    const newDate = direction === 'next' 
      ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const newWeek = newDate.toISOString().split('T')[0];
    set({ currentWeek: newWeek });
    
    // Auto-refresh data for the new week
    get().refreshWeekData();
  },

  /**
   * @deprecated Use useTemplateShift().loadAll() instead
   * Kept for backward compatibility
   */
  loadTemplates: async () => {
    console.warn('[DEPRECATED] loadTemplates: Use useTemplateShift().loadAll() instead');
    set({ isLoadingTemplates: true, templates: [] });
    set({ isLoadingTemplates: false });
  },

  /**
   * @deprecated Use useTemplateShift().create() instead
   * Kept for backward compatibility
   */
  createTemplate: async (templateData) => {
    console.warn('[DEPRECATED] createTemplate: Use useTemplateShift().create() instead');
    set({ isCreatingTemplate: true });
    set({ isCreatingTemplate: false });
    throw new Error('Use useTemplateShift().create() instead');
  },

  /**
   * @deprecated Use useTemplateShift().update() instead
   * Kept for backward compatibility
   */
  updateTemplateById: async (id, templateData) => {
    console.warn('[DEPRECATED] updateTemplateById: Use useTemplateShift().update() instead');
    set({ isUpdatingTemplate: true });
    set({ isUpdatingTemplate: false });
    throw new Error('Use useTemplateShift().update() instead');
  },

  /**
   * @deprecated Use useTemplateShift().delete() instead
   * Kept for backward compatibility
   */
  deleteTemplate: async (id) => {
    console.warn('[DEPRECATED] deleteTemplate: Use useTemplateShift().delete() instead');
    set({ isDeletingTemplate: true });
    set({ isDeletingTemplate: false });
    throw new Error('Use useTemplateShift().delete() instead');
  },

  /**
   * @deprecated Use useShift().getEmployeePatterns() instead
   * Kept for backward compatibility
   */
  loadEmployeePatterns: async (employeeId) => {
    console.warn('[DEPRECATED] loadEmployeePatterns: Use useShift().getEmployeePatterns() instead');
    set({ isLoadingPatterns: true });
    set({ isLoadingPatterns: false });
  },

  /**
   * @deprecated Use useShift().getSuggestions() instead
   * Kept for backward compatibility
   */
  generateSuggestions: async (employeeId, context = {}) => {
    console.warn('[DEPRECATED] generateSuggestions: Use useShift().getSuggestions() instead');
    set({ isLoadingSuggestions: true });
    set({ isLoadingSuggestions: false });
  },

  /**
   * @deprecated Use useShift().validateConflicts() instead
   * Kept for backward compatibility
   */
  validateConflicts: async (shifts) => {
    console.warn('[DEPRECATED] validateConflicts: Use useShift().validateConflicts() instead');
    set({ isValidatingConflicts: true });
    set({ isValidatingConflicts: false });
    return [];
  },

  /**
   * @deprecated Use useShift().bulkCreate() instead
   * Kept for backward compatibility
   */
  generateBulkPreview: async (request) => {
    console.warn('[DEPRECATED] generateBulkPreview: Use useShift() for bulk operations instead');
    set({ isGeneratingPreview: true });
    set({ isGeneratingPreview: false });
    throw new Error('Use useShift() for bulk operations instead');
  },

  /**
   * @deprecated Use useShift().bulkCreate() instead
   * Kept for backward compatibility
   */
  executeBulkOperation: async (request) => {
    console.warn('[DEPRECATED] executeBulkOperation: Use useShift().bulkCreate() instead');
    set({ isBulkCreating: true });
    set({ isBulkCreating: false });
    throw new Error('Use useShift().bulkCreate() instead');
  },

  // Cache management
  clearCache: () => {
    set({
      templates: [],
      employeePatterns: new Map(),
      suggestions: [],
      conflicts: [],
      bulkPreview: null
    });
  },

  // Utility methods
  getEmployeePatterns: (employeeId) => {
    return get().employeePatterns.get(employeeId) || [];
  },

  getMostUsedTemplates: (limit = 5) => {
    return get().templates
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  },

  getRecentPatterns: (employeeId, limit = 3) => {
    const patterns = get().employeePatterns.get(employeeId) || [];
    return patterns
      .sort((a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime())
      .slice(0, limit);
  },
}),
{
  name: 'shifts-store',
  partialize: (state) => ({
    // Persist only essential state, not loading states or temporary data
    currentWeek: state.currentWeek,
    filters: state.filters,
    templateFilters: state.templateFilters,
    shortcutsEnabled: state.shortcutsEnabled,
    realTimeValidation: state.realTimeValidation,
    bulkMode: state.bulkMode,
  }),
}
)
);

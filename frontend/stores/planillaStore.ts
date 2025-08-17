import { create } from 'zustand';
import { Employee, Shift, PlanillaFilters, DraggedShift, CellPosition, CustomShiftData } from '@/lib/types';

interface PlanillaState {
  // Empleados
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  
  // Filtros originales
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  
  selectedAvailability: string[];
  setSelectedAvailability: (availability: string[]) => void;
  
  selectedWorkload: string[];
  setSelectedWorkload: (workload: string[]) => void;
  
  sortBy: 'name' | 'role' | 'hours';
  setSortBy: (sortBy: 'name' | 'role' | 'hours') => void;
  
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Nuevos filtros avanzados
  planillaFilters: PlanillaFilters;
  setPlanillaFilters: (filters: PlanillaFilters) => void;
  updatePlanillaFilter: (key: keyof PlanillaFilters, value: string) => void;
  clearPlanillaFilters: () => void;

  // Drag & Drop
  draggedShift: DraggedShift | null;
  setDraggedShift: (shift: DraggedShift | null) => void;
  dragOverCell: CellPosition | null;
  setDragOverCell: (cell: CellPosition | null) => void;

  // Selección de celda y modales
  selectedCell: CellPosition | null;
  setSelectedCell: (cell: CellPosition | null) => void;
  showCustomForm: boolean;
  setShowCustomForm: (show: boolean) => void;
  customShift: CustomShiftData;
  setCustomShift: (shift: CustomShiftData) => void;
  
  // Vista
  viewMode: 'compact' | 'detailed' | 'timeline';
  setViewMode: (mode: 'compact' | 'detailed' | 'timeline') => void;
  
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  
  showDuration: boolean;
  setShowDuration: (show: boolean) => void;
  
  showStatus: boolean;
  setShowStatus: (show: boolean) => void;
  
  showEmployeeStats: boolean;
  setShowEmployeeStats: (show: boolean) => void;
  
  // Semana actual
  currentWeekStart: Date;
  setCurrentWeekStart: (date: Date) => void;
  
  // Turnos
  shifts: Shift[];
  setShifts: (shifts: Shift[]) => void;
  
  // Estados de carga
  isLoadingShifts: boolean;
  setIsLoadingShifts: (loading: boolean) => void;
  
  shiftsError: string | null;
  setShiftsError: (error: string | null) => void;
  
  // Acciones
  clearFilters: () => void;
  getFilteredEmployees: () => Employee[];
}

export const usePlanillaStore = create<PlanillaState>((set, get) => ({
  // Estado inicial
  employees: [],
  searchTerm: '',
  selectedRoles: [],
  selectedAvailability: [],
  selectedWorkload: [],
  sortBy: 'name',
  sortOrder: 'asc',
  viewMode: 'detailed',
  showNotes: true,
  showDuration: true,
  showStatus: true,
  showEmployeeStats: true,
  currentWeekStart: new Date(),
  shifts: [],
  isLoadingShifts: false,
  shiftsError: null,

  // Nuevos estados
  planillaFilters: {
    searchEmployee: '',
    filterRole: '',
    filterShiftType: '',
    filterDay: '',
  },
  draggedShift: null,
  dragOverCell: null,
  selectedCell: null,
  showCustomForm: false,
  customShift: {
    code: '',
    startTime: '',
    endTime: '',
  },
  
  // Setters
  setEmployees: (employees) => set({ employees }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedRoles: (selectedRoles) => set({ selectedRoles }),
  setSelectedAvailability: (selectedAvailability) => set({ selectedAvailability }),
  setSelectedWorkload: (selectedWorkload) => set({ selectedWorkload }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowNotes: (showNotes) => set({ showNotes }),
  setShowDuration: (showDuration) => set({ showDuration }),
  setShowStatus: (showStatus) => set({ showStatus }),
  setShowEmployeeStats: (showEmployeeStats) => set({ showEmployeeStats }),
  setCurrentWeekStart: (currentWeekStart) => set({ currentWeekStart }),
  setShifts: (shifts) => set({ shifts }),
  setIsLoadingShifts: (isLoadingShifts) => set({ isLoadingShifts }),
  setShiftsError: (shiftsError) => set({ shiftsError }),

  // Nuevos setters
  setPlanillaFilters: (planillaFilters) => set({ planillaFilters }),
  updatePlanillaFilter: (key, value) => set((state) => ({
    planillaFilters: { ...state.planillaFilters, [key]: value }
  })),
  clearPlanillaFilters: () => set({
    planillaFilters: {
      searchEmployee: '',
      filterRole: '',
      filterShiftType: '',
      filterDay: '',
    }
  }),
  setDraggedShift: (draggedShift) => set({ draggedShift }),
  setDragOverCell: (dragOverCell) => set({ dragOverCell }),
  setSelectedCell: (selectedCell) => set({ selectedCell }),
  setShowCustomForm: (showCustomForm) => set({ showCustomForm }),
  setCustomShift: (customShift) => set({ customShift }),
  
  // Acciones
  clearFilters: () => set({
    searchTerm: '',
    selectedRoles: [],
    selectedAvailability: [],
    selectedWorkload: [],
    sortBy: 'name',
    sortOrder: 'asc'
  }),
  
  getFilteredEmployees: () => {
    const state = get();
    let filtered = [...state.employees];
    
    // Filtro por búsqueda
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.user.first_name.toLowerCase().includes(term) ||
        emp.user.last_name.toLowerCase().includes(term) ||
        emp.user.email?.toLowerCase().includes(term) ||
        emp.role.name.toLowerCase().includes(term)
      );
    }
    
    // Filtro por roles
    if (state.selectedRoles.length > 0) {
      filtered = filtered.filter(emp => 
        state.selectedRoles.includes(emp.role.name)
      );
    }
    
    // Filtro por disponibilidad
    if (state.selectedAvailability.length > 0) {
      filtered = filtered.filter(emp => {
        // Lógica de disponibilidad basada en turnos de la semana
        const employeeShifts = state.shifts.filter(shift => shift.company_employee_id === emp.id);
        const hasShifts = employeeShifts.length > 0;
        
        if (state.selectedAvailability.includes('available') && !hasShifts) return true;
        if (state.selectedAvailability.includes('busy') && hasShifts) return true;
        if (state.selectedAvailability.includes('partial') && hasShifts && employeeShifts.length < 7) return true;
        
        return false;
      });
    }
    
    // Filtro por carga de trabajo
    if (state.selectedWorkload.length > 0) {
      filtered = filtered.filter(emp => {
        const employeeShifts = state.shifts.filter(shift => shift.company_employee_id === emp.id);
        const totalHours = employeeShifts.reduce((acc, shift) => {
          const start = new Date(`2000-01-01T${shift.start_time}`);
          const end = new Date(`2000-01-01T${shift.end_time}`);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);
        
        if (state.selectedWorkload.includes('light') && totalHours < 20) return true;
        if (state.selectedWorkload.includes('normal') && totalHours >= 20 && totalHours <= 40) return true;
        if (state.selectedWorkload.includes('heavy') && totalHours > 40) return true;
        
        return false;
      });
    }
    
    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (state.sortBy) {
        case 'name':
          const nameA = `${a.user.first_name} ${a.user.last_name}`;
          const nameB = `${b.user.first_name} ${b.user.last_name}`;
          comparison = nameA.localeCompare(nameB);
          break;
        case 'role':
          comparison = a.role.name.localeCompare(b.role.name);
          break;
        case 'hours':
          const aHours = state.shifts
            .filter(shift => shift.company_employee_id === a.id)
            .reduce((acc, shift) => {
              const start = new Date(`2000-01-01T${shift.start_time}`);
              const end = new Date(`2000-01-01T${shift.end_time}`);
              return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);
          
          const bHours = state.shifts
            .filter(shift => shift.company_employee_id === b.id)
            .reduce((acc, shift) => {
              const start = new Date(`2000-01-01T${shift.start_time}`);
              const end = new Date(`2000-01-01T${shift.end_time}`);
              return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);
          comparison = aHours - bHours;
          break;
      }
      
      return state.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }
}));
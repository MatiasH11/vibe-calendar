import { WeekViewData, EmployeeWithShifts, Shift, ShiftFilters } from './shift';

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
  
  // Acciones de datos
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  removeShift: (shiftId: number) => void;
  refreshWeekData: () => Promise<void>;
  navigateWeek: (direction: 'prev' | 'next') => void;
}

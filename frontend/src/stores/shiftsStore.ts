import { create } from 'zustand';
import { ShiftsState } from '@/types/shifts/store';
import type { WeekViewData, EmployeeWithShifts, Shift } from '@/types/shifts/shift';

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  // Estado inicial
  weekData: null,
  employees: [],
  currentWeek: new Date().toISOString().split('T')[0],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  filters: {},
  selectedShift: null,
  selectedEmployee: null,
  selectedDate: null,
  showCreateModal: false,
  showEditModal: false,
  showDeleteModal: false,

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

  // Acciones de datos
  addShift: (shift) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para agregar turno a weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  updateShift: (shift) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para actualizar turno en weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  removeShift: (shiftId) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para remover turno de weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  refreshWeekData: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implementar refresh de datos
      console.log('Refreshing week data...');
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
    
    set({ currentWeek: newDate.toISOString().split('T')[0] });
  },
}));

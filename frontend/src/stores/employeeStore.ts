import { create } from 'zustand';
import { Employee, EmployeeFilters } from '@/types/employee';

interface EmployeeStore {
  selectedEmployee: Employee | null;
  filters: EmployeeFilters;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: EmployeeFilters) => void;
  resetFilters: () => void;
}

export const useEmployeeStore = create<EmployeeStore>((set) => ({
  selectedEmployee: null,
  filters: {
    page: 1,
    limit: 10,
  },
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setFilters: (filters) => set({ filters: { ...filters } }),
  resetFilters: () => set({ 
    filters: { 
      page: 1, 
      limit: 10 
    } 
  }),
}));

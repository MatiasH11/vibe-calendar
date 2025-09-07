import { create } from 'zustand';
import { Employee, EmployeeFilters } from '@/types/employee';
import { Role } from '@/types/api';

interface EmployeesStore {
  // Estado de empleados  
  selectedEmployee: Employee | null;
  filters: EmployeeFilters;
  
  // Estado de roles (contextual) - Backend expandido soporta CRUD completo
  selectedRole: Role | null;
  roleFilter: number | null; // ID del rol para filtrar empleados
  roleInclude: 'stats' | 'employees' | null; // Para usar con /roles/advanced
  
  // Estado de UI
  isSidebarCollapsed: boolean;
  isCreatingEmployee: boolean;
  isEditingEmployee: boolean;
  isCreatingRole: boolean;
  searchTerm: string;
  
  // Acciones de empleados (con CRUD completo)
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: EmployeeFilters) => void;
  resetFilters: () => void;
  
  // Acciones de roles (con CRUD completo)
  setSelectedRole: (role: Role | null) => void;
  setRoleFilter: (roleId: number | null) => void;
  setRoleInclude: (include: 'stats' | 'employees' | null) => void;
  
  // Acciones de UI
  toggleSidebar: () => void;
  setCreatingEmployee: (creating: boolean) => void;
  setEditingEmployee: (editing: boolean) => void;
  setCreatingRole: (creating: boolean) => void;
  setCreatingCargo: (creating: boolean) => void;
  setSearchTerm: (term: string) => void;
  
  // Acciones integradas (aprovechando backend expandido)
  filterByRole: (roleId: number) => void;
  clearAllFilters: () => void;
  enableStatsMode: () => void; // Para mostrar roles con contadores
  enableEmployeesMode: () => void; // Para mostrar roles con empleados
}

export const useEmployeesStore = create<EmployeesStore>((set, get) => ({
  // Estado inicial
  selectedEmployee: null,
  filters: {
    page: 1,
    limit: 10,
  },
  selectedRole: null,
  roleFilter: null,
  roleInclude: 'stats', // Por defecto mostrar contadores
  isSidebarCollapsed: false,
  isCreatingEmployee: false,
  isEditingEmployee: false,
  isCreatingRole: false,
  searchTerm: '',
  
  // Acciones de empleados
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setFilters: (filters) => set({ filters: { ...filters } }),
  resetFilters: () => set({ 
    filters: { page: 1, limit: 10 },
    roleFilter: null,
    searchTerm: ''
  }),
  
  // Acciones de roles (usando endpoints expandidos)
  setSelectedRole: (role) => set({ selectedRole: role }),
  setRoleFilter: (roleId) => set({ 
    roleFilter: roleId,
    filters: { ...get().filters, role_id: roleId || undefined, page: 1 }
  }),
  setRoleInclude: (include) => set({ roleInclude: include }),
  
  // Acciones de UI
  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed 
  })),
  setCreatingEmployee: (creating) => set({ isCreatingEmployee: creating }),
  setEditingEmployee: (editing) => set({ isEditingEmployee: editing }),
  setCreatingRole: (creating) => set({ isCreatingRole: creating }),
  setCreatingCargo: (creating) => set({ isCreatingRole: creating }), // Usar mismo estado para modal
  setSearchTerm: (term) => set({ 
    searchTerm: term,
    filters: { ...get().filters, search: term, page: 1 }
  }),
  
  // Acciones integradas (aprovechando endpoints expandidos)
  filterByRole: (roleId) => {
    const state = get();
    set({
      roleFilter: roleId,
      filters: { 
        ...state.filters, 
        role_id: roleId || undefined, 
        page: 1 
      }
    });
  },
  
  clearAllFilters: () => set({ 
    filters: { page: 1, limit: 10 },
    roleFilter: null,
    searchTerm: '',
    selectedRole: null
  }),
  
  // Nuevas acciones para aprovechar backend expandido
  enableStatsMode: () => set({ roleInclude: 'stats' }),
  enableEmployeesMode: () => set({ roleInclude: 'employees' }),
}));

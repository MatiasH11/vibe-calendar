# 🔗 FASE 2: Tipos TypeScript para Turnos

## 🎯 Objetivo
Definir tipos TypeScript completos para la gestión de turnos basados en el backend existente. **Solo tipos**, no implementación.

## 📝 PASO 1: Tipos Base de Turnos

### `types/shifts/shift.ts`
```typescript
export interface Shift {
  id: number;
  company_employee_id: number;
  shift_date: string; // ISO date string (YYYY-MM-DD)
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
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
```

### `types/shifts/employee.ts`
```typescript
export interface EmployeeWithShifts {
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
  shifts: ShiftByDay[];
}

export interface ShiftByDay {
  date: string; // YYYY-MM-DD
  shifts: Shift[];
}

export interface EmployeeShiftSummary {
  employee: EmployeeWithShifts;
  weekShifts: ShiftByDay[];
}
```

### `types/shifts/calendar.ts`
```typescript
export interface WeekViewData {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  days: DayData[];
  employees: EmployeeWithShifts[];
}

export interface DayData {
  date: string; // YYYY-MM-DD
  dayName: string; // Lun, Mar, etc.
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  shifts: Shift[];
  employeeCount: number;
}

export interface ShiftCell {
  shift: Shift;
  employee: EmployeeWithShifts;
  day: DayData;
  position: {
    row: number;
    column: number;
  };
  style: {
    backgroundColor: string;
    color: string;
    borderColor: string;
  };
}

export interface ShiftGridProps {
  weekData: WeekViewData;
  onShiftClick: (shift: Shift) => void;
  onShiftCreate: (employeeId: number, date: string) => void;
  onShiftUpdate: (shift: Shift) => void;
  onShiftDelete: (shiftId: number) => void;
}
```

### `types/shifts/forms.ts`
```typescript
export interface ShiftFormData {
  company_employee_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface ShiftFormErrors {
  company_employee_id?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  general?: string;
}

export interface ShiftFormProps {
  initialData?: Partial<ShiftFormData>;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  employees: EmployeeWithShifts[];
  selectedDate?: string;
  selectedEmployee?: number;
}
```

## 🎯 PASO 2: Tipos de Estado Global

### `types/shifts/store.ts`
```typescript
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
```

## 🎯 PASO 3: Tipos de Hooks

### `types/shifts/hooks.ts`
```typescript
export interface UseShiftsReturn {
  // Datos
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  currentWeek: string;
  
  // Estados
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  refreshData: () => Promise<void>;
  navigateWeek: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  goToWeek: (date: string) => void;
}

export interface UseShiftFormReturn {
  formData: ShiftFormData;
  errors: ShiftFormErrors;
  isLoading: boolean;
  
  setFormData: (data: Partial<ShiftFormData>) => void;
  setError: (field: keyof ShiftFormErrors, error: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
}

export interface UseShiftGridReturn {
  weekData: WeekViewData | null;
  isLoading: boolean;
  error: string | null;
  
  onShiftClick: (shift: Shift) => void;
  onShiftCreate: (employeeId: number, date: string) => void;
  onShiftUpdate: (shift: Shift) => void;
  onShiftDelete: (shiftId: number) => void;
  onEmployeeFilter: (employeeId: number | null) => void;
  onDateFilter: (date: string | null) => void;
}
```

## ✅ Validación

```bash
# Verificar tipos
npx tsc --noEmit

# Verificar archivos (Windows)
dir types\shifts
dir types\shifts\shift.ts
dir types\shifts\employee.ts
dir types\shifts\calendar.ts
dir types\shifts\forms.ts
dir types\shifts\store.ts
dir types\shifts\hooks.ts
```

## 🎯 Resultado

- **Tipos completos** para gestión de turnos definidos
- **Interfaces de datos** sincronizadas con backend
- **Tipos de estado** para Zustand store
- **Tipos de hooks** para lógica de componentes
- **Tipos de formularios** para validación

**Los tipos están listos** para implementar componentes y servicios.

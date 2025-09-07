# 🏷️ FASE 2: Sidebar Contextual de Cargos

## 🎯 Objetivo
Implementar un sidebar inteligente que muestre la gestión de cargos de forma contextual, permitiendo crear, editar y filtrar empleados sin perder el contexto del panel principal.

## 📝 PASO 1: Tipos y Validaciones para Cargos

### Actualizar `src/types/employee.ts`
Agregar tipos específicos para el sidebar contextual:

```typescript
// Agregar al final del archivo existente
export interface Cargo {
  id: number;
  name: string;
  description?: string;
  color: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  _count?: {
    employees: number;
  };
}

export interface CreateCargoRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCargoRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface CargoWithEmployees extends Cargo {
  employees: Employee[];
  isActive: boolean; // Si tiene empleados activos
}

// Estados del sidebar
export interface SidebarState {
  isCollapsed: boolean;
  selectedCargoId: number | null;
  searchTerm: string;
  isCreating: boolean;
  isEditing: boolean;
}
```

### `src/lib/validations/cargo.ts`
```typescript
import { z } from 'zod';

export const createCargoSchema = z.object({
  name: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios permitidos'),
  description: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un código hexadecimal válido'),
});

export const updateCargoSchema = createCargoSchema.partial();

export const cargoQuickCreateSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
});

export type CreateCargoFormData = z.infer<typeof createCargoSchema>;
export type UpdateCargoFormData = z.infer<typeof updateCargoSchema>;
export type CargoQuickCreateFormData = z.infer<typeof cargoQuickCreateSchema>;

// Colores predefinidos para cargos
export const CARGO_COLORS = [
  { name: 'Azul', value: '#3B82F6', category: 'primary' },
  { name: 'Verde', value: '#10B981', category: 'success' },
  { name: 'Rojo', value: '#EF4444', category: 'danger' },
  { name: 'Naranja', value: '#F97316', category: 'warning' },
  { name: 'Púrpura', value: '#8B5CF6', category: 'info' },
  { name: 'Rosa', value: '#EC4899', category: 'accent' },
  { name: 'Cian', value: '#06B6D4', category: 'secondary' },
  { name: 'Lima', value: '#84CC16', category: 'nature' },
] as const;
```

## 📝 PASO 2: Extender ApiClient para Cargos

### Actualizar `src/lib/api.ts`
Agregar métodos optimizados para el sidebar:

```typescript
// Agregar imports
import { 
  Cargo, 
  CreateCargoRequest, 
  UpdateCargoRequest, 
  CargoWithEmployees 
} from '@/types/employee';

// Agregar al final de la clase ApiClient

// Métodos específicos para sidebar contextual
async getCargosWithStats(): Promise<ApiResponse<Cargo[]>> {
  return this.request<Cargo[]>('/api/v1/roles?include=stats');
}

async getCargo(id: number): Promise<ApiResponse<Cargo>> {
  return this.request(`/api/v1/roles/${id}`);
}

async getCargoWithEmployees(id: number): Promise<ApiResponse<CargoWithEmployees>> {
  return this.request(`/api/v1/roles/${id}?include=employees`);
}

async createCargo(data: CreateCargoRequest): Promise<ApiResponse<Cargo>> {
  return this.request('/api/v1/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async updateCargo(id: number, data: UpdateCargoRequest): Promise<ApiResponse<Cargo>> {
  return this.request(`/api/v1/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteCargo(id: number): Promise<ApiResponse<void>> {
  return this.request(`/api/v1/roles/${id}`, {
    method: 'DELETE',
  });
}

// Método para buscar cargos
async searchCargos(term: string): Promise<ApiResponse<Cargo[]>> {
  const params = new URLSearchParams({ search: term });
  return this.request<Cargo[]>(`/api/v1/roles?${params}`);
}
```

## 📝 PASO 3: Hook Optimizado para Sidebar

### `src/hooks/useCargosContextual.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { 
  Cargo, 
  CreateCargoRequest, 
  UpdateCargoRequest,
  CargoWithEmployees 
} from '@/types/employee';
import { useEmployeesStore } from '@/stores/employeesStore';
import { toast } from 'sonner';

export function useCargosContextual() {
  const queryClient = useQueryClient();
  const { filterByRole, clearAllFilters, cargoFilter } = useEmployeesStore();
  
  // Query principal para lista de cargos
  const {
    data: cargosResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cargos-contextual'],
    queryFn: () => apiClient.getCargosWithStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Actualizar cada 30 segundos
  });

  // Query para cargo específico con empleados
  const {
    data: selectedCargoData,
    isLoading: isLoadingSelected
  } = useQuery({
    queryKey: ['cargo-detail', cargoFilter],
    queryFn: () => cargoFilter ? apiClient.getCargoWithEmployees(cargoFilter) : null,
    enabled: !!cargoFilter,
    staleTime: 1 * 60 * 1000,
  });

  // Mutación para crear cargo
  const createMutation = useMutation({
    mutationFn: (data: CreateCargoRequest) => apiClient.createCargo(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Cargo creado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al crear cargo');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear cargo');
    },
  });

  // Mutación para actualizar cargo
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCargoRequest }) => 
      apiClient.updateCargo(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Cargo actualizado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['cargo-detail'] });
      } else {
        toast.error(response.error?.message || 'Error al actualizar cargo');
      }
    },
  });

  // Mutación para eliminar cargo
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCargo(id),
    onSuccess: (response, deletedId) => {
      if (response.success) {
        toast.success('Cargo eliminado exitosamente');
        // Limpiar filtro si el cargo eliminado estaba seleccionado
        if (cargoFilter === deletedId) {
          clearAllFilters();
        }
        queryClient.invalidateQueries({ queryKey: ['cargos-contextual'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } else {
        toast.error(response.error?.message || 'Error al eliminar cargo');
      }
    },
  });

  // Procesar datos de respuesta
  const cargos: Cargo[] = cargosResponse?.data || [];
  const selectedCargo: CargoWithEmployees | null = selectedCargoData?.data || null;

  // Funciones de utilidad
  const handleFilterByRole = (cargoId: number) => {
    filterByRole(cargoId);
    toast.info(`Filtrando empleados por cargo`);
  };

  const handleClearFilter = () => {
    clearAllFilters();
    toast.info('Filtros eliminados');
  };

  const canDeleteCargo = (cargo: Cargo): boolean => {
    return (cargo._count?.employees || 0) === 0;
  };

  const getCargoStats = (cargo: Cargo) => {
    const employeeCount = cargo._count?.employees || 0;
    const isEmpty = employeeCount === 0;
    const isSelected = cargoFilter === cargo.id;
    
    return {
      employeeCount,
      isEmpty,
      isSelected,
      canDelete: isEmpty,
      statusColor: isEmpty ? 'text-gray-500' : 'text-green-600',
      bgColor: isEmpty ? 'bg-gray-50' : 'bg-green-50',
    };
  };

  return {
    // Datos
    cargos,
    selectedCargo,
    cargoFilter,
    
    // Estados de carga
    isLoading,
    isLoadingSelected,
    error,
    
    // Acciones CRUD
    createCargo: createMutation.mutate,
    updateCargo: updateMutation.mutate,
    deleteCargo: deleteMutation.mutate,
    
    // Estados de mutaciones
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Acciones de filtro
    filterByRole: handleFilterByRole,
    clearFilter: handleClearFilter,
    
    // Utilidades
    canDeleteCargo,
    getCargoStats,
    refetch,
  };
}
```

## 📝 PASO 4: Sidebar Contextual Completo

### `src/components/dashboard/views/employees/CargosContextualSidebar.tsx`
Reemplazar el placeholder con funcionalidad completa:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Filter,
  X,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { Cargo } from '@/types/employee';
import { motion, AnimatePresence } from 'framer-motion';

export function CargosContextualSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  
  const { 
    setCreatingCargo, 
    cargoFilter 
  } = useEmployeesStore();

  const {
    cargos,
    selectedCargo,
    isLoading,
    error,
    createCargo,
    updateCargo,
    deleteCargo,
    isCreating,
    isUpdating,
    isDeleting,
    filterByRole,
    clearFilter,
    canDeleteCargo,
    getCargoStats,
    refetch
  } = useCargosContextual();

  // Filtrar cargos por búsqueda
  const filteredCargos = cargos.filter(cargo =>
    cargo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cargo.description && cargo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteCargo = async (cargo: Cargo) => {
    const stats = getCargoStats(cargo);
    
    if (!stats.canDelete) {
      toast.error(`No se puede eliminar. Hay ${stats.employeeCount} empleado(s) asignados.`);
      return;
    }

    if (confirm(`¿Eliminar el cargo "${cargo.name}"?`)) {
      await deleteCargo(cargo.id);
    }
  };

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Cargos</span>
          </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm mb-3">Error al cargar cargos</p>
            <Button size="sm" onClick={refetch}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del sidebar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Cargos</span>
            {cargos.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {cargos.length}
              </Badge>
            )}
          </h3>
          <Button
            size="sm"
            onClick={() => setCreatingCargo(true)}
            disabled={isCreating}
            className="h-8 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Filtro activo */}
        {cargoFilter && (
          <div className="mb-3">
            <Badge 
              variant="default" 
              className="flex items-center space-x-1 w-full justify-between"
            >
              <span className="flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span className="text-xs">Filtrando</span>
              </span>
              <button 
                onClick={clearFilter}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
        
        {/* Búsqueda de cargos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Lista de cargos */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredCargos.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-3">
                {searchTerm ? 'No se encontraron cargos' : 'No hay cargos creados'}
              </p>
              {!searchTerm && (
                <Button
                  size="sm"
                  onClick={() => setCreatingCargo(true)}
                  className="text-xs"
                >
                  Crear primer cargo
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredCargos.map((cargo, index) => {
                const stats = getCargoStats(cargo);
                
                return (
                  <motion.div
                    key={cargo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 border rounded-lg transition-all cursor-pointer hover:shadow-sm ${
                      stats.isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => filterByRole(cargo.id)}
                  >
                    {/* Header del cargo */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cargo.color }}
                        />
                        <span className="font-medium text-gray-900 truncate text-sm">
                          {cargo.name}
                        </span>
                      </div>
                      
                      {/* Contador de empleados */}
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${stats.statusColor} border-current`}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          {stats.employeeCount}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Descripción */}
                    {cargo.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {cargo.description}
                      </p>
                    )}
                    
                    {/* Acciones */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCargo(cargo);
                          }}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCargo(cargo);
                          }}
                          disabled={!stats.canDelete || isDeleting}
                          className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {stats.isSelected && (
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer con estadísticas */}
      {cargos.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total cargos:</span>
              <span className="font-medium">{cargos.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Con empleados:</span>
              <span className="font-medium text-green-600">
                {cargos.filter(c => (c._count?.employees || 0) > 0).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Vacíos:</span>
              <span className="font-medium text-orange-600">
                {cargos.filter(c => (c._count?.employees || 0) === 0).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 📝 PASO 5: Modal de Creación Rápida

### `src/components/employees/CargoQuickCreateModal.tsx`
Reemplazar placeholder con formulario funcional:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  cargoQuickCreateSchema, 
  CargoQuickCreateFormData,
  CARGO_COLORS 
} from '@/lib/validations/cargo';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { Briefcase, Palette, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface CargoQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CargoQuickCreateModal({ isOpen, onClose }: CargoQuickCreateModalProps) {
  const { createCargo, isCreating } = useCargosContextual();

  const form = useForm<CargoQuickCreateFormData>({
    resolver: zodResolver(cargoQuickCreateSchema),
    defaultValues: {
      name: '',
      color: CARGO_COLORS[0].value,
    },
  });

  const handleSubmit = async (data: CargoQuickCreateFormData) => {
    try {
      await createCargo({
        name: data.name,
        color: data.color,
        description: '', // Descripción opcional en creación rápida
      });
      form.reset();
      onClose();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Crear Cargo Rápido</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Nombre del cargo */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Nombre del Cargo</span>
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ej: Cocinero, Cajero, Mesero"
              className={form.formState.errors.name ? 'border-red-500' : ''}
              autoFocus
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Selector de color */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Color del Cargo</span>
            </Label>
            
            <div className="grid grid-cols-4 gap-2">
              {CARGO_COLORS.map((colorOption, index) => (
                <motion.button
                  key={colorOption.value}
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => form.setValue('color', colorOption.value)}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    form.watch('color') === colorOption.value 
                      ? 'border-gray-900 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: `${colorOption.value}20` }}
                >
                  <div 
                    className="w-6 h-6 rounded-full mx-auto"
                    style={{ backgroundColor: colorOption.value }}
                  />
                  <span className="text-xs text-gray-600 mt-1 block">
                    {colorOption.name}
                  </span>
                  
                  {form.watch('color') === colorOption.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        ✓
                      </Badge>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            
            {form.formState.errors.color && (
              <p className="text-sm text-red-500">
                {form.formState.errors.color.message}
              </p>
            )}
          </div>

          {/* Vista previa */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm text-gray-600 mb-2 block">Vista Previa:</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: form.watch('color') }}
              />
              <span className="font-medium">
                {form.watch('name') || 'Nombre del cargo'}
              </span>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                0
              </Badge>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !form.watch('name')}
            >
              {isCreating ? 'Creando...' : 'Crear Cargo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## 📝 PASO 6: Instalar ScrollArea

```bash
# Instalar componente scroll-area si no existe
npx shadcn@latest add scroll-area
```

## ✅ Validación de la Fase 2

```bash
# 1. Instalar scroll-area component
npx shadcn@latest add scroll-area

# 2. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 3. Verificar que los archivos se crearon correctamente
ls src/lib/validations/cargo.ts
ls src/hooks/useCargosContextual.ts
ls src/components/employees/CargoQuickCreateModal.tsx

# 4. Verificar que la aplicación funciona
npm run dev
# Ir a: http://localhost:3000/dashboard/empleados

# 5. Verificar funcionalidad del sidebar
# - Sidebar debe mostrar lista de cargos (si existen)
# - Click en "+" debe abrir modal de creación rápida
# - Formulario debe validar y crear cargos
# - Click en cargo debe filtrar empleados
# - Botones de editar/eliminar deben funcionar
# - Búsqueda de cargos debe filtrar
# - Estadísticas del footer deben mostrar datos reales
```

**CHECKLIST DE LA FASE 2:**
□ Tipos de Cargo definidos para sidebar
□ Validaciones optimizadas para creación rápida
□ ApiClient extendido con métodos específicos
□ Hook useCargosContextual funcional
□ Sidebar contextual completamente implementado
□ Modal de creación rápida funcional
□ Selector de colores atractivo
□ Búsqueda y filtros operativos
□ Estadísticas en tiempo real
□ Build sin errores de TypeScript

## 🎯 Resultado de la Fase 2

- ✅ **Sidebar contextual** completamente funcional
- ✅ **CRUD optimizado** para flujo UX sin interrupciones
- ✅ **Creación rápida** de cargos con selector de colores
- ✅ **Filtros inteligentes** que actualizan panel principal
- ✅ **Búsqueda en tiempo real** de cargos
- ✅ **Estadísticas contextuales** en footer del sidebar
- ✅ **UI responsiva** con animaciones suaves
- ✅ **Build sin errores** de TypeScript

**Sidebar inteligente y contextual implementado** - Listo para integración fluida en la siguiente fase.

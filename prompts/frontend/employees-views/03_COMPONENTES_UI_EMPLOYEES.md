# 🧩 FASE 3: Componentes UI para Empleados

## 🎯 Objetivo
Crear todos los componentes UI necesarios para la gestión de empleados: formularios, tablas, tarjetas y modales.

## 🧩 PASO 1: Formulario de Crear/Editar Empleado

### `src/components/employees/EmployeeForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  CreateEmployeeFormData,
  UpdateEmployeeFormData 
} from '@/lib/validations/employee';
import { Employee } from '@/types/employee';
import { useRoles } from '@/hooks/useRoles';
import { FadeIn } from '@/components/ui/transitions';
import { User, Mail, Briefcase, Shield } from 'lucide-react';

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: CreateEmployeeFormData | UpdateEmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeForm({ employee, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
  const isEditing = !!employee;
  const { roles, isLoading: rolesLoading } = useRoles();
  
  const form = useForm<CreateEmployeeFormData | UpdateEmployeeFormData>({
    resolver: zodResolver(isEditing ? updateEmployeeSchema : createEmployeeSchema),
    defaultValues: isEditing ? {
      role_id: employee.role_id,
      position: employee.position || '',
      is_active: employee.is_active,
    } : {
      email: '',
      first_name: '',
      last_name: '',
      role_id: 0,
      position: '',
    },
  });

  const handleSubmit = (data: CreateEmployeeFormData | UpdateEmployeeFormData) => {
    onSubmit(data);
  };

  return (
    <FadeIn>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <User className="w-5 h-5 text-blue-600" />
                <span>Editar Empleado</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-green-600" />
                <span>Nuevo Empleado</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!isEditing && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Nombre</span>
                    </Label>
                    <Input
                      id="first_name"
                      {...form.register('first_name')}
                      placeholder="Nombre del empleado"
                      className={form.formState.errors.first_name ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.first_name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Apellido</span>
                    </Label>
                    <Input
                      id="last_name"
                      {...form.register('last_name')}
                      placeholder="Apellido del empleado"
                      className={form.formState.errors.last_name ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.last_name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="email@empresa.com"
                    className={form.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_id" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Rol</span>
                </Label>
                <Select
                  value={form.watch('role_id')?.toString() || ''}
                  onValueChange={(value) => form.setValue('role_id', parseInt(value))}
                >
                  <SelectTrigger className={form.formState.errors.role_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role_id && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.role_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Cargo</span>
                </Label>
                <Input
                  id="position"
                  {...form.register('position')}
                  placeholder="Cargo o posición"
                />
              </div>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Estado</span>
                </Label>
                <Select
                  value={form.watch('is_active')?.toString() || 'true'}
                  onValueChange={(value) => form.setValue('is_active', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || rolesLoading}>
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
```

## 🧩 PASO 2: Modal de Formulario

### `src/components/employees/EmployeeFormModal.tsx`
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from './EmployeeForm';
import { Employee, CreateEmployeeFormData, UpdateEmployeeFormData } from '@/types/employee';

interface EmployeeFormModalProps {
  isOpen: boolean;
  employee?: Employee;
  onSubmit: (data: CreateEmployeeFormData | UpdateEmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeFormModal({ 
  isOpen, 
  employee, 
  onSubmit, 
  onCancel, 
  isLoading 
}: EmployeeFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
        </DialogHeader>
        <EmployeeForm
          employee={employee}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## 🧩 PASO 3: Tarjeta de Empleado

### `src/components/employees/EmployeeCard.tsx`
```typescript
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/lib/constants';
import { User, Mail, Briefcase, Shield, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function EmployeeCard({ 
  employee, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isDeleting,
  isToggling
}: EmployeeCardProps) {
  const statusColor = EMPLOYEE_STATUS_COLORS[employee.is_active ? 'active' : 'inactive'];
  const statusLabel = EMPLOYEE_STATUS_LABELS[employee.is_active ? 'active' : 'inactive'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {employee.user.first_name} {employee.user.last_name}
                </h3>
                <Badge className={statusColor}>
                  {statusLabel}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(employee)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleStatus(employee.id, !employee.is_active)}
                disabled={isToggling}
                className={`h-8 w-8 p-0 ${
                  employee.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'
                }`}
              >
                {employee.is_active ? (
                  <PowerOff className="w-4 h-4" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(employee.id)}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{employee.user.email}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>{employee.role.name}</span>
            </div>
            
            {employee.position && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{employee.position}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Creado: {new Date(employee.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

## 🧩 PASO 4: Tabla de Empleados

### `src/components/employees/EmployeeTable.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/lib/constants';
import { useRoles } from '@/hooks/useRoles';
import { Search, Filter, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  filters: {
    search: string;
    role_id?: number;
    is_active?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  onToggleStatus,
  filters,
  onFiltersChange,
  isDeleting,
  isToggling
}: EmployeeTableProps) {
  const { roles } = useRoles();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role_id: value ? parseInt(value) : undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, is_active: value ? value === 'true' : undefined });
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar empleados..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </Button>
      </div>

      {/* Filtros expandibles */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rol</label>
              <Select value={filters.role_id?.toString() || ''} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <Select value={filters.is_active?.toString() || ''} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {employees.map((employee, index) => (
                <motion.tr
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {employee.user.first_name[0]}{employee.user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.user.first_name} {employee.user.last_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{employee.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.role.name}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.position || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={EMPLOYEE_STATUS_COLORS[employee.is_active ? 'active' : 'inactive']}>
                      {EMPLOYEE_STATUS_LABELS[employee.is_active ? 'active' : 'inactive']}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(employee)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleStatus(employee.id, !employee.is_active)}
                        disabled={isToggling}
                        className={`h-8 w-8 p-0 ${
                          employee.is_active ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {employee.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(employee.id)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## 🧩 PASO 5: Componente de Paginación

### `src/components/employees/EmployeePagination.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGINATION } from '@/lib/constants';

interface EmployeePaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function EmployeePagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange
}: EmployeePaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-2 text-sm text-gray-700">
        <span>
          Mostrando {startItem} a {endItem} de {total} empleados
        </span>
        <span className="text-gray-500">|</span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      <div className="flex items-center space-x-2">
        <Select value={limit.toString()} onValueChange={(value) => onLimitChange(parseInt(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (page > totalPages) return null;
            
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## ✅ Validación de la Fase 3

```bash
# 1. OBLIGATORIO: Instalar componentes shadcn/ui necesarios
npx shadcn-ui@0.8.0 add dialog table badge select
# Si ya están instalados, continuará sin error

# 2. Crear directorio si no existe
mkdir -p src/components/employees

# 3. Verificar que los archivos se crearon correctamente
ls src/components/employees/EmployeeForm.tsx
ls src/components/employees/EmployeeFormModal.tsx
ls src/components/employees/EmployeeCard.tsx
ls src/components/employees/EmployeeTable.tsx
ls src/components/employees/EmployeePagination.tsx

# 4. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar
```

**PROBLEMAS COMUNES Y SOLUCIONES:**
- **Error "Cannot find module 'sonner'":** Ejecutar `npm install sonner`
- **Error componentes shadcn/ui:** Ejecutar `npx shadcn-ui@0.8.0 add [componente]`
- **Error imports de Framer Motion:** Ya debe estar instalado del dashboard base

## 🎯 Resultado de la Fase 3

- ✅ **Formulario completo** para crear/editar empleados
- ✅ **Modal de formulario** con validaciones
- ✅ **Tarjeta de empleado** con acciones
- ✅ **Tabla de empleados** con filtros
- ✅ **Paginación** completa
- ✅ **Build sin errores** de TypeScript

**No se integra la vista principal** - Solo los componentes UI para la siguiente fase.

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  CreateEmployeeFormData,
  UpdateEmployeeFormData 
} from '@/lib/validations/employee';
import { Employee } from '@/types/employee';
import { useRoles } from '@/hooks/useRoles';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { useEmployeesStore } from '@/stores/employeesStore';
import { CargoInlineCreateForm } from './CargoInlineCreateForm';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Briefcase, Plus, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateEmployeeFormProps {
  onSubmit: (data: CreateEmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface UpdateEmployeeFormProps {
  employee: Employee;
  onSubmit: (data: UpdateEmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type EmployeeFormProps = CreateEmployeeFormProps | UpdateEmployeeFormProps;

function isUpdateForm(props: EmployeeFormProps): props is UpdateEmployeeFormProps {
  return 'employee' in props;
}

export function EmployeeForm(props: EmployeeFormProps) {
  const isEditing = isUpdateForm(props);
  const { roles, isLoading: rolesLoading } = useRoles();
  const { cargos, isLoading: cargosLoading } = useCargosContextual();
  const { roleFilter } = useEmployeesStore();
  
  const [showCargoCreate, setShowCargoCreate] = useState(false);
  const [preselectedCargoId, setPreselectedCargoId] = useState<number | null>(null);

  const createForm = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role_id: roleFilter || 0,
    },
  });

  // Preseleccionar cargo del filtro actual
  useEffect(() => {
    if (!isEditing && roleFilter && !createForm.getValues('role_id')) {
      createForm.setValue('role_id', roleFilter);
      setPreselectedCargoId(roleFilter);
    }
  }, [roleFilter, isEditing, createForm]);

  const updateForm = useForm<UpdateEmployeeFormData>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: isEditing ? {
      role_id: props.employee.role_id,
      is_active: props.employee.is_active,
    } : undefined,
  });

  const handleCreateSubmit = (data: CreateEmployeeFormData) => {
    if (!isEditing) {
      props.onSubmit(data);
    }
  };

  const handleUpdateSubmit = (data: UpdateEmployeeFormData) => {
    if (isEditing) {
      props.onSubmit(data);
    }
  };

  const handleCargoCreated = (newCargoId: number) => {
    createForm.setValue('role_id', newCargoId);
    setPreselectedCargoId(newCargoId);
    setShowCargoCreate(false);
  };

  const selectedCargoId = isEditing ? updateForm.watch('role_id') : createForm.watch('role_id');
  const selectedCargo = cargos.find(c => c.id === selectedCargoId);

  return (
    <div className="w-full">
      <div className="space-y-4">
          {isEditing ? (
            // Formulario de edición
            <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role_id" className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Rol</span>
                  </Label>
                  <Select
                    value={updateForm.watch('role_id')?.toString() || ''}
                    onValueChange={(value) => updateForm.setValue('role_id', parseInt(value))}
                  >
                    <SelectTrigger className={updateForm.formState.errors.role_id ? 'border-red-500' : ''}>
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
                  {updateForm.formState.errors.role_id && (
                    <p className="text-sm text-red-500">
                      {updateForm.formState.errors.role_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Estado</span>
                  </Label>
                  <Select
                    value={updateForm.watch('is_active')?.toString() || 'true'}
                    onValueChange={(value) => updateForm.setValue('is_active', value === 'true')}
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
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={props.onCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={props.isLoading || rolesLoading}>
                  {props.isLoading ? 'Guardando...' : 'Actualizar'}
                </Button>
              </div>
            </form>
          ) : (
            // Formulario de creación
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Nombre</span>
                  </Label>
                  <Input
                    id="first_name"
                    {...createForm.register('first_name')}
                    placeholder="Nombre del empleado"
                    className={createForm.formState.errors.first_name ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.first_name && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.first_name.message}
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
                    {...createForm.register('last_name')}
                    placeholder="Apellido del empleado"
                    className={createForm.formState.errors.last_name ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.last_name && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.last_name.message}
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
                  {...createForm.register('email')}
                  placeholder="email@empresa.com"
                  className={createForm.formState.errors.email ? 'border-red-500' : ''}
                />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Cargo con creación inline */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Cargo</span>
                  {preselectedCargoId && (
                    <Badge variant="outline" className="ml-2">
                      Preseleccionado
                    </Badge>
                  )}
                </Label>

                {showCargoCreate ? (
                  // Formulario inline para crear cargo
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-blue-900">Crear Nuevo Cargo</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCargoCreate(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Cancelar
                      </Button>
                    </div>
                    
                    <CargoInlineCreateForm
                      onCreated={handleCargoCreated}
                      onCancel={() => setShowCargoCreate(false)}
                    />
                  </div>
                ) : (
                  // Selector de cargo normal
                  <div className="space-y-2">
                    <Select
                      value={selectedCargoId?.toString() || ''}
                      onValueChange={(value) => createForm.setValue('role_id', parseInt(value))}
                    >
                      <SelectTrigger className={createForm.formState.errors.role_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargosLoading ? (
                          <SelectItem value="loading" disabled>
                            Cargando cargos...
                          </SelectItem>
                        ) : cargos.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No hay cargos disponibles
                          </SelectItem>
                        ) : (
                          cargos.map((cargo) => (
                            <SelectItem key={cargo.id} value={cargo.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cargo.color }}
                                />
                                <span>{cargo.name}</span>
                                {cargo._count?.employees && (
                                  <Badge variant="outline" className="text-xs">
                                    {cargo._count.employees}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Botón para crear cargo inline */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCargoCreate(true)}
                      className="w-full flex items-center space-x-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear nuevo cargo</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    {createForm.formState.errors.role_id && (
                      <p className="text-sm text-red-500">
                        {createForm.formState.errors.role_id.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Vista previa del cargo seleccionado */}
                {selectedCargo && !showCargoCreate && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedCargo.color }}
                      />
                      <span className="font-medium">{selectedCargo.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedCargo._count?.employees || 0} empleados
                      </Badge>
                    </div>
                    {selectedCargo.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedCargo.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={props.onCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={props.isLoading || rolesLoading}>
                  {props.isLoading ? 'Guardando...' : 'Crear'}
                </Button>
              </div>
            </form>
          )}
      </div>
    </div>
  );
}
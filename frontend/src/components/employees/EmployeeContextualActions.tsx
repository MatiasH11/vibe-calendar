'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Briefcase,
  Eye
} from 'lucide-react';
import { Employee } from '@/types/employee';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { useEmployeesStore } from '@/stores/employeesStore';

interface EmployeeContextualActionsProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function EmployeeContextualActions({
  employee,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting = false,
  isToggling = false
}: EmployeeContextualActionsProps) {
  const { cargos } = useCargosContextual();
  const { filterByRole, roleFilter } = useEmployeesStore();
  
  const employeeCargo = cargos.find(c => c.id === employee.role_id);
  const isCurrentlyFiltered = roleFilter === employee.role_id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Acciones principales */}
        <DropdownMenuItem onClick={() => onEdit(employee)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Editar empleado</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onToggleStatus(employee.id, !employee.is_active)}
          disabled={isToggling}
        >
          {employee.is_active ? (
            <>
              <UserX className="mr-2 h-4 w-4 text-orange-600" />
              <span>Desactivar</span>
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4 text-green-600" />
              <span>Activar</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Acciones contextuales de cargo */}
        {employeeCargo && (
          <>
            {!isCurrentlyFiltered ? (
              <DropdownMenuItem onClick={() => filterByRole(employee.role_id)}>
                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                <span>Ver otros {employeeCargo.name.toLowerCase()}s</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled>
                <Briefcase className="mr-2 h-4 w-4 text-gray-400" />
                <span>Filtrando por {employeeCargo.name}</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
          </>
        )}

        {/* Acción de eliminación */}
        <DropdownMenuItem 
          onClick={() => onDelete(employee.id)}
          disabled={isDeleting}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Eliminar empleado</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';

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

  return (
    <div className="overflow-hidden">
      {/* Tabla mejorada sin filtros duplicados */}
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200">
            <TableHead className="font-semibold text-gray-700">Empleado</TableHead>
            <TableHead className="font-semibold text-gray-700">Email</TableHead>
            <TableHead className="font-semibold text-gray-700">Equipo</TableHead>
            <TableHead className="font-semibold text-gray-700">Estado</TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee, index) => (
            <TableRow
              key={employee.id}
              className="hover:bg-gray-50 transition-colors border-gray-100"
            >
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {employee.user.first_name[0]}{employee.user.last_name[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {employee.user.first_name} {employee.user.last_name}
                    </p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <span className="text-gray-600 text-sm">{employee.user.email}</span>
              </TableCell>
              
              <TableCell className="py-4">
                <Badge variant="outline" className="font-medium">
                  {employee.role.name}
                </Badge>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="flex items-center space-x-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      employee.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className={`text-sm font-medium ${
                    employee.is_active ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {employee.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(employee)}
                    className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600"
                    title="Editar empleado"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleStatus(employee.id, !employee.is_active)}
                    disabled={isToggling}
                    className={`h-9 w-9 p-0 ${
                      employee.is_active 
                        ? 'hover:bg-orange-50 hover:text-orange-600' 
                        : 'hover:bg-green-50 hover:text-green-600'
                    }`}
                    title={employee.is_active ? 'Desactivar empleado' : 'Activar empleado'}
                  >
                    {employee.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(employee.id)}
                    disabled={isDeleting}
                    className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar empleado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

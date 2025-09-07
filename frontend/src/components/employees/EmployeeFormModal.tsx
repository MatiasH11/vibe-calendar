'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from './EmployeeForm';
import { Employee } from '@/types/employee';
import { CreateEmployeeFormData, UpdateEmployeeFormData } from '@/lib/validations/employee';

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
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
        </DialogHeader>
        {employee ? (
          <EmployeeForm
            employee={employee}
            onSubmit={onSubmit as (data: UpdateEmployeeFormData) => void}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        ) : (
          <EmployeeForm
            onSubmit={onSubmit as (data: CreateEmployeeFormData) => void}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

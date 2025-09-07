import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  CreateEmployeeFormData,
  UpdateEmployeeFormData 
} from '@/lib/validations/employee';
import { Employee } from '@/types/employee';

export function useEmployeeForm(employee?: Employee) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const createForm = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role_id: 0,
    },
  });

  const updateForm = useForm<UpdateEmployeeFormData>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      role_id: employee?.role_id || 0,
      is_active: employee?.is_active,
    },
  });

  const openCreateForm = () => {
    setIsOpen(true);
    setIsEditing(false);
    createForm.reset();
  };

  const openEditForm = (emp: Employee) => {
    setIsOpen(true);
    setIsEditing(true);
    updateForm.reset({
      role_id: emp.role_id,
      is_active: emp.is_active,
    });
  };

  const closeForm = () => {
    setIsOpen(false);
    setIsEditing(false);
    createForm.reset();
    updateForm.reset();
  };

  return {
    isOpen,
    isEditing,
    createForm,
    updateForm,
    openCreateForm,
    openEditForm,
    closeForm,
  };
}

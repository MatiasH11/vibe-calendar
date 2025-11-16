/**
 * EmployeeForm Component
 * Form for creating and editing employees with validation
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmployee } from '@/hooks/useEmployee';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@/api/employeeApi';

// Form validation schema
const employeeFormSchema = z.object({
  user_id: z.number().int().positive('User is required'),
  location_id: z.number().int().positive('Location is required'),
  department_id: z.number().int().positive('Department is required'),
  job_position_id: z.number().int().positive().optional().nullable(),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  position: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
  onCancel?: () => void;
  // Options for dropdowns
  users?: Array<{ id: number; name: string; email: string }>;
  locations?: Array<{ id: number; name: string }>;
  departments?: Array<{ id: number; name: string }>;
  jobPositions?: Array<{ id: number; name: string }>;
}

export function EmployeeForm({
  employee,
  onSuccess,
  onCancel,
  users = [],
  locations = [],
  departments = [],
  jobPositions = [],
}: EmployeeFormProps) {
  const isEditMode = !!employee;

  const {
    create,
    update,
    isCreating,
    isUpdating,
    error: employeeError,
    clearError,
  } = useEmployee({
    onSuccess: (message) => {
      console.log(message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      user_id: 0,
      location_id: 0,
      department_id: 0,
      job_position_id: null,
      company_role: 'EMPLOYEE',
      position: '',
      is_active: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setValue('user_id', employee.user_id);
      setValue('location_id', employee.location_id);
      setValue('department_id', employee.department_id);
      setValue('job_position_id', employee.job_position_id);
      setValue('company_role', employee.company_role);
      setValue('position', employee.position);
      setValue('is_active', employee.is_active);
    }
  }, [employee, setValue]);

  const onSubmit = async (data: EmployeeFormData) => {
    clearError();

    try {
      let result: Employee | null = null;

      if (isEditMode && employee) {
        // Update existing employee
        const updateData: UpdateEmployeeInput = {
          department_id: data.department_id,
          job_position_id: data.job_position_id || undefined,
          company_role: data.company_role,
          position: data.position || undefined,
          is_active: data.is_active,
        };
        result = await update(employee.id, updateData);
      } else {
        // Create new employee
        const createData: CreateEmployeeInput = {
          user_id: data.user_id,
          location_id: data.location_id,
          department_id: data.department_id,
          job_position_id: data.job_position_id || undefined,
          company_role: data.company_role,
          position: data.position || undefined,
          is_active: data.is_active,
        };
        result = await create(createData);
      }

      if (result && onSuccess) {
        onSuccess(result);
        if (!isEditMode) {
          reset(); // Reset form after creating
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {employeeError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{employeeError.message}</p>
        </div>
      )}

      {/* User Selection (Create only) */}
      {!isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User <span className="text-red-500">*</span>
          </label>
          <select
            {...register('user_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value={0}>Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {errors.user_id && (
            <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>
          )}
        </div>
      )}

      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <select
          {...register('location_id', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting || isEditMode}
        >
          <option value={0}>Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        {errors.location_id && (
          <p className="mt-1 text-sm text-red-600">{errors.location_id.message}</p>
        )}
      </div>

      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department <span className="text-red-500">*</span>
        </label>
        <select
          {...register('department_id', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value={0}>Select a department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        {errors.department_id && (
          <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>
        )}
      </div>

      {/* Job Position Selection (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
        <select
          {...register('job_position_id', {
            setValueAs: (v) => (v === '' || v === '0' ? null : parseInt(v)),
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="">None</option>
          {jobPositions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>
        {errors.job_position_id && (
          <p className="mt-1 text-sm text-red-600">{errors.job_position_id.message}</p>
        )}
      </div>

      {/* Company Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Role <span className="text-red-500">*</span>
        </label>
        <select
          {...register('company_role')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
        </select>
        {errors.company_role && (
          <p className="mt-1 text-sm text-red-600">{errors.company_role.message}</p>
        )}
      </div>

      {/* Position (Optional Text) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Position Title</label>
        <input
          type="text"
          {...register('position')}
          placeholder="e.g., Senior Developer, Sales Representative"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.position && (
          <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('is_active')}
          id="is_active"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isSubmitting}
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Active Employee
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditMode ? 'Update Employee' : 'Create Employee'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

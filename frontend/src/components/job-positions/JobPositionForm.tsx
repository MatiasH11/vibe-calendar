/**
 * JobPositionForm Component
 * Form for creating and editing job positions with validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useJobPosition } from '@/hooks/useJobPosition';
import { useDepartment } from '@/hooks/useDepartment';
import { JobPosition, CreateJobPositionInput, UpdateJobPositionInput } from '@/api/jobPositionApi';

// Form validation schema
const jobPositionFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  department_id: z.number().int().positive('Department is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #3B82F6)').optional(),
  is_active: z.boolean().default(true),
});

type JobPositionFormData = z.infer<typeof jobPositionFormSchema>;

interface JobPositionFormProps {
  jobPosition?: JobPosition | null;
  onSuccess?: (position: JobPosition) => void;
  onCancel?: () => void;
}

export function JobPositionForm({
  jobPosition,
  onSuccess,
  onCancel,
}: JobPositionFormProps) {
  const isEditMode = !!jobPosition;
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  const {
    create,
    update,
    isCreating,
    isUpdating,
    error: positionError,
    clearError,
  } = useJobPosition({
    onSuccess: (message) => {
      console.log(message);
    },
  });

  const { getActive: getActiveDepartments } = useDepartment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<JobPositionFormData>({
    resolver: zodResolver(jobPositionFormSchema),
    defaultValues: {
      name: '',
      department_id: 0,
      description: '',
      color: '#3B82F6',
      is_active: true,
    },
  });

  // Watch color field for preview
  const selectedColor = watch('color');

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      const depts = await getActiveDepartments();
      setDepartments(
        depts.map((d) => ({
          id: d.id,
          name: d.name,
        }))
      );
    };

    loadDepartments();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (jobPosition) {
      setValue('name', jobPosition.name);
      setValue('department_id', jobPosition.department_id);
      setValue('description', jobPosition.description || '');
      setValue('color', jobPosition.color || '#3B82F6');
      setValue('is_active', jobPosition.is_active);
    }
  }, [jobPosition, setValue]);

  const onSubmit = async (data: JobPositionFormData) => {
    clearError();

    try {
      let result: JobPosition | null = null;

      if (isEditMode && jobPosition) {
        // Update existing job position
        const updateData: UpdateJobPositionInput = {
          name: data.name,
          description: data.description || undefined,
          color: data.color || undefined,
          is_active: data.is_active,
        };
        result = await update(jobPosition.id, updateData);
      } else {
        // Create new job position
        const createData: CreateJobPositionInput = {
          name: data.name,
          department_id: data.department_id,
          description: data.description || undefined,
          color: data.color || undefined,
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
      {positionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{positionError.message}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('name')}
          placeholder="e.g., Cashier, Manager, Developer"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Department (Create only) */}
      {!isEditMode && (
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
      )}

      {/* Department (Edit mode - display only) */}
      {isEditMode && jobPosition && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <input
            type="text"
            value={jobPosition.department?.name || 'Unknown'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">Department cannot be changed after creation</p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register('description')}
          placeholder="Brief description of the job position..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            {...register('color')}
            placeholder="#3B82F6"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedColor || '#3B82F6'}
              onChange={(e) => setValue('color', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              disabled={isSubmitting}
            />
            <div
              className="w-10 h-10 rounded border-2 border-gray-300"
              style={{ backgroundColor: selectedColor || '#3B82F6' }}
            />
          </div>
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Used for visual identification in schedules and reports
        </p>
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
          Active Job Position
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
            <span>{isEditMode ? 'Update Job Position' : 'Create Job Position'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

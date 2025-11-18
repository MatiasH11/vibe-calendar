/**
 * DepartmentForm Component
 * Form for creating and editing departments with validation
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDepartment } from '@/hooks/useDepartment';
import { useLocation } from '@/hooks/useLocation';
import { Department, CreateDepartmentInput, UpdateDepartmentInput } from '@/api/departmentApi';

// Form validation schema
const departmentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  location_id: z.number().int().positive('Location is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #3B82F6)').optional(),
  is_active: z.boolean().default(true),
});

type DepartmentFormData = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  department?: Department | null;
  onSuccess?: (department: Department) => void;
  onCancel?: () => void;
}

export function DepartmentForm({
  department,
  onSuccess,
  onCancel,
}: DepartmentFormProps) {
  const isEditMode = !!department;
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);

  const {
    create,
    update,
    isCreating,
    isUpdating,
    error: departmentError,
    clearError,
  } = useDepartment({
    onSuccess: (message) => {
      console.log(message);
    },
  });

  const { getActive: getActiveLocations } = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      location_id: 0,
      description: '',
      color: '#3B82F6',
      is_active: true,
    },
  });

  // Watch color field for preview
  const selectedColor = watch('color');

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      const locs = await getActiveLocations();
      setLocations(
        locs.map((l) => ({
          id: l.id,
          name: l.name,
        }))
      );
    };

    loadLocations();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (department) {
      setValue('name', department.name);
      setValue('location_id', department.location_id);
      setValue('description', department.description || '');
      setValue('color', department.color || '#3B82F6');
      setValue('is_active', department.is_active);
    }
  }, [department, setValue]);

  const onSubmit = async (data: DepartmentFormData) => {
    clearError();

    try {
      let result: Department | null = null;

      if (isEditMode && department) {
        // Update existing department
        const updateData: UpdateDepartmentInput = {
          name: data.name,
          description: data.description || undefined,
          color: data.color || undefined,
          is_active: data.is_active,
        };
        result = await update(department.id, updateData);
      } else {
        // Create new department
        const createData: CreateDepartmentInput = {
          name: data.name,
          location_id: data.location_id,
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
      {departmentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{departmentError.message}</p>
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
          placeholder="e.g., Sales, Engineering, Operations"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Location (Create only) */}
      {!isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <select
            {...register('location_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value={0}>Select a location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          {errors.location_id && (
            <p className="mt-1 text-sm text-red-600">{errors.location_id.message}</p>
          )}
        </div>
      )}

      {/* Location (Edit mode - display only) */}
      {isEditMode && department && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={department.location?.name || 'Unknown'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">Location cannot be changed after creation</p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register('description')}
          placeholder="Brief description of the department..."
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
          Active Department
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
            <span>{isEditMode ? 'Update Department' : 'Create Department'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

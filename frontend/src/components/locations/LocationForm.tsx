/**
 * LocationForm Component
 * Form for creating and editing locations with validation
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from '@/hooks/useLocation';
import { Location, CreateLocationInput, UpdateLocationInput } from '@/api/locationApi';

// Form validation schema
const locationFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  address: z.string().max(255, 'Address must be less than 255 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
  is_active: z.boolean().default(true),
});

type LocationFormData = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  location?: Location | null;
  onSuccess?: (location: Location) => void;
  onCancel?: () => void;
}

export function LocationForm({
  location,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const isEditMode = !!location;

  const {
    create,
    update,
    isCreating,
    isUpdating,
    error: locationError,
    clearError,
  } = useLocation({
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
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
      is_active: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (location) {
      setValue('name', location.name);
      setValue('address', location.address || '');
      setValue('city', location.city || '');
      setValue('phone', location.phone || '');
      setValue('is_active', location.is_active);
    }
  }, [location, setValue]);

  const onSubmit = async (data: LocationFormData) => {
    clearError();

    try {
      let result: Location | null = null;

      if (isEditMode && location) {
        // Update existing location
        const updateData: UpdateLocationInput = {
          name: data.name,
          address: data.address || undefined,
          city: data.city || undefined,
          phone: data.phone || undefined,
          is_active: data.is_active,
        };
        result = await update(location.id, updateData);
      } else {
        // Create new location
        const createData: CreateLocationInput = {
          name: data.name,
          address: data.address || undefined,
          city: data.city || undefined,
          phone: data.phone || undefined,
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
      {locationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{locationError.message}</p>
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
          placeholder="e.g., Main Office, Downtown Store"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          {...register('address')}
          placeholder="e.g., 123 Main Street"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          {...register('city')}
          placeholder="e.g., New York"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="text"
          {...register('phone')}
          placeholder="e.g., (555) 123-4567"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
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
          Active Location
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
            <span>{isEditMode ? 'Update Location' : 'Create Location'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

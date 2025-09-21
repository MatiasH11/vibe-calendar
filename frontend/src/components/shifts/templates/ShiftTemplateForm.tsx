'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Save, X, AlertCircle } from 'lucide-react';
import { ShiftTemplate, CreateShiftTemplateRequest, UpdateShiftTemplateRequest } from '@/types/shifts/templates';

interface ShiftTemplateFormData {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface ShiftTemplateFormProps {
  initialData?: Partial<ShiftTemplate>;
  onSubmit: (data: CreateShiftTemplateRequest | UpdateShiftTemplateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

interface FormErrors {
  name?: string;
  start_time?: string;
  end_time?: string;
  general?: string;
}

export function ShiftTemplateForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  className = ''
}: ShiftTemplateFormProps) {
  const [formData, setFormData] = useState<ShiftTemplateFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        start_time: initialData.start_time || '',
        end_time: initialData.end_time || ''
      });
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ShiftTemplateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Validate start_time
    if (!formData.start_time) {
      newErrors.start_time = 'La hora de inicio es requerida';
    } else if (!/^\d{2}:\d{2}$/.test(formData.start_time)) {
      newErrors.start_time = 'Formato de hora inválido';
    }

    // Validate end_time
    if (!formData.end_time) {
      newErrors.end_time = 'La hora de fin es requerida';
    } else if (!/^\d{2}:\d{2}$/.test(formData.end_time)) {
      newErrors.end_time = 'Formato de hora inválido';
    }

    // Validate time range
    if (formData.start_time && formData.end_time && !newErrors.start_time && !newErrors.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);
      
      if (endTime <= startTime) {
        newErrors.end_time = 'La hora de fin debe ser posterior a la hora de inicio';
      }

      // Check for reasonable duration (at least 30 minutes, max 24 hours)
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      
      if (diffMinutes < 30) {
        newErrors.end_time = 'El turno debe durar al menos 30 minutos';
      } else if (diffMinutes > 24 * 60) {
        newErrors.end_time = 'El turno no puede durar más de 24 horas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting template form:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: 'Error al guardar la plantilla. Inténtalo de nuevo.' 
      }));
    }
  }, [formData, validateForm, onSubmit]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        '¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.'
      );
      if (!confirmed) return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  const formatTime = useCallback((time: string) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  const calculateDuration = useCallback(() => {
    if (!formData.start_time || !formData.end_time) return '';
    
    try {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      
      if (diffMs <= 0) return '';
      
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours === Math.floor(diffHours)) {
        return `${diffHours}h`;
      } else {
        const hours = Math.floor(diffHours);
        const minutes = Math.round((diffHours - hours) * 60);
        return `${hours}h ${minutes}m`;
      }
    } catch {
      return '';
    }
  }, [formData.start_time, formData.end_time]);

  const isEditMode = !!initialData?.id;

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="template-name" className="text-sm font-medium">
          Nombre de la Plantilla *
        </Label>
        <Input
          id="template-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="ej. Turno Mañana, Turno Noche, etc."
          disabled={isLoading}
          className={errors.name ? 'border-red-300 focus:border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="template-description" className="text-sm font-medium">
          Descripción (Opcional)
        </Label>
        <Textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descripción adicional de la plantilla..."
          disabled={isLoading}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-500">
          {formData.description.length}/500 caracteres
        </p>
      </div>

      {/* Time Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time" className="text-sm font-medium">
            Hora de Inicio *
          </Label>
          <Input
            id="start-time"
            type="time"
            value={formData.start_time}
            onChange={(e) => updateField('start_time', e.target.value)}
            disabled={isLoading}
            className={errors.start_time ? 'border-red-300 focus:border-red-500' : ''}
          />
          {errors.start_time && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.start_time}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time" className="text-sm font-medium">
            Hora de Fin *
          </Label>
          <Input
            id="end-time"
            type="time"
            value={formData.end_time}
            onChange={(e) => updateField('end_time', e.target.value)}
            disabled={isLoading}
            className={errors.end_time ? 'border-red-300 focus:border-red-500' : ''}
          />
          {errors.end_time && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.end_time}
            </p>
          )}
        </div>
      </div>

      {/* Duration Preview */}
      {formData.start_time && formData.end_time && !errors.start_time && !errors.end_time && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Vista previa:</span>
            <span>
              {formatTime(formData.start_time)} - {formatTime(formData.end_time)}
            </span>
            <span className="text-blue-600">
              ({calculateDuration()})
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {(error || errors.general) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || errors.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading 
            ? (isEditMode ? 'Actualizando...' : 'Creando...') 
            : (isEditMode ? 'Actualizar Plantilla' : 'Crear Plantilla')
          }
        </Button>
      </div>
    </form>
  );
}
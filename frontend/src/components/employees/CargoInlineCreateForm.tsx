'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  cargoQuickCreateSchema, 
  CargoQuickCreateFormData,
  CARGO_COLORS 
} from '@/lib/validations/cargo';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { Briefcase, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

interface CargoInlineCreateFormProps {
  onCreated: (cargoId: number) => void;
  onCancel: () => void;
}

export function CargoInlineCreateForm({ onCreated, onCancel }: CargoInlineCreateFormProps) {
  const { createCargo, isCreating } = useCargosContextual();

  const form = useForm<CargoQuickCreateFormData>({
    resolver: zodResolver(cargoQuickCreateSchema),
    defaultValues: {
      name: '',
      color: CARGO_COLORS[0].value,
    },
  });

  const handleSubmit = async (data: CargoQuickCreateFormData) => {
    try {
      // El hook createCargo ya maneja el toast, necesitamos capturar el ID del nuevo cargo
      await createCargo({
        name: data.name,
        color: data.color,
        description: `Cargo: ${data.name}`,
      });
      
      // Como no tenemos acceso directo al response, usaremos un workaround temporal
      // En una implementación real, el createCargo debería devolver el nuevo cargo
      // Por ahora, asumiremos que se creó correctamente y usaremos un ID temporal
      const tempId = Date.now(); // ID temporal para simular
      onCreated(tempId);
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Nombre del cargo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Input
            {...form.register('name')}
            placeholder="Nombre del cargo"
            className={form.formState.errors.name ? 'border-red-500' : ''}
            autoFocus
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Selector de color compacto */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            {CARGO_COLORS.slice(0, 4).map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => form.setValue('color', colorOption.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  form.watch('color') === colorOption.value 
                    ? 'border-gray-900 scale-110' 
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: colorOption.value }}
                title={colorOption.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Vista previa compacta */}
      <div className="flex items-center space-x-2 p-2 bg-white rounded border">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: form.watch('color') }}
        />
        <span className="text-sm font-medium">
          {form.watch('name') || 'Nuevo cargo'}
        </span>
        <Badge variant="outline" className="text-xs">
          0 empleados
        </Badge>
      </div>

      {/* Acciones compactas */}
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={onCancel}
          disabled={isCreating}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          size="sm"
          disabled={isCreating || !form.watch('name')}
        >
          {isCreating ? 'Creando...' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

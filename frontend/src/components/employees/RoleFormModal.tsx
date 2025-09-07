'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  cargoQuickCreateSchema, 
  CargoQuickCreateFormData,
  CARGO_COLORS 
} from '@/lib/validations/cargo';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { Cargo } from '@/types/employee';
import { Briefcase, Palette, Users, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole?: Cargo | null;
}

export function RoleFormModal({ isOpen, onClose, editingRole }: RoleFormModalProps) {
  const { createCargo, updateCargo, isCreating, isUpdating } = useCargosContextual();
  const isEditing = !!editingRole;

  const form = useForm<CargoQuickCreateFormData>({
    resolver: zodResolver(cargoQuickCreateSchema),
    defaultValues: {
      name: '',
      color: CARGO_COLORS[0].value,
    },
  });

  // Actualizar formulario cuando se edita un rol
  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        color: editingRole.color,
      });
    } else {
      form.reset({
        name: '',
        color: CARGO_COLORS[0].value,
      });
    }
  }, [editingRole, form]);

  const handleSubmit = async (data: CargoQuickCreateFormData) => {
    try {
      if (isEditing && editingRole) {
        await updateCargo({
          id: editingRole.id,
          data: {
            name: data.name,
            color: data.color,
            description: editingRole.description || '',
          }
        });
      } else {
        await createCargo({
          name: data.name,
          color: data.color,
          description: '', // Descripción opcional en creación rápida
        });
      }
      form.reset();
      onClose();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Edit className="w-5 h-5" />
                <span>Editar Cargo</span>
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5" />
                <span>Crear Cargo Rápido</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Nombre del cargo */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Nombre del Cargo</span>
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ej: Cocinero, Cajero, Mesero"
              className={form.formState.errors.name ? 'border-red-500' : ''}
              autoFocus
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Selector de color */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Color del Cargo</span>
            </Label>
            
            <div className="grid grid-cols-4 gap-2">
              {CARGO_COLORS.map((colorOption, index) => (
                <motion.button
                  key={colorOption.value}
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => form.setValue('color', colorOption.value)}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    form.watch('color') === colorOption.value 
                      ? 'border-gray-900 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: `${colorOption.value}20` }}
                >
                  <div 
                    className="w-6 h-6 rounded-full mx-auto"
                    style={{ backgroundColor: colorOption.value }}
                  />
                  <span className="text-xs text-gray-600 mt-1 block">
                    {colorOption.name}
                  </span>
                  
                  {form.watch('color') === colorOption.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        ✓
                      </Badge>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            
            {form.formState.errors.color && (
              <p className="text-sm text-red-500">
                {form.formState.errors.color.message}
              </p>
            )}
          </div>

          {/* Vista previa */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm text-gray-600 mb-2 block">Vista Previa:</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: form.watch('color') }}
              />
              <span className="font-medium">
                {form.watch('name') || 'Nombre del cargo'}
              </span>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {isEditing && editingRole ? (editingRole._count?.employees || 0) : 0}
              </Badge>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating || isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating || !form.watch('name')}
            >
              {isCreating ? 'Creando...' : isUpdating ? 'Actualizando...' : isEditing ? 'Actualizar Cargo' : 'Crear Cargo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';
import { ShiftTemplate, TemplateFilters } from '@/types/shifts/templates';
import { ShiftTemplateForm } from './ShiftTemplateForm';

interface ShiftTemplateManagerProps {
  onTemplateSelect?: (template: ShiftTemplate) => void;
  selectionMode?: boolean;
  className?: string;
}

export function ShiftTemplateManager({
  onTemplateSelect,
  selectionMode = false,
  className = ''
}: ShiftTemplateManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TemplateFilters['sort_by']>('usage_count');
  const [sortOrder, setSortOrder] = useState<TemplateFilters['sort_order']>('desc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ShiftTemplate | null>(null);

  const filters: TemplateFilters = {
    search: searchQuery || undefined,
    sort_by: sortBy,
    sort_order: sortOrder
  };

  const {
    templates,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates
  } = useShiftTemplates(filters);

  const formatTime = useCallback((time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  const calculateDuration = useCallback((startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours === Math.floor(diffHours)) {
      return `${diffHours}h`;
    } else {
      const hours = Math.floor(diffHours);
      const minutes = Math.round((diffHours - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
  }, []);

  const handleCreateTemplate = useCallback(async (data: any) => {
    try {
      await createTemplate(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  }, [createTemplate]);

  const handleUpdateTemplate = useCallback(async (data: any) => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate(editingTemplate.id, data);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  }, [editingTemplate, updateTemplate]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!deletingTemplate) return;
    
    try {
      await deleteTemplate(deletingTemplate.id);
      setDeletingTemplate(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }, [deletingTemplate, deleteTemplate]);

  const handleTemplateClick = useCallback((template: ShiftTemplate) => {
    if (selectionMode && onTemplateSelect) {
      onTemplateSelect(template);
    }
  }, [selectionMode, onTemplateSelect]);

  const toggleSort = useCallback((field: TemplateFilters['sort_by']) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const getSortIcon = useCallback((field: TemplateFilters['sort_by']) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  }, [sortBy, sortOrder]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectionMode ? 'Seleccionar Plantilla' : 'Gestión de Plantillas'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectionMode 
              ? 'Elige una plantilla para aplicar a tu turno'
              : 'Crea y gestiona plantillas de turnos para tu empresa'
            }
          </p>
        </div>
        
        {!selectionMode && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                <DialogDescription>
                  Crea una plantilla de turno que podrás reutilizar en el futuro.
                </DialogDescription>
              </DialogHeader>
              <ShiftTemplateForm
                onSubmit={handleCreateTemplate}
                onCancel={() => setShowCreateDialog(false)}
                isLoading={isCreating}
                error={createError}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-') as [TemplateFilters['sort_by'], TemplateFilters['sort_order']];
          setSortBy(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage_count-desc">Más usadas</SelectItem>
            <SelectItem value="usage_count-asc">Menos usadas</SelectItem>
            <SelectItem value="name-asc">Nombre A-Z</SelectItem>
            <SelectItem value="name-desc">Nombre Z-A</SelectItem>
            <SelectItem value="created_at-desc">Más recientes</SelectItem>
            <SelectItem value="created_at-asc">Más antiguas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No se encontraron plantillas' : 'No hay plantillas creadas'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primera plantilla para empezar a ahorrar tiempo'
              }
            </p>
            {!selectionMode && !searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Plantilla
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                selectionMode ? 'cursor-pointer hover:border-blue-300' : ''
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1 text-sm text-gray-600">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  {!selectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingTemplate(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatTime(template.start_time)} - {formatTime(template.end_time)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {calculateDuration(template.start_time, template.end_time)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{template.usage_count} usos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(template.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la plantilla.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <ShiftTemplateForm
              initialData={editingTemplate}
              onSubmit={handleUpdateTemplate}
              onCancel={() => setEditingTemplate(null)}
              isLoading={isUpdating}
              error={updateError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Plantilla</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la plantilla &ldquo;{deletingTemplate?.name}&rdquo;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingTemplate(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
          {deleteError && (
            <p className="text-sm text-red-600 mt-2">{deleteError}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
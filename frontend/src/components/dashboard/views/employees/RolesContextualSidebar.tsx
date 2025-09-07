'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Filter,
  X,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';
import { useCargosContextual } from '@/hooks/useCargosContextual';
import { Cargo } from '@/types/employee';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function RolesContextualSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  
  const { 
    setCreatingCargo, 
    roleFilter 
  } = useEmployeesStore();

  const {
    cargos,
    selectedCargo,
    isLoading,
    error,
    createCargo,
    updateCargo,
    deleteCargo,
    isCreating,
    isUpdating,
    isDeleting,
    filterByRole,
    clearFilter,
    canDeleteCargo,
    getCargoStats,
    refetch
  } = useCargosContextual();

  // Filtrar cargos por búsqueda
  const filteredCargos = cargos.filter(cargo =>
    cargo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cargo.description && cargo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteCargo = async (cargo: Cargo) => {
    const stats = getCargoStats(cargo);
    
    if (!stats.canDelete) {
      toast.error(`No se puede eliminar. Hay ${stats.employeeCount} empleado(s) asignados.`);
      return;
    }

    if (confirm(`¿Eliminar el cargo "${cargo.name}"?`)) {
      await deleteCargo(cargo.id);
    }
  };

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Cargos</span>
          </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm mb-3">Error al cargar cargos</p>
            <Button size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del sidebar */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Equipos</h3>
            {cargos.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cargos.length}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setCreatingCargo(true)}
            disabled={isCreating}
            className="h-8 px-3 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>
        
        {/* Filtro activo */}
        {roleFilter && (
          <div className="mb-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
              <span className="flex items-center space-x-2 text-blue-700">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtro activo</span>
              </span>
              <button 
                onClick={clearFilter}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
                title="Quitar filtro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Búsqueda de equipos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Lista de equipos */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredCargos.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron equipos' : 'No hay equipos creados'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Crea tu primer equipo para organizar empleados'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setCreatingCargo(true)}
                  className="text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer equipo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCargos.map((cargo, index) => {
                const stats = getCargoStats(cargo);
                
                return (
                  <div
                    key={cargo.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                      stats.isSelected 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => filterByRole(cargo.id)}
                  >
                    {/* Header del equipo */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cargo.color }}
                        />
                        <span className={`text-sm font-semibold truncate ${
                          stats.isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {cargo.name}
                        </span>
                      </div>
                      
                      {stats.isSelected && (
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Stats del equipo */}
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${
                        stats.isSelected ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {stats.employeeCount} empleado{stats.employeeCount !== 1 ? 's' : ''}
                      </div>
                      
                      {/* Acciones en hover */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCargo(cargo);
                          }}
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                          title="Editar equipo"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCargo(cargo);
                          }}
                          disabled={!stats.canDelete || isDeleting}
                          className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 disabled:opacity-50"
                          title={stats.canDelete ? "Eliminar equipo" : "No se puede eliminar: tiene empleados"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer con estadísticas */}
      {cargos.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600 text-center">
            <span className="font-medium">{cargos.length}</span> equipo{cargos.length !== 1 ? 's' : ''} • 
            <span className="text-green-600 font-medium ml-1">
              {cargos.filter(c => (c._count?.employees || 0) > 0).length}
            </span> con empleados
          </div>
        </div>
      )}
    </div>
  );
}

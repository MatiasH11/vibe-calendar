'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Users, Briefcase, X, Filter } from 'lucide-react';
import { useEmployeesStore } from '@/stores/employeesStore';
import { useCargosContextual } from '@/hooks/useCargosContextual';

export function EmployeeBreadcrumbs() {
  const { roleFilter, searchTerm, clearAllFilters } = useEmployeesStore();
  const { cargos } = useCargosContextual();
  
  const selectedCargo = cargos.find(c => c.id === roleFilter);
  const hasFilters = roleFilter || searchTerm;

  if (!hasFilters) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <Users className="w-4 h-4" />
        <span>Todos los empleados</span>
        <Badge variant="outline" className="text-xs">
          Sin filtros
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-1.5 text-xs">
        <Users className="w-3 h-3 text-gray-500" />
        <span className="text-gray-500">Empleados</span>
        
        {selectedCargo && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <div className="flex items-center space-x-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedCargo.color }}
              />
              <span className="font-medium text-blue-600">{selectedCargo.name}</span>
              <Badge variant="default" className="text-[10px] px-1 py-0">
                {selectedCargo._count?.employees || 0}
              </Badge>
            </div>
          </>
        )}
        
        {searchTerm && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3 h-3 text-purple-600" />
              <span className="text-purple-600">&quot;{searchTerm}&quot;</span>
            </div>
          </>
        )}
      </div>
      
      {(selectedCargo || searchTerm) && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex items-center space-x-1 text-[10px] h-6 px-2"
        >
          <X className="w-2.5 h-2.5" />
          <span>Limpiar</span>
        </Button>
      )}
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ShiftFilters } from '@/hooks/shifts/useShifts';

interface FiltersIndicatorProps {
  filters: ShiftFilters;
  onUpdateFilters: (filters: Partial<ShiftFilters>) => void;
  onClearFilters: () => void;
  totalEmployees: number;
  filteredEmployees: number;
}

export function FiltersIndicator({
  filters,
  onUpdateFilters,
  onClearFilters,
  totalEmployees,
  filteredEmployees
}: FiltersIndicatorProps) {
  const hasActiveFilters = filters.employeeName || filters.role !== 'all';

  if (!hasActiveFilters) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-blue-700 font-medium">
            Filtros activos:
          </span>
          
          {filters.employeeName && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Nombre: &ldquo;{filters.employeeName}&rdquo;
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                onClick={() => onUpdateFilters({ employeeName: '' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.role !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Rol: {filters.role.charAt(0).toUpperCase() + filters.role.slice(1)}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                onClick={() => onUpdateFilters({ role: 'all' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-blue-600">
            Mostrando {filteredEmployees} de {totalEmployees} empleados
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            Limpiar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RotateCcw, Download, Plus, Filter, X } from 'lucide-react';
import { ShiftFilters } from '@/hooks/shifts/useShifts';
import { EmployeeWithShifts } from '@/types/shifts/shift';

interface ShiftsToolbarProps {
  currentWeek: string;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  filters: ShiftFilters;
  onUpdateFilters: (filters: Partial<ShiftFilters>) => void;
  onClearFilters: () => void;
  allEmployees: EmployeeWithShifts[];
}

export function ShiftsToolbar({
  currentWeek,
  onNavigateWeek,
  onGoToToday,
  onRefresh,
  isLoading,
  filters,
  onUpdateFilters,
  onClearFilters,
  allEmployees
}: ShiftsToolbarProps) {
  // Obtener roles únicos de los empleados
  const availableRoles = Array.from(
    new Set(
      allEmployees
        .map(emp => emp.role?.name)
        .filter(Boolean)
        .map(role => role!.toLowerCase())
    )
  ).sort();

  const hasActiveFilters = filters.employeeName || filters.role !== 'all';

  return (
    <div className="flex items-center space-x-4">
      {/* Navegación de semana */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateWeek('prev')}
          disabled={isLoading}
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateWeek('next')}
          disabled={isLoading}
        >
          →
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGoToToday}
          disabled={isLoading}
        >
          Hoy
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Input
            placeholder="Filtrar empleados..."
            className="w-48"
            value={filters.employeeName}
            onChange={(e) => onUpdateFilters({ employeeName: e.target.value })}
          />
          {filters.employeeName && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onUpdateFilters({ employeeName: '' })}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <Select
          value={filters.role}
          onValueChange={(value) => onUpdateFilters({ role: value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {availableRoles.map(role => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Turno
        </Button>
      </div>
    </div>
  );
}

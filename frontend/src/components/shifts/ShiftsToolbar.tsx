'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RotateCcw, Download, Plus, Filter } from 'lucide-react';

interface ShiftsToolbarProps {
  currentWeek: string;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ShiftsToolbar({
  currentWeek,
  onNavigateWeek,
  onGoToToday,
  onRefresh,
  isLoading
}: ShiftsToolbarProps) {
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
        <Input
          placeholder="Filtrar empleados..."
          className="w-48"
        />
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="cocina">Cocina</SelectItem>
            <SelectItem value="caja">Caja</SelectItem>
          </SelectContent>
        </Select>
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

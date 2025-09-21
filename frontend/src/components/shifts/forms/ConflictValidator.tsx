'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Lightbulb
} from 'lucide-react';
import { ConflictInfo } from '@/types/shifts/templates';
import { cn } from '@/lib/utils';

interface ConflictValidatorProps {
  conflicts: ConflictInfo[];
  isValidating?: boolean;
  onAlternativeSelect?: (employeeId: number, alternative: { start_time: string; end_time: string; reason: string }) => void;
  onConflictResolve?: (conflicts: ConflictInfo[]) => void;
  className?: string;
  showAlternatives?: boolean;
}

const formatTime = (time: string) => {
  // Convert HH:mm to more readable format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

export const ConflictValidator = memo<ConflictValidatorProps>(({
  conflicts,
  isValidating = false,
  onAlternativeSelect,
  onConflictResolve,
  className,
  showAlternatives = true
}) => {
  const hasConflicts = conflicts.length > 0;

  if (isValidating) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Validando conflictos...</span>
        </div>
      </div>
    );
  }

  if (!hasConflicts) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>No se detectaron conflictos de horarios</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Conflict Summary */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Se detectaron {conflicts.length} conflicto{conflicts.length > 1 ? 's' : ''} de horarios
        </AlertDescription>
      </Alert>

      {/* Detailed Conflicts */}
      <div className="space-y-3">
        {conflicts.map((conflict, index) => (
          <div 
            key={`${conflict.employee_id}-${conflict.date}-${index}`}
            className="border border-red-200 rounded-lg p-4 bg-red-50"
          >
            {/* Conflict Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">
                    {conflict.employee_name}
                  </div>
                  <div className="text-sm text-red-700 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(conflict.date)}</span>
                  </div>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Conflicto
              </Badge>
            </div>

            {/* Conflicting Shifts */}
            <div className="mb-3">
              <div className="text-sm font-medium text-red-800 mb-2">
                Turnos existentes que generan conflicto:
              </div>
              <div className="space-y-1">
                {conflict.conflicting_shifts.map((shift) => (
                  <div 
                    key={shift.id}
                    className="flex items-center space-x-2 text-sm text-red-700 bg-red-100 rounded px-2 py-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </span>
                    {shift.notes && (
                      <span className="text-red-600">• {shift.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Alternative Suggestions */}
            {showAlternatives && conflict.suggested_alternatives.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-blue-800 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Horarios alternativos sugeridos:</span>
                </div>
                <div className="space-y-1">
                  {conflict.suggested_alternatives.map((alternative, altIndex) => (
                    <Button
                      key={`${alternative.start_time}-${alternative.end_time}-${altIndex}`}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto p-2 border-blue-200 hover:bg-blue-50"
                      onClick={() => onAlternativeSelect?.(conflict.employee_id, alternative)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-900">
                            {formatTime(alternative.start_time)} - {formatTime(alternative.end_time)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {alternative.reason}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resolution Actions */}
      {onConflictResolve && (
        <div className="flex items-center justify-between pt-3 border-t border-red-200">
          <div className="text-sm text-red-700">
            ¿Cómo deseas proceder con estos conflictos?
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConflictResolve(conflicts)}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Resolver manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
        <strong>Sugerencia:</strong> Los conflictos ocurren cuando hay solapamiento de horarios. 
        Puedes usar las sugerencias alternativas o ajustar manualmente los horarios.
      </div>
    </div>
  );
});

ConflictValidator.displayName = 'ConflictValidator';
'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Layout, TrendingUp, History } from 'lucide-react';
import { TimeSuggestion } from '@/types/shifts/templates';
import { cn } from '@/lib/utils';

interface ShiftSuggestionsProps {
  suggestions: TimeSuggestion[];
  onSuggestionSelect: (suggestion: TimeSuggestion) => void;
  isLoading?: boolean;
  className?: string;
}

const getSuggestionIcon = (source: TimeSuggestion['source']) => {
  switch (source) {
    case 'template':
      return Layout;
    case 'pattern':
      return TrendingUp;
    case 'recent':
      return History;
    default:
      return Clock;
  }
};

const getSuggestionColor = (source: TimeSuggestion['source']) => {
  switch (source) {
    case 'template':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'pattern':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'recent':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const formatTime = (time: string) => {
  // Convert HH:mm to more readable format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const calculateDuration = (startTime: string, endTime: string) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  let durationMinutes = endTotalMinutes - startTotalMinutes;
  
  // Handle overnight shifts
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export const ShiftSuggestions = memo<ShiftSuggestionsProps>(({
  suggestions,
  onSuggestionSelect,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Cargando sugerencias...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>No hay sugerencias disponibles</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Clock className="h-4 w-4" />
        <span>Sugerencias de horarios</span>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = getSuggestionIcon(suggestion.source);
          const duration = calculateDuration(suggestion.start_time, suggestion.end_time);
          
          return (
            <Button
              key={`${suggestion.source}-${suggestion.start_time}-${suggestion.end_time}-${index}`}
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {formatTime(suggestion.start_time)} - {formatTime(suggestion.end_time)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {suggestion.label} • {duration}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {suggestion.frequency > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.frequency}x
                    </Badge>
                  )}
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getSuggestionColor(suggestion.source))}
                  >
                    {suggestion.source === 'template' && 'Plantilla'}
                    {suggestion.source === 'pattern' && 'Patrón'}
                    {suggestion.source === 'recent' && 'Reciente'}
                  </Badge>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 pt-2 border-t">
        Haz clic en una sugerencia para aplicar los horarios automáticamente
      </div>
    </div>
  );
});

ShiftSuggestions.displayName = 'ShiftSuggestions';
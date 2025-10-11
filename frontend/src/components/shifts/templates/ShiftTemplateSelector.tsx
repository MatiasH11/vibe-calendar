
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';
import { ShiftTemplate } from '@/types/shifts/templates';
import { formatTimeSafe } from '@/lib/timezone-client';

interface ShiftTemplateSelectorProps {
  onTemplateSelect: (template: ShiftTemplate) => void;
  selectedTemplateId?: number;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function ShiftTemplateSelector({
  onTemplateSelect,
  selectedTemplateId,
  disabled = false,
  showPreview = true,
  className = ''
}: ShiftTemplateSelectorProps) {
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const { templates, isLoading, useTemplate: incrementTemplateUsage } = useShiftTemplates({
    sort_by: 'usage_count',
    sort_order: 'desc'
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = useCallback(async (templateId: string) => {
    if (templateId === 'none') {
      setShowTemplatePreview(false);
      return;
    }
    
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      // Increment usage count
      try {
        await incrementTemplateUsage(template.id);
      } catch (error) {
        console.warn('Failed to increment template usage:', error);
      }
      
      // Aplicar automáticamente la plantilla
      onTemplateSelect(template);
      setShowTemplatePreview(true);
    }
  }, [templates, onTemplateSelect, incrementTemplateUsage]);

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
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
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Template Cards Selector */}
      <div className="space-y-2">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-sm">No hay plantillas disponibles</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group ${
                  selectedTemplateId === template.id
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md'
                    : 'hover:border-blue-200 hover:bg-gray-50'
                }`}
                onClick={() => !disabled && handleTemplateSelect(template.id.toString())}
              >
                <CardContent className="p-3">
                  {/* Primera fila: Nombre y contador de usos */}
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-sm font-semibold text-gray-800 truncate flex-1 group-hover:text-blue-700 transition-colors">
                      {template.name}
                    </CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-1 h-5 flex-shrink-0 transition-colors ${
                        selectedTemplateId === template.id 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}
                    >
                      {template.usage_count} usos
                    </Badge>
                  </div>
                  
                  {/* Segunda fila: Horario y duración */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Clock className="h-3 w-3 text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <span className="truncate font-medium">
                        {formatTimeSafe(template.start_time)} - {formatTimeSafe(template.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <div className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Calendar className="h-3 w-3 text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <span className="text-xs font-medium">
                        {calculateDuration(template.start_time, template.end_time)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Checkmark de selección */}
                  {selectedTemplateId === template.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Template Preview */}
      {showPreview && selectedTemplate && showTemplatePreview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-900">
                {selectedTemplate.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplatePreview(false)}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
            {selectedTemplate.description && (
              <CardDescription className="text-xs text-blue-700">
                {selectedTemplate.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-800">
                  {formatTimeSafe(selectedTemplate.start_time)} - {formatTimeSafe(selectedTemplate.end_time)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-blue-800">
                  {calculateDuration(selectedTemplate.start_time, selectedTemplate.end_time)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-blue-800">
                  {selectedTemplate.usage_count} usos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
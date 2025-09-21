'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';
import { ShiftTemplate } from '@/types/shifts/templates';

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
      {/* Template Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Usar Plantilla
          </label>
          {templates.length === 0 && (
            <span className="text-xs text-gray-500">
              No hay plantillas disponibles
            </span>
          )}
        </div>
        
        <Select
          value={selectedTemplateId?.toString() || undefined}
          onValueChange={handleTemplateSelect}
          disabled={disabled || templates.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una plantilla..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin plantilla</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{template.name}</span>
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(template.start_time)} - {formatTime(template.end_time)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {template.usage_count} usos
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  {formatTime(selectedTemplate.start_time)} - {formatTime(selectedTemplate.end_time)}
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

      {/* Use Template Button */}
      {selectedTemplate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onTemplateSelect(selectedTemplate)}
          disabled={disabled}
          className="w-full"
        >
          <Clock className="h-4 w-4 mr-2" />
          Aplicar Plantilla
        </Button>
      )}
    </div>
  );
}
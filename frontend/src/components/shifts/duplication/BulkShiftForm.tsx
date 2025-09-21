import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Clock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { ShiftTemplateSelector } from '@/components/shifts/templates/ShiftTemplateSelector';
import { EmployeeWithShifts } from '@/types/shifts/employee';
import { ShiftTemplate, BulkShiftCreationRequest, BulkOperationPreview as BulkOperationPreviewData } from '@/types/shifts/templates';
import { shiftsApiService } from '@/lib/shifts';
import { formatTime, formatDate } from '@/lib/utils';

interface BulkShiftFormProps {
  employees: EmployeeWithShifts[];
  onSubmit: (request: BulkShiftCreationRequest) => Promise<void>;
  onPreview: (preview: BulkOperationPreviewData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface BulkShiftFormData {
  employee_ids: number[];
  dates: string[];
  start_time: string;
  end_time: string;
  notes: string;
  template_id?: number;
  use_template: boolean;
}

interface FormErrors {
  employee_ids?: string;
  dates?: string;
  start_time?: string;
  end_time?: string;
  general?: string;
}

export const BulkShiftForm: React.FC<BulkShiftFormProps> = ({
  employees,
  onSubmit,
  onPreview,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<BulkShiftFormData>({
    employee_ids: [],
    dates: [],
    start_time: '',
    end_time: '',
    notes: '',
    template_id: undefined,
    use_template: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [preview, setPreview] = useState<BulkOperationPreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Employee options for multi-select
  const employeeOptions = employees.map(emp => ({
    value: emp.id.toString(),
    label: `${emp.user.first_name} ${emp.user.last_name}`,
    disabled: false
  }));

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.employee_ids.length === 0) {
      newErrors.employee_ids = 'Please select at least one employee';
    }

    if (formData.dates.length === 0) {
      newErrors.dates = 'Please select at least one date';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePreview = useCallback(async () => {
    setIsValidating(true);
    try {
      const request: BulkShiftCreationRequest = {
        employee_ids: formData.employee_ids,
        dates: formData.dates,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || undefined,
        template_id: formData.use_template ? formData.template_id : undefined
      };

      const previewData = await shiftsApiService.previewBulkShifts(request);
      setPreview(previewData);
      setShowPreview(true);
      onPreview(previewData);
    } catch (error) {
      console.error('Error generating preview:', error);
      setErrors({ general: 'Failed to generate preview. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  }, [formData, onPreview]);

  // Generate preview when form data changes
  useEffect(() => {
    if (formData.employee_ids.length > 0 && 
        formData.dates.length > 0 && 
        formData.start_time && 
        formData.end_time &&
        formData.start_time < formData.end_time) {
      generatePreview();
    } else {
      setPreview(null);
      setShowPreview(false);
    }
  }, [formData, generatePreview]);

  const handleTemplateSelect = (template: ShiftTemplate) => {
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      start_time: template.start_time,
      end_time: template.end_time,
      use_template: true
    }));
  };

  const handleEmployeeChange = (employeeIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      employee_ids: employeeIds.map(id => parseInt(id))
    }));
  };

  const handleDateChange = (dates: Date[] | undefined) => {
    const dateStrings = dates?.map(date => 
      date.toISOString().split('T')[0]
    ) || [];
    setFormData(prev => ({
      ...prev,
      dates: dateStrings
    }));
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      use_template: false, // Disable template when manually changing times
      template_id: undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const request: BulkShiftCreationRequest = {
        employee_ids: formData.employee_ids,
        dates: formData.dates,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || undefined,
        template_id: formData.use_template ? formData.template_id : undefined
      };

      await onSubmit(request);
    } catch (error) {
      console.error('Error submitting bulk shift form:', error);
      setErrors({ general: 'Failed to create shifts. Please try again.' });
    }
  };

  const addQuickDate = (days: number) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);
    const dateString = targetDate.toISOString().split('T')[0];
    
    if (!formData.dates.includes(dateString)) {
      setFormData(prev => ({
        ...prev,
        dates: [...prev.dates, dateString]
      }));
    }
  };

  const removeDate = (dateToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter(date => date !== dateToRemove)
    }));
  };

  const totalShifts = formData.employee_ids.length * formData.dates.length;
  const hasConflicts = preview?.conflicts && preview.conflicts.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Employees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employees">Employees *</Label>
            <MultiSelect
              options={employeeOptions}
              value={formData.employee_ids.map(id => id.toString())}
              onValueChange={handleEmployeeChange}
              placeholder="Select employees..."
              className="w-full"
            />
            {errors.employee_ids && (
              <p className="text-sm text-destructive">{errors.employee_ids}</p>
            )}
          </div>

          {formData.employee_ids.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Employees ({formData.employee_ids.length})</Label>
              <div className="flex flex-wrap gap-1">
                {formData.employee_ids.map(employeeId => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  return (
                    <Badge key={employeeId} variant="secondary">
                      {employee ? `${employee.user.first_name} ${employee.user.last_name}` : 'Unknown'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quick Date Selection</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuickDate(0)}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuickDate(1)}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add next 7 days
                  const newDates: string[] = [];
                  for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateString = date.toISOString().split('T')[0];
                    if (!formData.dates.includes(dateString)) {
                      newDates.push(dateString);
                    }
                  }
                  setFormData(prev => ({
                    ...prev,
                    dates: [...prev.dates, ...newDates]
                  }));
                }}
              >
                Next 7 Days
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dates">Custom Date Selection *</Label>
            <DatePicker
              mode="multiple"
              selected={formData.dates.map(date => new Date(date))}
              onSelect={handleDateChange}
              disabled={(date) => {
                // Disable past dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="w-full"
            />
            {errors.dates && (
              <p className="text-sm text-destructive">{errors.dates}</p>
            )}
          </div>

          {formData.dates.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Dates ({formData.dates.length})</Label>
              <div className="flex flex-wrap gap-1">
                {formData.dates.map(date => (
                  <Badge 
                    key={date} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeDate(date)}
                  >
                    {formatDate(date)}
                    <Trash2 className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time and Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Times
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Use Template (Optional)</Label>
            <ShiftTemplateSelector
              selectedTemplateId={formData.use_template ? formData.template_id : undefined}
              onTemplateSelect={handleTemplateSelect}
            />
          </div>

          {/* Manual Time Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className={errors.start_time ? 'border-destructive' : ''}
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className={errors.end_time ? 'border-destructive' : ''}
              />
              {errors.end_time && (
                <p className="text-sm text-destructive">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {formData.start_time && formData.end_time && formData.start_time < formData.end_time && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Duration: </span>
                {(() => {
                  const start = new Date(`2000-01-01T${formData.start_time}`);
                  const end = new Date(`2000-01-01T${formData.end_time}`);
                  const diff = end.getTime() - start.getTime();
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  return `${hours}h ${minutes}m`;
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(formData.start_time)} - {formatTime(formData.end_time)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes for these shifts..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {totalShifts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Summary</span>
              <Badge variant="outline">
                {totalShifts} shift{totalShifts !== 1 ? 's' : ''} to create
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Employees</Label>
                <p className="font-medium">{formData.employee_ids.length}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Dates</Label>
                <p className="font-medium">{formData.dates.length}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time Range</Label>
                <p className="font-medium">
                  {formData.start_time && formData.end_time ? 
                    `${formatTime(formData.start_time)} - ${formatTime(formData.end_time)}` : 
                    'Not set'
                  }
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Shifts</Label>
                <p className="font-medium">{totalShifts}</p>
              </div>
            </div>

            {hasConflicts && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview?.conflicts.length} conflict{preview?.conflicts.length !== 1 ? 's' : ''} detected. 
                  Review conflicts in the preview before creating shifts.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={totalShifts === 0 || isLoading || isValidating}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Shifts...
            </>
          ) : isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Validating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create {totalShifts} Shift{totalShifts !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
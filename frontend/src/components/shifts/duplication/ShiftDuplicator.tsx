import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Copy, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Shift } from '@/types/shifts/shift';
import { EmployeeWithShifts } from '@/types/shifts/employee';
import { ShiftDuplicationRequest, ConflictInfo } from '@/types/shifts/templates';
import { shiftsApiService } from '@/lib/shifts';
import { formatTime, formatDate } from '@/lib/utils';

interface ShiftDuplicatorProps {
  sourceShift: Shift;
  employees: EmployeeWithShifts[];
  onDuplicate: (shifts: Shift[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DuplicationTarget {
  type: 'date' | 'employee' | 'both';
  dates: string[];
  employeeIds: number[];
}

interface DuplicationPreview {
  totalShifts: number;
  shifts: Array<{
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  conflicts: ConflictInfo[];
}

export const ShiftDuplicator: React.FC<ShiftDuplicatorProps> = ({
  sourceShift,
  employees,
  onDuplicate,
  onCancel,
  isLoading = false
}) => {
  const [target, setTarget] = useState<DuplicationTarget>({
    type: 'date',
    dates: [],
    employeeIds: []
  });
  const [notes, setNotes] = useState(sourceShift.notes || '');
  const [preserveNotes, setPreserveNotes] = useState(true);
  const [preview, setPreview] = useState<DuplicationPreview | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Get source employee info
  const sourceEmployee = employees.find(emp => emp.id === sourceShift.company_employee_id);

  // Employee options for multi-select
  const employeeOptions = employees.map(emp => ({
    value: emp.id.toString(),
    label: `${emp.user.first_name} ${emp.user.last_name}`,
    disabled: emp.id === sourceShift.company_employee_id // Can't duplicate to same employee on same date
  }));

  const validateDuplication = useCallback(async () => {
    setIsValidating(true);
    try {
      // Build shifts to validate
      const shiftsToValidate = [];
      
      if (target.type === 'date') {
        // Same employee, different dates
        for (const date of target.dates) {
          if (date !== sourceShift.shift_date) { // Don't validate against same date
            shiftsToValidate.push({
              company_employee_id: sourceShift.company_employee_id,
              shift_date: date,
              start_time: typeof sourceShift.start_time === 'string' ? sourceShift.start_time : sourceShift.start_time.toTimeString().slice(0, 5),
              end_time: typeof sourceShift.end_time === 'string' ? sourceShift.end_time : sourceShift.end_time.toTimeString().slice(0, 5)
            });
          }
        }
      } else if (target.type === 'employee') {
        // Different employees, same date
        for (const employeeId of target.employeeIds) {
          shiftsToValidate.push({
            company_employee_id: employeeId,
            shift_date: sourceShift.shift_date,
            start_time: typeof sourceShift.start_time === 'string' ? sourceShift.start_time : sourceShift.start_time.toTimeString().slice(0, 5),
            end_time: typeof sourceShift.end_time === 'string' ? sourceShift.end_time : sourceShift.end_time.toTimeString().slice(0, 5)
          });
        }
      } else if (target.type === 'both') {
        // Different employees and dates
        for (const employeeId of target.employeeIds) {
          for (const date of target.dates) {
            shiftsToValidate.push({
              company_employee_id: employeeId,
              shift_date: date,
              start_time: typeof sourceShift.start_time === 'string' ? sourceShift.start_time : sourceShift.start_time.toTimeString().slice(0, 5),
              end_time: typeof sourceShift.end_time === 'string' ? sourceShift.end_time : sourceShift.end_time.toTimeString().slice(0, 5)
            });
          }
        }
      }

      if (shiftsToValidate.length === 0) {
        setPreview(null);
        setConflicts([]);
        return;
      }

      // Validate conflicts
      const conflictResponse = await shiftsApiService.validateConflicts({
        shifts: shiftsToValidate
      });

      setConflicts(conflictResponse.conflicts);

      // Generate preview
      const previewShifts = shiftsToValidate.map(shift => {
        const employee = employees.find(emp => emp.id === shift.company_employee_id);
        return {
          employeeName: employee ? `${employee.user.first_name} ${employee.user.last_name}` : 'Unknown',
          date: shift.shift_date,
          startTime: shift.start_time,
          endTime: shift.end_time
        };
      });

      setPreview({
        totalShifts: shiftsToValidate.length,
        shifts: previewShifts,
        conflicts: conflictResponse.conflicts
      });

      setShowPreview(true);
    } catch (error) {
      console.error('Error validating duplication:', error);
    } finally {
      setIsValidating(false);
    }
  }, [target, sourceShift, employees]);

  // Validate and generate preview when target changes
  useEffect(() => {
    if ((target.dates.length > 0 || target.employeeIds.length > 0) && 
        (target.type !== 'both' || (target.dates.length > 0 && target.employeeIds.length > 0))) {
      validateDuplication();
    } else {
      setPreview(null);
      setConflicts([]);
      setShowPreview(false);
    }
  }, [target, sourceShift, validateDuplication]);

  const handleDuplicate = async () => {
    if (!preview) return;

    try {
      const duplicationRequest: ShiftDuplicationRequest = {
        source_shift_ids: [sourceShift.id],
        preserve_employee: target.type === 'date',
        preserve_date: target.type === 'employee'
      };

      if (target.type === 'date' || target.type === 'both') {
        duplicationRequest.target_dates = target.dates;
      }

      if (target.type === 'employee' || target.type === 'both') {
        duplicationRequest.target_employee_ids = target.employeeIds;
      }

      const duplicatedShifts = await shiftsApiService.duplicateShifts(duplicationRequest);
      onDuplicate(duplicatedShifts);
    } catch (error) {
      console.error('Error duplicating shifts:', error);
    }
  };

  const handleTargetTypeChange = (type: 'date' | 'employee' | 'both') => {
    setTarget(prev => ({
      ...prev,
      type,
      // Reset selections when changing type
      dates: type === 'employee' ? [prev.dates[0] || sourceShift.shift_date] : prev.dates,
      employeeIds: type === 'date' ? [prev.employeeIds[0] || sourceShift.company_employee_id] : prev.employeeIds
    }));
    setShowPreview(false);
  };

  const handleDateChange = (dates: string[]) => {
    setTarget(prev => ({ ...prev, dates }));
  };

  const handleEmployeeChange = (employeeIds: string[]) => {
    setTarget(prev => ({ 
      ...prev, 
      employeeIds: employeeIds.map(id => parseInt(id)) 
    }));
  };

  const canDuplicate = preview && preview.totalShifts > 0;
  const hasConflicts = conflicts.length > 0;

  return (
    <div className="space-y-6">
      {/* Source Shift Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Employee</Label>
                <p className="font-medium">
                  {sourceEmployee ? `${sourceEmployee.user.first_name} ${sourceEmployee.user.last_name}` : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">{formatDate(sourceShift.shift_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time</Label>
                <p className="font-medium">
                  {formatTime(typeof sourceShift.start_time === 'string' ? sourceShift.start_time : sourceShift.start_time.toTimeString().slice(0, 5))} - {formatTime(typeof sourceShift.end_time === 'string' ? sourceShift.end_time : sourceShift.end_time.toTimeString().slice(0, 5))}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium">
                  {/* Calculate duration */}
                  {(() => {
                    const startTime = typeof sourceShift.start_time === 'string' ? sourceShift.start_time : sourceShift.start_time.toTimeString().slice(0, 5);
                    const endTime = typeof sourceShift.end_time === 'string' ? sourceShift.end_time : sourceShift.end_time.toTimeString().slice(0, 5);
                    const start = new Date(`2000-01-01T${startTime}`);
                    const end = new Date(`2000-01-01T${endTime}`);
                    const diff = end.getTime() - start.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </p>
              </div>
            </div>
            {sourceShift.notes && (
              <div className="mt-4">
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1">{sourceShift.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplication Target Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Duplication Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Type Selection */}
          <div className="space-y-2">
            <Label>What do you want to duplicate?</Label>
            <div className="flex gap-2">
              <Button
                variant={target.type === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTargetTypeChange('date')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                To Other Dates
              </Button>
              <Button
                variant={target.type === 'employee' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTargetTypeChange('employee')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                To Other Employees
              </Button>
              <Button
                variant={target.type === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTargetTypeChange('both')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Both
              </Button>
            </div>
          </div>

          {/* Date Selection */}
          {(target.type === 'date' || target.type === 'both') && (
            <div className="space-y-2">
              <Label>Select Target Dates</Label>
              <DatePicker
                mode="multiple"
                selected={target.dates.map(date => new Date(date))}
                onSelect={(dates: Date[] | undefined) => {
                  const dateStrings = dates?.map(date => 
                    date.toISOString().split('T')[0]
                  ) || [];
                  handleDateChange(dateStrings);
                }}
                disabled={(date) => {
                  const dateString = date.toISOString().split('T')[0];
                  return dateString === sourceShift.shift_date; // Can't duplicate to same date
                }}
                className="w-full"
              />
              {target.dates.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {target.dates.map(date => (
                    <Badge key={date} variant="secondary">
                      {formatDate(date)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Employee Selection */}
          {(target.type === 'employee' || target.type === 'both') && (
            <div className="space-y-2">
              <Label>Select Target Employees</Label>
              <MultiSelect
                options={employeeOptions}
                value={target.employeeIds.map(id => id.toString())}
                onValueChange={handleEmployeeChange}
                placeholder="Select employees..."
                className="w-full"
              />
              {target.employeeIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {target.employeeIds.map(employeeId => {
                    const employee = employees.find(emp => emp.id === employeeId);
                    return (
                      <Badge key={employeeId} variant="secondary">
                        {employee ? `${employee.user.first_name} ${employee.user.last_name}` : 'Unknown'}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preserve-notes"
                checked={preserveNotes}
                onCheckedChange={setPreserveNotes}
              />
              <Label htmlFor="preserve-notes">Preserve original notes</Label>
            </div>
            {!preserveNotes && (
              <div className="space-y-2">
                <Label htmlFor="notes">Custom Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes for duplicated shifts..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview and Conflicts */}
      {showPreview && preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Duplication Preview</span>
              <Badge variant="outline">
                {preview.totalShifts} shift{preview.totalShifts !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conflicts Warning */}
            {hasConflicts && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected. 
                  Review the conflicts below before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {/* Shifts to be created */}
            <div className="space-y-2">
              <Label>Shifts to be created:</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {preview.shifts.map((shift, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{shift.employeeName}</span>
                      <span className="text-muted-foreground">{formatDate(shift.date)}</span>
                      <span className="text-sm">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </span>
                    </div>
                    {conflicts.some(c => 
                      c.employee_name === shift.employeeName && c.date === shift.date
                    ) && (
                      <Badge variant="destructive" className="text-xs">
                        Conflict
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Conflict Details */}
            {hasConflicts && (
              <div className="space-y-2">
                <Label className="text-destructive">Conflicts:</Label>
                <div className="space-y-2">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="p-3 border border-destructive/20 rounded bg-destructive/5">
                      <div className="font-medium text-destructive">
                        {conflict.employee_name} on {formatDate(conflict.date)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Conflicts with existing shifts:
                      </div>
                      <div className="text-sm mt-1">
                        {conflict.conflicting_shifts.map((existingShift, idx) => (
                          <div key={idx} className="ml-2">
                            • {formatTime(existingShift.start_time)} - {formatTime(existingShift.end_time)}
                            {existingShift.notes && ` (${existingShift.notes})`}
                          </div>
                        ))}
                      </div>
                      {conflict.suggested_alternatives.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground">Suggested alternatives:</div>
                          <div className="text-sm">
                            {conflict.suggested_alternatives.map((alt, idx) => (
                              <div key={idx} className="ml-2 text-green-600">
                                • {formatTime(alt.start_time)} - {formatTime(alt.end_time)} ({alt.reason})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleDuplicate}
          disabled={!canDuplicate || isLoading || isValidating}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Duplicating...
            </>
          ) : isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Validating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Duplicate {preview?.totalShifts || 0} Shift{preview?.totalShifts !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
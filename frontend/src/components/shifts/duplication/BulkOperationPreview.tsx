import React, { useState } from 'react';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BulkOperationPreview as BulkOperationPreviewData, ConflictInfo, ConflictResolution } from '@/types/shifts/templates';
import { formatTime, formatDate } from '@/lib/utils';

interface BulkOperationPreviewProps {
  preview: BulkOperationPreviewData;
  onConfirm: (resolutionStrategy?: ConflictResolution) => void;
  onCancel: () => void;
  isLoading?: boolean;
  showResolutionOptions?: boolean;
}

interface ConflictResolutionState {
  strategy: ConflictResolution;
  skipConflicted: boolean;
  requireNotes: boolean;
}

export const BulkOperationPreview: React.FC<BulkOperationPreviewProps> = ({
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
  showResolutionOptions = true
}) => {
  const [expandedSections, setExpandedSections] = useState({
    shifts: true,
    conflicts: true,
    warnings: false
  });
  
  const [resolutionState, setResolutionState] = useState<ConflictResolutionState>({
    strategy: ConflictResolution.SKIP,
    skipConflicted: true,
    requireNotes: false
  });

  const hasConflicts = preview.conflicts && preview.conflicts.length > 0;
  const hasWarnings = preview.warnings && preview.warnings.length > 0;
  const conflictedShifts = hasConflicts ? 
    preview.shifts_to_create.filter(shift => 
      preview.conflicts.some(conflict => 
        conflict.employee_name === shift.employee_name && 
        conflict.date === shift.date
      )
    ) : [];
  
  const nonConflictedShifts = preview.shifts_to_create.filter(shift => 
    !conflictedShifts.some(cs => 
      cs.employee_name === shift.employee_name && 
      cs.date === shift.date
    )
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleConfirm = () => {
    if (hasConflicts && showResolutionOptions) {
      onConfirm(resolutionState.strategy);
    } else {
      onConfirm();
    }
  };

  const getShiftsByEmployee = () => {
    const grouped = preview.shifts_to_create.reduce((acc, shift) => {
      if (!acc[shift.employee_name]) {
        acc[shift.employee_name] = [];
      }
      acc[shift.employee_name].push(shift);
      return acc;
    }, {} as Record<string, typeof preview.shifts_to_create>);

    // Sort shifts by date within each employee group
    Object.keys(grouped).forEach(employeeName => {
      grouped[employeeName].sort((a, b) => a.date.localeCompare(b.date));
    });

    return grouped;
  };

  const getShiftsByDate = () => {
    const grouped = preview.shifts_to_create.reduce((acc, shift) => {
      if (!acc[shift.date]) {
        acc[shift.date] = [];
      }
      acc[shift.date].push(shift);
      return acc;
    }, {} as Record<string, typeof preview.shifts_to_create>);

    // Sort shifts by employee name within each date group
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.employee_name.localeCompare(b.employee_name));
    });

    return grouped;
  };

  const shiftsByEmployee = getShiftsByEmployee();
  const shiftsByDate = getShiftsByDate();

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Bulk Operation Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{preview.total_shifts}</div>
              <div className="text-sm text-muted-foreground">Total Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{nonConflictedShifts.length}</div>
              <div className="text-sm text-muted-foreground">No Conflicts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{conflictedShifts.length}</div>
              <div className="text-sm text-muted-foreground">Conflicts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{preview.warnings?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex gap-2 mt-4">
            {!hasConflicts && !hasWarnings && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready to Create
              </Badge>
            )}
            {hasConflicts && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Conflicts Detected
              </Badge>
            )}
            {hasWarnings && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Info className="h-3 w-3 mr-1" />
                Warnings
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Section */}
      {hasConflicts && (
        <Card>
          <Collapsible 
            open={expandedSections.conflicts} 
            onOpenChange={() => toggleSection('conflicts')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('conflicts')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Conflicts ({preview.conflicts.length})
                  </div>
                  {expandedSections.conflicts ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent open={expandedSections.conflicts}>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {preview.conflicts.map((conflict, index) => (
                      <div key={index} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-destructive">
                            {conflict.employee_name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(conflict.date)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          Conflicts with existing shifts:
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          {conflict.conflicting_shifts.map((existingShift, idx) => (
                            <div key={idx} className="text-sm bg-background/50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(existingShift.start_time)} - {formatTime(existingShift.end_time)}
                                </span>
                              </div>
                              {existingShift.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {existingShift.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {conflict.suggested_alternatives.length > 0 && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              Suggested alternatives:
                            </div>
                            <div className="space-y-1">
                              {conflict.suggested_alternatives.map((alt, idx) => (
                                <div key={idx} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatTime(alt.start_time)} - {formatTime(alt.end_time)}
                                    </span>
                                    <span className="text-xs">({alt.reason})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Conflict Resolution Options */}
                {showResolutionOptions && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-3">Conflict Resolution Strategy:</div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="resolution"
                          value={ConflictResolution.SKIP}
                          checked={resolutionState.strategy === ConflictResolution.SKIP}
                          onChange={(e) => setResolutionState(prev => ({
                            ...prev,
                            strategy: e.target.value as ConflictResolution
                          }))}
                          className="text-primary"
                        />
                        <span className="text-sm">Skip conflicted shifts</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="resolution"
                          value={ConflictResolution.OVERWRITE}
                          checked={resolutionState.strategy === ConflictResolution.OVERWRITE}
                          onChange={(e) => setResolutionState(prev => ({
                            ...prev,
                            strategy: e.target.value as ConflictResolution
                          }))}
                          className="text-primary"
                        />
                        <span className="text-sm">Overwrite existing shifts</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="resolution"
                          value={ConflictResolution.MANUAL}
                          checked={resolutionState.strategy === ConflictResolution.MANUAL}
                          onChange={(e) => setResolutionState(prev => ({
                            ...prev,
                            strategy: e.target.value as ConflictResolution
                          }))}
                          className="text-primary"
                        />
                        <span className="text-sm">Require manual resolution</span>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <Card>
          <Collapsible 
            open={expandedSections.warnings} 
            onOpenChange={() => toggleSection('warnings')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('warnings')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-yellow-600" />
                    Warnings ({preview.warnings.length})
                  </div>
                  {expandedSections.warnings ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent open={expandedSections.warnings}>
              <CardContent>
                <div className="space-y-2">
                  {preview.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Shifts to Create */}
      <Card>
        <Collapsible 
          open={expandedSections.shifts} 
          onOpenChange={() => toggleSection('shifts')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSection('shifts')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Shifts to Create ({preview.total_shifts})
                </div>
                {expandedSections.shifts ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent open={expandedSections.shifts}>
            <CardContent>
              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    By Employee
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    By Date
                  </Button>
                </div>

                {/* Shifts List - By Employee */}
                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {Object.entries(shiftsByEmployee).map(([employeeName, shifts]) => (
                      <div key={employeeName} className="border rounded-lg p-3">
                        <div className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {employeeName}
                          <Badge variant="outline" className="text-xs">
                            {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="grid gap-2">
                          {shifts.map((shift, index) => {
                            const hasConflict = conflictedShifts.some(cs => 
                              cs.employee_name === shift.employee_name && 
                              cs.date === shift.date
                            );
                            
                            return (
                              <div 
                                key={index} 
                                className={`flex items-center justify-between p-2 rounded text-sm ${
                                  hasConflict ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(shift.date)}</span>
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasConflict ? (
                                    <Badge variant="destructive" className="text-xs">
                                      <X className="h-3 w-3 mr-1" />
                                      Conflict
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      <Check className="h-3 w-3 mr-1" />
                                      OK
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`flex items-center gap-2 ${
            hasConflicts && resolutionState.strategy === ConflictResolution.MANUAL 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : ''
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {hasConflicts && resolutionState.strategy === ConflictResolution.SKIP
                ? `Create ${nonConflictedShifts.length} Shifts (Skip Conflicts)`
                : hasConflicts && resolutionState.strategy === ConflictResolution.OVERWRITE
                ? `Create ${preview.total_shifts} Shifts (Overwrite Conflicts)`
                : `Create ${preview.total_shifts} Shifts`
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
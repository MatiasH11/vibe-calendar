# Shift Duplication and Bulk Operations Components

This directory contains components for duplicating shifts and performing bulk shift operations.

## Components

### ShiftDuplicator

Allows users to duplicate a single shift to other dates, employees, or both.

**Props:**
- `sourceShift`: The shift to duplicate
- `employees`: List of available employees
- `onDuplicate`: Callback when duplication is confirmed
- `onCancel`: Callback when operation is cancelled
- `isLoading`: Loading state

**Features:**
- Duplicate to other dates (same employee)
- Duplicate to other employees (same date)
- Duplicate to both different dates and employees
- Real-time conflict validation
- Preview of shifts to be created
- Conflict resolution options

**Usage:**
```tsx
import { ShiftDuplicator } from '@/components/shifts/duplication';

<ShiftDuplicator
  sourceShift={selectedShift}
  employees={employees}
  onDuplicate={(shifts) => {
    // Handle duplicated shifts
    console.log('Created shifts:', shifts);
  }}
  onCancel={() => setShowDuplicator(false)}
  isLoading={isCreating}
/>
```

### BulkShiftForm

Allows users to create multiple shifts at once for multiple employees and dates.

**Props:**
- `employees`: List of available employees
- `onSubmit`: Callback when form is submitted
- `onPreview`: Callback when preview is generated
- `onCancel`: Callback when operation is cancelled
- `isLoading`: Loading state

**Features:**
- Multi-employee selection
- Multi-date selection with quick options (Today, Tomorrow, Next 7 Days)
- Template integration for time selection
- Real-time preview generation
- Conflict detection and preview
- Duration calculation and display

**Usage:**
```tsx
import { BulkShiftForm } from '@/components/shifts/duplication';

<BulkShiftForm
  employees={employees}
  onSubmit={async (request) => {
    // Handle bulk shift creation
    const shifts = await createBulkShifts(request);
    console.log('Created shifts:', shifts);
  }}
  onPreview={(preview) => {
    // Handle preview data
    setPreviewData(preview);
  }}
  onCancel={() => setShowBulkForm(false)}
  isLoading={isCreating}
/>
```

### BulkOperationPreview

Displays a preview of bulk operations with conflict information and resolution options.

**Props:**
- `preview`: Preview data from bulk operation
- `onConfirm`: Callback when operation is confirmed
- `onCancel`: Callback when operation is cancelled
- `isLoading`: Loading state
- `showResolutionOptions`: Whether to show conflict resolution options

**Features:**
- Collapsible sections for conflicts, warnings, and shifts
- Conflict resolution strategy selection
- Detailed conflict information with suggestions
- Summary statistics
- Grouped shift display (by employee or date)

**Usage:**
```tsx
import { BulkOperationPreview } from '@/components/shifts/duplication';

<BulkOperationPreview
  preview={previewData}
  onConfirm={(resolutionStrategy) => {
    // Handle confirmation with resolution strategy
    await createShifts(resolutionStrategy);
  }}
  onCancel={() => setShowPreview(false)}
  isLoading={isCreating}
  showResolutionOptions={true}
/>
```

## Integration Example

Here's how to integrate all components in a modal workflow:

```tsx
import { useState } from 'react';
import { 
  ShiftDuplicator, 
  BulkShiftForm, 
  BulkOperationPreview 
} from '@/components/shifts/duplication';

function ShiftOperationsModal() {
  const [mode, setMode] = useState<'duplicate' | 'bulk' | 'preview'>('duplicate');
  const [previewData, setPreviewData] = useState(null);
  
  return (
    <Dialog>
      <DialogContent>
        {mode === 'duplicate' && (
          <ShiftDuplicator
            sourceShift={selectedShift}
            employees={employees}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        
        {mode === 'bulk' && (
          <BulkShiftForm
            employees={employees}
            onSubmit={handleBulkSubmit}
            onPreview={(preview) => {
              setPreviewData(preview);
              setMode('preview');
            }}
            onCancel={handleCancel}
          />
        )}
        
        {mode === 'preview' && previewData && (
          <BulkOperationPreview
            preview={previewData}
            onConfirm={handleConfirm}
            onCancel={() => setMode('bulk')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## Dependencies

These components require the following UI components:
- Button, Card, Label, Input, Textarea, Badge, Alert
- DatePicker, MultiSelect, Checkbox
- ScrollArea, Collapsible

And the following services:
- `shiftsApiService` for API calls
- `useShiftTemplates` hook for template functionality

## API Integration

The components integrate with the following API endpoints:
- `POST /api/v1/shifts/duplicate` - Duplicate shifts
- `POST /api/v1/shifts/bulk-create` - Create bulk shifts
- `POST /api/v1/shifts/bulk-preview` - Preview bulk operations
- `POST /api/v1/shifts/validate-conflicts` - Validate conflicts
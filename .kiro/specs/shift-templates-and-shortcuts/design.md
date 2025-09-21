# Design Document

## Overview

Este diseño implementa un sistema completo de mejoras para la experiencia de usuario en la gestión de turnos, centrado en eficiencia y usabilidad. La solución incluye plantillas de turnos reutilizables, atajos de teclado, duplicación inteligente, autocompletado basado en patrones, creación masiva y validaciones en tiempo real.

El diseño se basa en la arquitectura existente (React + TypeScript frontend, Node.js + Prisma backend) y extiende las funcionalidades actuales sin romper la compatibilidad.

## Architecture

### Database Schema Extensions

Se requieren nuevas tablas para soportar las funcionalidades:

```sql
-- Tabla para plantillas de turnos
CREATE TABLE shift_template (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  
  UNIQUE(company_id, name)
);

-- Tabla para estadísticas de patrones de empleados (para autocompletado)
CREATE TABLE employee_shift_pattern (
  id SERIAL PRIMARY KEY,
  company_employee_id INTEGER NOT NULL REFERENCES company_employee(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  frequency_count INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_employee_id, start_time, end_time)
);

-- Índices para optimización
CREATE INDEX idx_shift_template_company ON shift_template(company_id, deleted_at);
CREATE INDEX idx_employee_pattern_employee ON employee_shift_pattern(company_employee_id);
CREATE INDEX idx_employee_pattern_frequency ON employee_shift_pattern(frequency_count DESC);
```

### API Extensions

Nuevos endpoints para soportar las funcionalidades:

```typescript
// Plantillas de turnos
POST   /api/shift-templates          // Crear plantilla
GET    /api/shift-templates          // Listar plantillas de la empresa
PUT    /api/shift-templates/:id      // Actualizar plantilla
DELETE /api/shift-templates/:id      // Eliminar plantilla

// Duplicación de turnos
POST   /api/shifts/duplicate         // Duplicar turno(s)
POST   /api/shifts/bulk-create       // Creación masiva

// Patrones y sugerencias
GET    /api/shifts/patterns/:employeeId  // Obtener patrones de empleado
GET    /api/shifts/suggestions           // Obtener sugerencias inteligentes

// Validaciones
POST   /api/shifts/validate-conflicts  // Validar conflictos antes de crear
```

## Components and Interfaces

### Frontend Component Architecture

```
src/components/shifts/
├── templates/
│   ├── ShiftTemplateManager.tsx     // Gestión de plantillas
│   ├── ShiftTemplateSelector.tsx    // Selector en formulario
│   ├── ShiftTemplateForm.tsx        // Crear/editar plantilla
│   └── ShiftTemplateList.tsx        // Lista de plantillas
├── forms/
│   ├── EnhancedShiftForm.tsx        // Formulario mejorado
│   ├── BulkShiftForm.tsx           // Formulario creación masiva
│   ├── ShiftSuggestions.tsx        // Componente de sugerencias
│   └── ConflictValidator.tsx       // Validador en tiempo real
├── shortcuts/
│   ├── KeyboardShortcuts.tsx       // Manejador de atajos
│   ├── ShortcutHelp.tsx           // Ayuda de atajos
│   └── useKeyboardShortcuts.ts    // Hook personalizado
└── duplication/
    ├── ShiftDuplicator.tsx         // Componente duplicación
    ├── BulkDuplicator.tsx         // Duplicación masiva
    └── DuplicationPreview.tsx     // Vista previa
```

### Key Interfaces

```typescript
// Plantillas
interface ShiftTemplate {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  usage_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface CreateShiftTemplateRequest {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
}

// Patrones de empleados
interface EmployeeShiftPattern {
  id: number;
  company_employee_id: number;
  start_time: string;
  end_time: string;
  frequency_count: number;
  last_used: string;
}

// Duplicación
interface ShiftDuplicationRequest {
  source_shift_ids: number[];
  target_dates?: string[];
  target_employee_ids?: number[];
  preserve_employee?: boolean;
  preserve_date?: boolean;
}

// Creación masiva
interface BulkShiftCreationRequest {
  employee_ids: number[];
  dates: string[];
  start_time: string;
  end_time: string;
  notes?: string;
  template_id?: number;
}

// Validación de conflictos
interface ConflictValidationRequest {
  shifts: Array<{
    company_employee_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
  }>;
}

interface ConflictValidationResponse {
  conflicts: Array<{
    employee_id: number;
    date: string;
    conflicting_shifts: Shift[];
    suggested_alternatives: Array<{
      start_time: string;
      end_time: string;
    }>;
  }>;
}
```

## Data Models

### Enhanced Shift Form State

```typescript
interface EnhancedShiftFormData extends ShiftFormData {
  // Campos existentes
  company_employee_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  
  // Nuevos campos
  template_id?: number;
  use_template: boolean;
  bulk_mode: boolean;
  selected_employees?: number[];
  selected_dates?: string[];
  duplicate_source?: number;
}

interface ShiftFormEnhancements {
  templates: ShiftTemplate[];
  patterns: EmployeeShiftPattern[];
  suggestions: TimeSuggestion[];
  conflicts: ConflictInfo[];
  shortcuts_enabled: boolean;
}

interface TimeSuggestion {
  start_time: string;
  end_time: string;
  frequency: number;
  source: 'template' | 'pattern' | 'recent';
  label: string;
}
```

### Template Management State

```typescript
interface TemplateManagerState {
  templates: ShiftTemplate[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  selectedTemplate: ShiftTemplate | null;
  searchQuery: string;
  sortBy: 'name' | 'usage_count' | 'created_at';
  sortOrder: 'asc' | 'desc';
}
```

## Error Handling

### Conflict Resolution Strategy

```typescript
enum ConflictResolution {
  SKIP = 'skip',           // Omitir turnos con conflictos
  OVERWRITE = 'overwrite', // Sobrescribir turnos existentes
  ADJUST = 'adjust',       // Ajustar horarios automáticamente
  MANUAL = 'manual'        // Resolución manual por el usuario
}

interface ConflictResolutionOptions {
  strategy: ConflictResolution;
  require_notes: boolean;
  auto_adjust_minutes: number;
  notify_affected_employees: boolean;
}
```

### Error Types

```typescript
enum ShiftTemplateError {
  DUPLICATE_NAME = 'DUPLICATE_TEMPLATE_NAME',
  INVALID_TIME_RANGE = 'INVALID_TEMPLATE_TIME_RANGE',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_IN_USE = 'TEMPLATE_IN_USE'
}

enum BulkOperationError {
  TOO_MANY_CONFLICTS = 'TOO_MANY_CONFLICTS',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  EMPLOYEE_NOT_AVAILABLE = 'EMPLOYEE_NOT_AVAILABLE',
  BULK_LIMIT_EXCEEDED = 'BULK_LIMIT_EXCEEDED'
}
```

## Testing Strategy

### Unit Testing

```typescript
// Componentes clave a testear
describe('ShiftTemplateManager', () => {
  test('should create template with valid data');
  test('should prevent duplicate template names');
  test('should update usage count when template is used');
  test('should handle template deletion with confirmation');
});

describe('EnhancedShiftForm', () => {
  test('should apply template when selected');
  test('should show suggestions based on employee patterns');
  test('should validate conflicts in real-time');
  test('should handle keyboard shortcuts correctly');
});

describe('BulkShiftCreation', () => {
  test('should create multiple shifts successfully');
  test('should handle conflicts appropriately');
  test('should show preview before creation');
  test('should validate date ranges');
});
```

### Integration Testing

```typescript
describe('Shift Templates API', () => {
  test('should create and retrieve templates');
  test('should update template usage statistics');
  test('should enforce company isolation');
  test('should handle concurrent template usage');
});

describe('Conflict Detection', () => {
  test('should detect overlapping shifts');
  test('should suggest alternative times');
  test('should handle timezone considerations');
  test('should validate bulk operations');
});
```

### E2E Testing

```typescript
describe('Enhanced Shift Management Flow', () => {
  test('user can create and use shift templates');
  test('user can duplicate shifts with keyboard shortcuts');
  test('user can create bulk shifts with conflict resolution');
  test('user can navigate with keyboard shortcuts');
  test('system prevents invalid operations gracefully');
});
```

## Performance Considerations

### Caching Strategy

```typescript
// Cache de plantillas por empresa
const templateCache = new Map<number, ShiftTemplate[]>();

// Cache de patrones de empleados
const patternCache = new Map<number, EmployeeShiftPattern[]>();

// Invalidación de cache
const invalidateTemplateCache = (companyId: number) => {
  templateCache.delete(companyId);
};
```

### Database Optimization

```sql
-- Índices para consultas frecuentes
CREATE INDEX idx_shift_template_usage ON shift_template(company_id, usage_count DESC);
CREATE INDEX idx_shift_date_employee ON shift(company_employee_id, shift_date);
CREATE INDEX idx_pattern_frequency ON employee_shift_pattern(company_employee_id, frequency_count DESC);

-- Particionamiento por fecha para shifts (opcional para grandes volúmenes)
CREATE TABLE shift_2024 PARTITION OF shift FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Frontend Optimization

```typescript
// Debounce para validación en tiempo real
const useConflictValidation = (formData: ShiftFormData) => {
  const debouncedValidation = useMemo(
    () => debounce(validateConflicts, 300),
    []
  );
  
  useEffect(() => {
    if (formData.company_employee_id && formData.shift_date) {
      debouncedValidation(formData);
    }
  }, [formData, debouncedValidation]);
};

// Memoización de sugerencias
const ShiftSuggestions = memo(({ employeeId, patterns }) => {
  const suggestions = useMemo(() => 
    generateSuggestions(employeeId, patterns),
    [employeeId, patterns]
  );
  
  return <SuggestionList suggestions={suggestions} />;
});
```

## Security Considerations

### Authorization

```typescript
// Verificar pertenencia de plantillas a la empresa
const validateTemplateAccess = async (templateId: number, companyId: number) => {
  const template = await prisma.shift_template.findFirst({
    where: { id: templateId, company_id: companyId, deleted_at: null }
  });
  
  if (!template) {
    throw new Error('UNAUTHORIZED_TEMPLATE_ACCESS');
  }
  
  return template;
};

// Limitar operaciones masivas
const BULK_OPERATION_LIMITS = {
  MAX_SHIFTS_PER_REQUEST: 100,
  MAX_EMPLOYEES_PER_REQUEST: 50,
  MAX_DATES_PER_REQUEST: 31
};
```

### Input Validation

```typescript
// Validación de plantillas
const templateValidation = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/)
}).refine(data => data.start_time < data.end_time, {
  message: "End time must be after start time"
});

// Validación de operaciones masivas
const bulkOperationValidation = z.object({
  employee_ids: z.array(z.number()).max(BULK_OPERATION_LIMITS.MAX_EMPLOYEES_PER_REQUEST),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(BULK_OPERATION_LIMITS.MAX_DATES_PER_REQUEST),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/)
});
```

## Migration Strategy

### Database Migration

```sql
-- Migración 001: Crear tablas de plantillas
CREATE TABLE shift_template (
  -- definición completa
);

-- Migración 002: Crear tablas de patrones
CREATE TABLE employee_shift_pattern (
  -- definición completa
);

-- Migración 003: Poblar patrones existentes
INSERT INTO employee_shift_pattern (company_employee_id, start_time, end_time, frequency_count)
SELECT 
  company_employee_id,
  start_time,
  end_time,
  COUNT(*) as frequency_count
FROM shift 
WHERE deleted_at IS NULL
GROUP BY company_employee_id, start_time, end_time
HAVING COUNT(*) >= 2;
```

### Feature Rollout

1. **Fase 1**: Implementar plantillas básicas y gestión
2. **Fase 2**: Agregar atajos de teclado y duplicación
3. **Fase 3**: Implementar autocompletado y sugerencias
4. **Fase 4**: Agregar creación masiva y validaciones avanzadas
5. **Fase 5**: Optimizaciones y refinamientos basados en feedback

### Backward Compatibility

```typescript
// Mantener compatibilidad con formulario existente
interface ShiftFormProps {
  // Props existentes
  initialData?: Partial<ShiftFormData>;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  
  // Nuevas props opcionales
  enableTemplates?: boolean;
  enableShortcuts?: boolean;
  enableSuggestions?: boolean;
  bulkMode?: boolean;
}

// Wrapper para transición gradual
export const ShiftFormWrapper = (props: ShiftFormProps) => {
  const enhancementsEnabled = useFeatureFlag('shift-enhancements');
  
  return enhancementsEnabled ? 
    <EnhancedShiftForm {...props} /> : 
    <ShiftForm {...props} />;
};
```
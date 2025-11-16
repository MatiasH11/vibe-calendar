# OpenAPI Type Generation - Usage Guide

This document explains how to use auto-generated types from the backend OpenAPI specification.

## Overview

The project uses `openapi-typescript` to automatically generate TypeScript types from the backend's Swagger/OpenAPI documentation. This ensures type safety between frontend and backend.

## Setup

### Installation

The package is already configured in `package.json`:

```bash
cd frontend
npm install
```

This installs `openapi-typescript` as a dev dependency.

### Generate Types

**Prerequisites:** Backend must be running on port 3001

```bash
# Manual generation
npm run generate:types

# Production generation (custom URL)
BACKEND_URL=https://api.example.com npm run generate:types:prod
```

### Automatic Generation

Types are automatically generated before each build:

```bash
npm run build  # Runs prebuild script which generates types
```

## Using Generated Types

### Import Types

```typescript
import type { paths, components } from '@/generated/api.types';
```

### Path Types (Endpoints)

Get request/response types for specific endpoints:

```typescript
// Get response type
type EmployeeListResponse =
  paths['/api/v1/employee']['get']['responses']['200']['content']['application/json'];

// Get request body type
type CreateEmployeeRequest =
  paths['/api/v1/employee']['post']['requestBody']['content']['application/json'];

// Get path parameters
type EmployeeIdParam =
  paths['/api/v1/employee/{id}']['get']['parameters']['path']['id'];

// Get query parameters
type EmployeeFilters =
  paths['/api/v1/employee']['get']['parameters']['query'];
```

### Component Types (Schemas)

Get schema types directly:

```typescript
// Schema types
type Employee = components['schemas']['Employee'];
type Shift = components['schemas']['Shift'];
type DayTemplate = components['schemas']['DayTemplate'];
```

## Integration with API Modules

### Option 1: Use Generated Types Directly

```typescript
// frontend/src/api/employeeApi.ts
import type { paths, components } from '@/generated/api.types';

type Employee = components['schemas']['Employee'];
type CreateEmployeeInput = paths['/api/v1/employee']['post']['requestBody']['content']['application/json'];

export const employeeApi = {
  async create(data: CreateEmployeeInput): Promise<Employee> {
    // implementation
  }
};
```

### Option 2: Extend Generated Types

```typescript
// Add frontend-specific properties
import type { components } from '@/generated/api.types';

type BaseEmployee = components['schemas']['Employee'];

export interface Employee extends BaseEmployee {
  // Frontend-only properties
  isSelected?: boolean;
  displayName?: string;
}
```

### Option 3: Type Helpers

Create utility types for common patterns:

```typescript
// frontend/src/types/api-helpers.ts
import type { paths } from '@/generated/api.types';

// Extract response type helper
export type ApiResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path],
  Status extends keyof paths[Path][Method]['responses'] = 200
> = paths[Path][Method]['responses'][Status]['content']['application/json'];

// Usage
type EmployeeList = ApiResponse<'/api/v1/employee', 'get'>;
type Employee = ApiResponse<'/api/v1/employee/{id}', 'get'>;
```

## Examples

### Complete API Module Example

```typescript
// frontend/src/api/employeeApi.ts
import { apiClient } from '@/lib/api';
import type { paths, components } from '@/generated/api.types';

// Extract types
type Employee = components['schemas']['Employee'];
type CreateEmployeeInput = paths['/api/v1/employee']['post']['requestBody']['content']['application/json'];
type UpdateEmployeeInput = paths['/api/v1/employee/{id}']['put']['requestBody']['content']['application/json'];
type EmployeeFilters = paths['/api/v1/employee']['get']['parameters']['query'];

export const employeeApi = {
  async getAll(filters?: EmployeeFilters) {
    return apiClient.get<Employee[]>('/api/v1/employee', { params: filters });
  },

  async getById(id: number) {
    return apiClient.get<Employee>(`/api/v1/employee/${id}`);
  },

  async create(data: CreateEmployeeInput) {
    return apiClient.post<Employee>('/api/v1/employee', data);
  },

  async update(id: number, data: UpdateEmployeeInput) {
    return apiClient.put<Employee>(`/api/v1/employee/${id}`, data);
  }
};
```

### Hook Example

```typescript
// frontend/src/hooks/useEmployee.ts
import { useApiResource } from './useApiResource';
import { employeeApi } from '@/api/employeeApi';
import type { components } from '@/generated/api.types';

type Employee = components['schemas']['Employee'];

export function useEmployee() {
  return useApiResource<Employee, CreateEmployeeInput, UpdateEmployeeInput>({
    getAll: employeeApi.getAll,
    getById: employeeApi.getById,
    create: employeeApi.create,
    update: employeeApi.update,
    delete: employeeApi.delete,
  });
}
```

## Best Practices

### 1. Always Regenerate After Backend Changes

```bash
# After pulling backend changes
npm run generate:types
```

### 2. Don't Commit Generated Files

Generated types are in `.gitignore` and should be regenerated locally.

### 3. Use Type Aliases for Clarity

```typescript
// Good - clear, reusable
type Employee = components['schemas']['Employee'];
type CreateEmployeeInput = paths['/api/v1/employee']['post']['requestBody']['content']['application/json'];

// Avoid - verbose, hard to maintain
function createEmployee(data: paths['/api/v1/employee']['post']['requestBody']['content']['application/json']) {
  // ...
}
```

### 4. Validate Backend Swagger Coverage

Ensure all backend endpoints have proper Swagger decorators:

```typescript
// Backend controller example
/**
 * @openapi
 * /employee:
 *   post:
 *     tags: [Employee]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeDto'
 */
```

### 5. Handle Optional vs Required Fields

Generated types match backend exactly:

```typescript
type Employee = components['schemas']['Employee'];

// Backend defines field as optional
const employee: Employee = {
  first_name: 'John',
  last_name: 'Doe',
  // email is optional, no error
};

// If email is required in frontend, extend the type
interface RequiredEmployee extends Employee {
  email: string; // Make it required
}
```

## Troubleshooting

### Types Don't Match Backend

**Problem:** Frontend types are outdated

**Solution:**
```bash
npm run generate:types
```

### Generation Fails

**Problem:** Cannot fetch Swagger spec

**Solutions:**
1. Ensure backend is running
2. Check backend URL is correct
3. Verify Swagger endpoint: `http://localhost:3001/api/docs/swagger.json`
4. Check backend logs for Swagger errors

### Type Errors After Backend Update

**Problem:** Breaking changes in backend API

**Solution:**
1. Regenerate types: `npm run generate:types`
2. Fix type errors in frontend
3. Consider backward compatibility in backend

### Missing Endpoints in Generated Types

**Problem:** New backend endpoints don't appear in types

**Solution:**
1. Verify backend endpoints have Swagger decorators
2. Restart backend server
3. Regenerate types

## Advanced Usage

### Discriminated Unions

```typescript
type ShiftStatus = components['schemas']['Shift']['status'];
// 'scheduled' | 'completed' | 'cancelled'

function getStatusColor(status: ShiftStatus) {
  switch (status) {
    case 'scheduled': return 'blue';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    // TypeScript ensures all cases are covered
  }
}
```

### Nested Types

```typescript
type Shift = components['schemas']['Shift'];
type Employee = Shift['employee']; // Extract nested type
```

### Array Types

```typescript
type EmployeeList = components['schemas']['Employee'][];

// Or from paths
type EmployeeListResponse = paths['/api/v1/employee']['get']['responses']['200']['content']['application/json'];
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - name: Start backend
        run: cd backend && npm start &

      - name: Wait for backend
        run: npx wait-on http://localhost:3001/api/docs

      - name: Generate types
        run: cd frontend && npm run generate:types

      - name: Build frontend
        run: cd frontend && npm run build
```

### Docker Build

```dockerfile
# Dockerfile
FROM node:18 AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

FROM node:18 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
COPY --from=backend /app/backend /app/backend
RUN cd /app/backend && npm start &
RUN sleep 10
RUN npm run generate:types
RUN npm run build
```

## Migration Strategy

If you have existing hand-written types, migrate gradually:

1. Generate OpenAPI types
2. Compare with existing types
3. Update API modules to use generated types
4. Remove old type definitions
5. Update components to use new types

## Resources

- [openapi-typescript Documentation](https://github.com/drwpow/openapi-typescript)
- [OpenAPI Specification](https://swagger.io/specification/)
- Backend Swagger UI: `http://localhost:3001/api/docs`
- Generated Types Location: `frontend/src/generated/api.types.ts`

---

**Last Updated:** 2025-11-16
**Status:** Active
**Owner:** Frontend Team

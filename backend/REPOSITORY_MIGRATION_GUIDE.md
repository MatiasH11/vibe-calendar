# Repository Pattern Migration Guide

**Reference**: PLAN.md Section 6
**Status**: Infrastructure complete, gradual service migration recommended
**Created**: 2025-10-18

---

## Overview

The repository pattern has been implemented to improve code organization, testability, and maintainability. This guide explains how to migrate existing services to use repositories.

## What We Have Now

### ✅ Completed Infrastructure

1. **Base Repository** (`src/repositories/base.repository.ts`)
   - Generic CRUD operations
   - Automatic soft-delete filtering
   - Pagination support
   - Transaction support

2. **Specific Repositories**:
   - `ShiftRepository` - Shift data access with advanced filters
   - `EmployeeRepository` - Employee/company_employee queries
   - `RoleRepository` - Role management queries

3. **Example Implementation**: `role.service.v2.ts` showing how to refactor a service

4. **Comprehensive Tests**: 27 test cases covering all repositories

---

## Architecture Pattern

### Before (Current)
```
Controller → Service → Prisma Client
```
- Services mix business logic and data access
- Hard to test (tight coupling to Prisma)
- Duplicate query logic across services

### After (Repository Pattern)
```
Controller → Service → Repository → Prisma Client
```
- **Service**: Pure business logic
- **Repository**: Data access only
- Easy to mock for testing
- Reusable query logic

---

## Migration Steps

### Step 1: Identify Service to Migrate

Choose a service that would benefit most:
- ✅ **High test coverage needed**: e.g., `shift.service.ts` (complex business rules)
- ✅ **Duplicate queries**: e.g., employee lookups across services
- ✅ **Complex data access**: e.g., multi-table joins, aggregations

**Start small**: `role.service.ts` is a good first candidate (see `role.service.v2.ts`)

### Step 2: Import Repository

```typescript
// Old way
import { prisma } from '../config/prisma_client';

// New way
import { roleRepository } from '../repositories/role.repository';
```

### Step 3: Refactor Data Access

#### Before:
```typescript
async find_by_company(company_id: number) {
  return prisma.role.findMany({
    where: { company_id },
    orderBy: { name: 'asc' },
  });
}
```

#### After:
```typescript
async find_by_company(company_id: number) {
  return roleRepository.findByCompany(company_id);
}
```

### Step 4: Use Repository Methods

Replace Prisma queries with repository calls:

```typescript
// Complex example: Check for duplicates
async create(data: CreateRoleBody, company_id: number) {
  // Business logic in service
  const isDuplicate = await roleRepository.isNameTaken(company_id, data.name);
  if (isDuplicate) {
    throw new Error('DUPLICATE_ROLE');
  }

  // Data access in repository
  return roleRepository.createRole({
    company: { connect: { id: company_id } },
    name: data.name,
    description: data.description,
    color: data.color,
  });
}
```

### Step 5: Write Tests

With repositories, service tests become easier:

```typescript
// Mock the repository
jest.mock('../repositories/role.repository');

test('should create role if name is unique', async () => {
  roleRepository.isNameTaken.mockResolvedValue(false);
  roleRepository.createRole.mockResolvedValue(mockRole);

  const result = await roleService.create(data, companyId);

  expect(result).toEqual(mockRole);
});
```

---

## Common Patterns

### Pattern 1: Simple CRUD

```typescript
// Service delegates directly to repository
async findById(id: number) {
  return employeeRepository.findById(id);
}
```

### Pattern 2: Business Logic + Data Access

```typescript
// Service handles validation, repository handles queries
async update(id: number, data: UpdateData, company_id: number) {
  // Validation (business logic)
  const existing = await roleRepository.findByIdAndCompany(id, company_id);
  if (!existing) {
    throw new Error('ROLE_NOT_FOUND');
  }

  // Check business rules
  if (data.name && data.name !== existing.name) {
    const isDuplicate = await roleRepository.isNameTaken(company_id, data.name, id);
    if (isDuplicate) {
      throw new Error('DUPLICATE_ROLE');
    }
  }

  // Update (data access)
  return roleRepository.updateRole(id, company_id, data);
}
```

### Pattern 3: Multiple Repository Calls

```typescript
// Combine multiple repositories for complex operations
async getStatistics(company_id: number) {
  const [roles, employees, shifts] = await Promise.all([
    roleRepository.countByCompany(company_id),
    employeeRepository.countByCompany(company_id),
    shiftRepository.countByStatus(company_id),
  ]);

  return { roles, employees, shifts };
}
```

### Pattern 4: Transactions

```typescript
// Use transaction parameter for atomic operations
async bulkCreate(data: BulkData, company_id: number) {
  return prisma.$transaction(async (tx) => {
    // Validate with repository
    const existing = await employeeRepository.findByUserAndCompany(
      data.user_id,
      company_id
    );
    if (existing) {
      throw new Error('EMPLOYEE_EXISTS');
    }

    // Create with repository (pass transaction)
    return employeeRepository.create(data, { transaction: tx });
  });
}
```

---

## Repository Method Naming Conventions

Follow these conventions for consistency:

| Operation | Pattern | Example |
|-----------|---------|---------|
| Find one | `findBy{Criteria}` | `findByName`, `findByEmail` |
| Find many | `findBy{Criteria}` or `findAll` | `findByCompany`, `findActiveByRole` |
| Create | `create{Entity}` | `createRole`, `createShift` |
| Update | `update{Entity}` or `update{Field}` | `updateRole`, `updateStatus` |
| Delete | `delete{Entity}` or `softDelete` | `deleteRole`, `softDelete` |
| Check existence | `is{Condition}` or `exists` | `isNameTaken`, `isEmployeeOfCompany` |
| Count | `countBy{Criteria}` | `countByCompany`, `countByStatus` |
| Statistics | `getStatistics` | `getStatistics` |

---

## Available Repository Methods

### BaseRepository (Inherited by All)

Generic methods available in all repositories:

```typescript
findById(id: number, options?: any): Promise<T | null>
findByIds(ids: number[], options?: any): Promise<T[]>
findMany(where: any, options?: any): Promise<T[]>
findFirst(where: any, options?: any): Promise<T | null>
findManyPaginated(where: any, pagination: PaginationOptions, options?: any): Promise<PaginatedResult<T>>
count(where: any): Promise<number>
create(data: any, options?: any): Promise<T>
createMany(data: any[]): Promise<{ count: number }>
update(id: number, data: any, options?: any): Promise<T>
updateMany(where: any, data: any): Promise<{ count: number }>
softDelete(id: number): Promise<T>
softDeleteMany(where: any): Promise<{ count: number }>
delete(id: number): Promise<T>
deleteMany(where: any): Promise<{ count: number }>
upsert(where: any, create: any, update: any, options?: any): Promise<T>
```

### RoleRepository

```typescript
findByCompany(companyId, filters?, options?): Promise<Role[]>
findByName(companyId, name): Promise<Role | null>
findByIdAndCompany(id, companyId, includeEmployees?): Promise<Role | null>
createRole(data, transaction?): Promise<Role>
updateRole(id, companyId, data, transaction?): Promise<Role>
deleteRole(id, companyId, transaction?): Promise<Role>
countByCompany(companyId): Promise<number>
isNameTaken(companyId, name, excludeId?): Promise<boolean>
findByIdWithCount(id, companyId): Promise<Role | null>
findWithStatistics(companyId): Promise<Role[]>
```

### EmployeeRepository

```typescript
findByCompany(companyId, filters?, options?): Promise<Employee[]>
findByUserAndCompany(userId, companyId): Promise<Employee | null>
findByIdWithRelations(id): Promise<Employee | null>
findByRole(companyId, roleId): Promise<Employee[]>
findActiveByCompany(companyId): Promise<Employee[]>
updateRole(id, roleId, transaction?): Promise<Employee>
updateActiveStatus(id, isActive, transaction?): Promise<Employee>
bulkUpdateRole(ids, roleId, companyId): Promise<{ count: number }>
bulkUpdateActiveStatus(ids, isActive, companyId): Promise<{ count: number }>
countByCompany(companyId, filters?): Promise<number>
isEmployeeOfCompany(userId, companyId): Promise<boolean>
getStatistics(companyId): Promise<Statistics>
```

### ShiftRepository

```typescript
findByCompany(companyId, filters?, options?): Promise<Shift[]>
findByEmployee(companyEmployeeId, filters?, options?): Promise<Shift[]>
findByEmployeeAndDate(companyEmployeeId, shiftDate): Promise<Shift[]>
findByEmployeeAndDates(companyEmployeeId, dates): Promise<Shift[]>
findByEmployeeAndWeek(companyEmployeeId, weekStart, weekEnd): Promise<Shift[]>
createShift(data, transaction?): Promise<Shift>
createManyShifts(data, transaction?): Promise<{ count: number }>
updateStatus(id, status, transaction?): Promise<Shift>
softDeleteByIds(ids, companyId): Promise<{ count: number }>
countByStatus(companyId, status?): Promise<number>
getStatistics(companyId, startDate?, endDate?): Promise<Statistics>
isDuplicate(companyEmployeeId, shiftDate, startTime, endTime): Promise<boolean>
```

---

## Migration Priority Recommendations

Suggested order for migrating services:

### High Priority (Do First)
1. ✅ **role.service.ts** - Simple, good starting point
   - Use `role.service.v2.ts` as reference
   - Low risk, high test coverage gain

### Medium Priority (Do Second)
2. **employee.service.ts** - Moderate complexity
   - Many duplicate queries across codebase
   - Good ROI for testability

### Low Priority (Do Last)
3. **shift.service.ts** - Most complex
   - Wait until team is comfortable with pattern
   - Requires careful testing due to business logic complexity

### Optional (As Needed)
4. **shift-template.service.ts**
5. **statistics.service.ts**
6. **auth.service.ts** - Different pattern, may not benefit

---

## Testing Strategy

### Unit Tests (Service Layer)

Mock repositories for fast, isolated tests:

```typescript
import { roleRepository } from '../repositories/role.repository';

jest.mock('../repositories/role.repository');

describe('RoleService', () => {
  it('should validate before creating', async () => {
    roleRepository.isNameTaken.mockResolvedValue(false);
    roleRepository.createRole.mockResolvedValue(mockRole);

    const result = await roleService.create(data, companyId);

    expect(roleRepository.isNameTaken).toHaveBeenCalledWith(companyId, data.name);
    expect(result).toEqual(mockRole);
  });
});
```

### Integration Tests (Repository Layer)

Test actual database queries (see `repositories.test.ts`):

```typescript
describe('RoleRepository', () => {
  it('should find roles by company', async () => {
    const roles = await roleRepository.findByCompany(testCompanyId);
    expect(roles).toBeDefined();
    expect(roles.length).toBeGreaterThan(0);
  });
});
```

---

## Benefits You'll See

### Before Migration
- ❌ Services tightly coupled to Prisma
- ❌ Duplicate query logic
- ❌ Hard to test without database
- ❌ Mixed concerns (business + data access)

### After Migration
- ✅ Clean separation of concerns
- ✅ Reusable query logic
- ✅ Easy to mock for testing
- ✅ Better code organization
- ✅ Easier to change database layer (if needed)

---

## Example: Full Service Migration

See `role.service.v2.ts` for a complete example of migrating a service.

To apply this migration:

1. Review the V2 implementation
2. Run tests to ensure compatibility
3. Replace `role.service.ts` with `role.service.v2.ts`
4. Update imports in controllers (if needed)
5. Run full test suite
6. Deploy and monitor

---

## Questions?

For questions or issues:
1. Check `repositories.test.ts` for examples
2. Review `role.service.v2.ts` for patterns
3. Consult PLAN.md Section 6
4. Ask the team in #backend-architecture

---

**Last Updated**: 2025-10-18
**Maintained By**: Backend Team

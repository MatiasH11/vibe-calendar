# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Calendar is a modern employee shift management system built as a full-stack monorepo with separate frontend and backend applications. The system enables companies to plan weekly shifts, manage employees and roles, and track work patterns with an intuitive interface.

## Tech Stack

**Backend:**
- Node.js + TypeScript + Express
- PostgreSQL database with Prisma ORM
- JWT authentication with bcrypt
- Swagger API documentation at `/api/docs`

**Frontend:**
- Next.js 14 (App Router)
- React with TypeScript
- TanStack Query for data fetching
- Zustand for state management
- Radix UI components with Tailwind CSS
- Framer Motion for animations

## Common Development Commands

### Backend (`/backend`)
```bash
# Development
npm run dev                          # Start dev server with hot reload on port 3001
npm run build                        # Compile TypeScript to /dist
npm start                            # Run production build

# Database
npm run prisma:migrate               # Run Prisma migrations (interactive)
npm run prisma:generate              # Generate Prisma client
npm run prisma:studio                # Open Prisma Studio (database GUI)
npm run db:studio                    # Alias for prisma:studio

# Testing
npm test                             # Run all Jest tests
npm test -- --testPathPattern=shift  # Run tests for specific module (e.g., shift tests)
npm test -- --watch                  # Run tests in watch mode
npm test -- --coverage               # Run tests with coverage report

# Code Generation
npm run generate:crud                # Auto-generate CRUD services/controllers (beta)
npm run docs:postman                 # Generate Postman collection from routes
```

### Frontend (`/frontend`)
```bash
# Development
npm run dev                          # Start Next.js dev server on port 3000
npm run build                        # Build production Next.js app
npm start                            # Run production build

# Testing & Linting
npm run lint                         # Run ESLint
npm test                             # Run Jest tests
npm run test:watch                   # Run tests in watch mode
npm run test:coverage                # Run tests with coverage
```

### Running Both Apps Simultaneously
From the project root: Run both dev servers in separate terminals with `npm run dev` in each `/backend` and `/frontend` directory.

## Architecture & Code Structure

### Backend Architecture

The backend follows a layered architecture with clear separation of concerns:

**Layer Flow:** Routes → Controllers → Services → Prisma (Database)

**Key Directories:**
- `src/routes/` - Express route definitions, all mounted with `/api/v1` prefix
- `src/controllers/` - Request/response handling and validation
- `src/services/` - Business logic and database operations
- `src/middlewares/` - Auth, validation, error handling
- `src/validations/` - Zod schemas for request validation
- `src/config/` - Environment, Prisma client, Swagger setup
- `prisma/` - Database schema and migrations

**Authentication Flow:**
1. User logs in via `/api/v1/auth/login` with email/password
2. Backend validates credentials and returns JWT token
3. Frontend stores token in cookie (`auth_token`)
4. Protected routes require `Authorization: Bearer <token>` header
5. `authMiddleware` validates JWT and attaches `req.user` payload
6. Admin routes additionally use `adminMiddleware` to check user_type

**Important Services:**
- `auth.service.ts` - User authentication and registration
- `shift.service.ts` - Complex shift management with conflict detection, bulk operations, pattern tracking
- `shift-template.service.ts` - Reusable shift templates with caching
- `shift_requirement.service.ts` - Shift requirements for scheduling batch operations
- `shift_requirement_position.service.ts` - Links job positions to shift requirements
- `scheduling_batch.service.ts` - Batch shift scheduling and automated planning
- `job_position.service.ts` - Job positions within departments (used in shift requirements)
- `employee.service.ts` - Employee CRUD with company-scoped access
- `role.service.ts` - Role management per company (deprecated in favor of departments)
- `statistics.service.ts` - Dashboard statistics and analytics
- `audit.service.ts` - System audit logging for compliance and debugging

### Frontend Architecture

The frontend uses Next.js App Router with a component-based architecture:

**Key Patterns:**
- Route groups: `(auth)` for login/register, unprotected routes
- Protected routes: `/dashboard/*` routes require authentication (enforced by `middleware.ts`)
- API integration via TanStack Query hooks in `src/hooks/`
- Global state via Zustand stores in `src/stores/`
- Form validation with React Hook Form + Zod resolvers

**Directory Structure:**
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Organized by feature: dashboard, employees, shifts, auth, ui
- `src/hooks/` - Custom React hooks for API calls and business logic
- `src/stores/` - Zustand stores (authStore, employeeStore, etc.)
- `src/lib/` - Utilities, validation schemas, permissions system
- `src/types/` - TypeScript type definitions matching backend API

**Authentication Flow:**
1. Middleware (`middleware.ts`) checks for `auth_token` cookie on protected routes
2. JWT is verified using `jose` library
3. Invalid/missing tokens redirect to `/login`
4. `AuthRedirect` component handles client-side auth state
5. User context stored in Zustand `authStore`

**Dashboard System:**
- `DashboardProvider` manages view state, sidebar, and breadcrumbs
- Views are lazy-loaded components in `components/dashboard/views/`
- Navigation handled via `useDashboardNavigation` hook
- Keyboard shortcuts via `react-hotkeys-hook` (defined in `shortcuts/`)

### Database Schema (Prisma)

**Core Models:**
- `user` - System users with user_type (admin/employee)
- `company` - Multi-tenant companies with locations and departments
- `location` - Physical locations within a company
- `department` - Departments within locations
- `job_position` - Job positions within departments (replaces old role system)
- `employee` - Employees linked to companies, locations, and departments
- `shift` - Individual work shifts with date, times, and status
- `shift_template` - Reusable shift templates with usage tracking
- `shift_requirement` - Requirements for shifts (e.g., "need 2 nurses for 8am-4pm")
- `shift_requirement_position` - Links job positions to shift requirements
- `scheduling_batch` - Batch operations for automated shift scheduling
- `scheduling_template` - Templates for batch scheduling patterns
- `employee_shift_pattern` - AI-powered pattern tracking for shift suggestions
- `audit_log` - Complete audit trail of all system changes

**Key Relationships:**
- Users can belong to multiple companies
- Employees linked to company + location + department
- Shifts assigned to employees with assignment/confirmation tracking
- Shift requirements define staffing needs by position
- All queries are company-scoped for multi-tenancy
- Soft deletes via `deleted_at` timestamp
- Audit logs track who made what changes and when

**Time Handling - UTC ONLY Policy (PLAN.md 4):**
- **CRITICAL:** Backend ONLY handles UTC. No timezone conversions. No adapters.
- **Input:** Frontend sends times in UTC format (HH:mm string, e.g., "14:30")
- **Processing:** Backend works internally in UTC using `time.utils.ts`
- **Storage:** PostgreSQL `Time` type (UTC) via Prisma DateTime objects
- **Output:** Backend returns times in UTC format (HH:mm string)
- **Frontend Responsibility:** ALL timezone conversion to/from user's local timezone
- **Validation:** Zod schemas reject any timezone information (+00:00, Z, etc.)
- **Utilities:** Use ONLY functions from `backend/src/utils/time.utils.ts`
- **Shift dates:** Stored as PostgreSQL `Date` type (date only, no time component)

### Shift Management System

The shift system is the most complex part of the application:

**Individual Shift Management:**
- Create, update, delete individual shifts
- Duplicate shifts across dates/employees with conflict resolution
- Conflict validation with detailed analysis (overlap, adjacent, duplicate)
- Business rule validation (max daily/weekly hours, minimum break time)
- Assignment and confirmation tracking
- Pattern tracking: system learns common shift times per employee
- Smart suggestions based on patterns, recent shifts, and templates

**Conflict Resolution Strategies:**
- `fail` - Abort operation if any conflicts detected
- `skip` - Skip conflicting shifts, create non-conflicting ones
- `overwrite` - Delete existing shifts and create new ones

**Pattern Learning:**
- `employee_shift_pattern` automatically tracks frequently used shift times
- Each shift creation updates pattern frequency counters
- Suggestions weighted by frequency and recency
- Used for autocomplete and quick shift creation

**Batch Scheduling System:**
The scheduling batch system enables automated mass shift assignment based on staffing requirements:

- **Shift Requirements:** Define what positions need to be filled and when
  - Specify date range, times, and required positions
  - Set minimum/maximum number of employees per position
  - Link to job positions that can fulfill the requirement

- **Scheduling Batches:** Execute bulk shift creation with:
  - Template-based patterns (daily, weekly, monthly repeats)
  - Conflict resolution at batch level (fail/skip/overwrite)
  - Constraint validation before creation
  - Audit trail of all batch operations

- **Workflow:** Requirements → Batch Templates → Batch Execution → Shifts Created
- See `shift_requirement.service.ts` and `scheduling_batch.service.ts` for implementation details

## Important Implementation Notes

### Multi-Tenancy
- All backend operations are company-scoped via `admin_company_id` from JWT
- Frontend always sends company_id (derived from user's auth token)
- Never expose data across companies - validate company ownership in services
- Use Prisma `company_employee` join for user-company relationships

### Error Handling
- **Backend Error Classes:** Use custom error classes from `src/errors/` (e.g., `ResourceNotFoundError`, `UnauthorizedCompanyAccessError`)
- **Error Handler Flow:** Services throw errors → Controllers catch and pass through → Global `error_handler` middleware maps to HTTP status codes
- **Error Response Format:** `{ success: false, error: "Error message", statusCode: 400 }`
- **Validation Errors:** Zod validation errors returned as structured objects with field-specific messages
- **Frontend Error Handling:** TanStack Query's `onError` hooks display toast notifications via `sonner` library
- **Logging:** Backend uses Winston logger for all errors, exceptions, and critical operations

### API Conventions
- All backend routes prefixed with `/api/v1`
- RESTful endpoints: GET (list/get), POST (create), PUT (update), DELETE (soft delete)
- Request validation via Zod schemas in `validations/`
- Responses follow pattern: `{ success: true, data: ... }` or `{ success: false, error: ... }`
- Pagination supported on list endpoints with `page` and `limit` query params

### Frontend Data Fetching
- Use TanStack Query hooks for all API calls (defined in `src/hooks/`)
- Optimistic updates for better UX (e.g., `useEmployeeForm`)
- Cache invalidation via `queryClient.invalidateQueries()`
- Loading and error states handled via query states
- Toast notifications via `sonner` library

### Time Zone Handling - DEPRECATED (See "Time Handling - UTC ONLY Policy" above)
**NOTE:** This section contains outdated information. The system has been refactored to follow a pure UTC-only approach.

**Old Approach (DEPRECATED):**
- ~~Backend converts between local and UTC times~~ ❌
- ~~Frontend sends local times to backend~~ ❌

**New Approach (CURRENT - PLAN.md 4):**
- Backend ONLY handles UTC (HH:mm format)
- Frontend ONLY sends UTC times to backend
- Frontend handles ALL timezone conversions for display
- Use `backend/src/utils/time.utils.ts` for all time operations
- NEVER use deprecated `time-conversion.utils.ts`

### Backend Service Patterns

All backend services follow consistent patterns for maintainability:

**Service Structure:**
- Named exports as object: `export const <entity>_service = { ... }`
- Methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `bulk<Operation>()`
- Pagination support: `page` and `limit` query parameters, max 100 items per request
- Filtering: `where` objects constructed from validated filters (search, status, date range, etc.)
- Timestamps: `created_at`, `updated_at` (auto), `deleted_at` (soft delete)

**Error Handling in Services:**
- Throw custom error classes instead of generic errors
- Validate company ownership before returning/modifying data
- Include meaningful error messages for debugging

**Bulk Operations:**
- Use Prisma transactions for consistency: `prisma.$transaction()`
- Return `{ succeeded: [], failed: [] }` objects
- Collect validation errors and report all at once

**Database Queries:**
- Use Prisma filtering to apply soft deletes (`deleted_at: null`)
- Apply company-scoped filters to all queries
- Use Prisma relations for eager loading when needed
- Index frequently filtered columns

### Permissions System
- User types: `admin` (full access) and `employee` (limited access)
- Backend enforces: `adminMiddleware` for admin-only routes
- Frontend has permission helpers in `src/lib/permissions.ts`
- Route protection via `useRouteProtection` hook
- Component-level protection via `ProtectedContent` wrapper

### Testing
- Backend: Jest with supertest for integration tests in `src/__tests__/`
- Frontend: Jest with React Testing Library, tests in `__tests__/` directories
- Run tests before committing significant changes
- Integration tests cover full request-response cycles

## Environment Configuration

### Backend (`.env`)
```
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/calendar_shift_db"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key
```

Both apps default to sensible development values if environment variables are missing.

## Common Patterns & Gotchas

### Backend

**Company Scoping - CRITICAL:**
- **ALWAYS** extract `admin_company_id` from JWT token via `req.user.admin_company_id`
- **NEVER** trust company_id from request body - validate it matches the user's company
- Example: `if (company_id !== req.user.admin_company_id) throw new UnauthorizedCompanyAccessError()`
- This prevents data leakage across companies in the multi-tenant system

**When Adding New Models:**
1. Add to `prisma/schema.prisma` with proper relations and indexes
2. Create migration: `npm run prisma:migrate`
3. Create validation schema in `src/validations/<entity>.validation.ts`
4. Create service in `src/services/<entity>.service.ts` (follow service patterns above)
5. Create controller in `src/controllers/<entity>.controller.ts`
6. Create routes in `src/routes/<entity>.routes.ts`
7. Mount routes in `src/app.ts` with `/api/v1` prefix

**Time Handling - CRITICAL:**
- **Backend input:** Always expect UTC times as "HH:mm" strings (e.g., "14:30")
- **Backend output:** Always return times as UTC "HH:mm" strings
- **DO NOT** store timezone info in database
- **Use ONLY** `backend/src/utils/time.utils.ts` for time operations
- Shift dates are PostgreSQL `Date` type (date-only, no time component)

**Testing Database Changes:**
- After schema changes, run `npm run prisma:generate` to update client types
- Run migrations in test environment: `DATABASE_URL=... npm run prisma:migrate`
- Clear test database between runs to avoid state pollution

### Frontend

**Component Location Matters:**
- Route group components: `/app/(auth)/` for unprotected pages
- Protected routes: `/app/dashboard/` components automatically protected by middleware
- Shared UI components: `/components/ui/` (Radix UI + Tailwind)
- Feature components: `/components/<feature>/` (e.g., `/components/shifts/`)

**Data Fetching:**
- **ALWAYS** use TanStack Query hooks from `src/hooks/`
- **NEVER** call fetch directly in components
- **Optimistic updates:** Use `queryClient.setQueryData()` for immediate UX feedback
- **Cache invalidation:** `queryClient.invalidateQueries({ queryKey: [...] })`

**Timezone in Frontend:**
- Display all times in user's local timezone (browser's timezone)
- Convert: Backend UTC string → Date object → user's local timezone for display
- Convert: User's local time input → UTC string before sending to backend
- Frontend components should handle timezone conversion internally

### Database

**Soft Deletes:**
- Never forget `deleted_at: null` in WHERE clauses
- Use Prisma soft delete middleware or manually filter
- This prevents accidental data exposure

**Indexes:**
- Check `prisma/schema.prisma` @@index annotations
- Add indexes to frequently filtered columns (company_id, deleted_at, user_id, etc.)
- Compound indexes: `[company_id, status, deleted_at]` for common filter combinations
- Run `npm run prisma:studio` to inspect data and verify indexes are working

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
npm run dev                  # Start dev server with hot reload on port 3001
npm run build               # Compile TypeScript to /dist
npm start                   # Run production build

# Database
npm run prisma:migrate      # Run Prisma migrations
npm run prisma:generate     # Generate Prisma client
npm run prisma:studio       # Open Prisma Studio (database GUI)
npm run db:studio           # Alias for prisma:studio

# Testing
npm test                    # Run Jest tests
```

### Frontend (`/frontend`)
```bash
# Development
npm run dev                 # Start Next.js dev server on port 3000
npm run build              # Build production Next.js app
npm start                  # Run production build

# Testing & Linting
npm run lint               # Run ESLint
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

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
- `employee.service.ts` - Employee CRUD with company-scoped access
- `role.service.ts` - Role management per company
- `statistics.service.ts` - Dashboard statistics and analytics

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
- `company` - Multi-tenant companies
- `role` - Company-specific roles with colors
- `company_employee` - Join table linking users to companies with roles
- `shift` - Individual work shifts with date, times, and status
- `shift_template` - Reusable shift templates with usage tracking
- `employee_shift_pattern` - AI-powered pattern tracking for shift suggestions

**Key Relationships:**
- Users can belong to multiple companies via `company_employee`
- Shifts belong to `company_employee` (not directly to users)
- All queries are company-scoped for multi-tenancy
- Soft deletes via `deleted_at` timestamp

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

**Key Features:**
- Create, update, delete individual shifts
- Duplicate shifts across dates/employees with conflict resolution
- Bulk shift creation with templates
- Conflict validation with detailed analysis (overlap, adjacent, duplicate)
- Business rule validation (max daily/weekly hours, minimum break time)
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

## Important Implementation Notes

### Multi-Tenancy
- All backend operations are company-scoped via `admin_company_id` from JWT
- Frontend always sends company_id (derived from user's auth token)
- Never expose data across companies - validate company ownership in services
- Use Prisma `company_employee` join for user-company relationships

### Error Handling
- Backend throws descriptive error strings (e.g., 'UNAUTHORIZED_COMPANY_ACCESS')
- Global `error_handler` middleware maps errors to HTTP status codes
- Frontend hooks use TanStack Query's error handling with toast notifications
- Validation errors returned as structured Zod error objects

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

### Permissions System
- User types: `admin` (full access) and `employee` (limited access)
- Frontend has permission helpers in `src/lib/permissions.ts`
- Route protection via `useRouteProtection` hook
- Component-level protection via `ProtectedContent` wrapper
- Backend enforces permissions in middleware and services

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

# Vibe Calendar API - Backend

Employee shift management system API built with Node.js, TypeScript, Express, and PostgreSQL.

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

Interactive API docs available at: `http://localhost:3001/api/docs`

## Core Features

### Template-Based Shift Management (Phase 4)

#### Day Templates
Reusable daily shift schedules that define:
- Working hours structure
- Required job positions
- Assignment constraints

**Endpoints:**
- `GET /api/v1/day-templates` - List templates
- `GET /api/v1/day-templates/:id` - Get template details
- `POST /api/v1/day-templates` - Create new template
- `PUT /api/v1/day-templates/:id` - Update template
- `DELETE /api/v1/day-templates/:id` - Delete template

#### Template Shifts
Individual shifts within a day template with:
- Start/end times
- Position requirements
- Color coding

**Endpoints:**
- `GET /api/v1/template-shifts` - List shifts
- `GET /api/v1/template-shifts/:id` - Get shift details
- `POST /api/v1/template-shifts` - Create shift
- `PUT /api/v1/template-shifts/:id` - Update shift
- `DELETE /api/v1/template-shifts/:id` - Delete shift

#### Shift Assignments
Employee assignments to shifts with automatic validation:
- **Conflict Detection**: Prevents overlapping shifts for same employee
- **Business Rules**: Enforces max daily/weekly hours, minimum breaks
- **Confirmation**: Shift must be confirmed before becoming official

**Endpoints:**
```
GET    /api/v1/shift-assignments              # List assignments
GET    /api/v1/shift-assignments/:id          # Get assignment
POST   /api/v1/shift-assignments              # Create (validates conflicts + rules)
PUT    /api/v1/shift-assignments/:id          # Update (re-validates)
DELETE /api/v1/shift-assignments/:id          # Delete (soft delete)
PATCH  /api/v1/shift-assignments/:id/confirm  # Confirm shift (pending → confirmed)

POST   /api/v1/shift-assignments/bulk/create  # Bulk create (fail-safe validation)
PUT    /api/v1/shift-assignments/bulk/update  # Bulk update
DELETE /api/v1/shift-assignments/bulk/delete  # Bulk delete
```

## Usage Examples

### Create a Day Template
```bash
POST /api/v1/day-templates
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Standard Weekday",
  "description": "Regular weekday shift schedule",
  "location_id": 1,
  "is_active": true
}
```

### Create Template Shift
```bash
POST /api/v1/template-shifts
Authorization: Bearer <JWT_TOKEN>

{
  "day_template_id": 1,
  "name": "Morning Shift",
  "start_time": "09:00",
  "end_time": "17:00",
  "color": "#3B82F6"
}
```

### Assign Employee to Shift
```bash
POST /api/v1/shift-assignments
Authorization: Bearer <JWT_TOKEN>

{
  "employee_id": 5,
  "location_id": 1,
  "job_position_id": 3,
  "template_shift_id": 1,
  "shift_date": "2025-01-20",
  "start_time": "09:00",
  "end_time": "17:00"
}
```

**Validation Rules Applied:**
1. ✅ Conflict Check: No overlapping shifts for same employee same day
2. ✅ Daily Hours: Total hours ≤ max_daily_hours (default: 12h)
3. ✅ Weekly Hours: Total hours ≤ max_weekly_hours (default: 40h)
4. ✅ Break Time: Rest between shifts ≥ min_break_hours (default: 11h)

### Confirm Assignment
```bash
PATCH /api/v1/shift-assignments/123/confirm
Authorization: Bearer <JWT_TOKEN>

# No body required
# Changes status: pending → confirmed
# Sets confirmed_by and confirmed_at
```

### Bulk Assign from Template
```bash
POST /api/v1/shift-assignments/bulk/create
Authorization: Bearer <JWT_TOKEN>

{
  "items": [
    {
      "employee_id": 1,
      "location_id": 1,
      "job_position_id": 1,
      "shift_date": "2025-01-20",
      "start_time": "09:00",
      "end_time": "17:00"
    },
    {
      "employee_id": 2,
      "location_id": 1,
      "job_position_id": 2,
      "shift_date": "2025-01-20",
      "start_time": "14:00",
      "end_time": "22:00"
    }
  ]
}
```

### Advanced: Bulk Assign Multiple Employees to Template
```typescript
// Service method: bulkAssignFromTemplate()
// Automatically creates assignments for:
// - Each date in range
// - Each template shift
// - Each employee
// With full validation (conflict + rules)

await shift_assignment_service.bulkAssignFromTemplate(
  day_template_id: 1,
  employee_ids: [1, 2, 3, 4, 5],
  start_date: "2025-01-20",
  end_date: "2025-01-31",
  company_id: 1,
  user_id: 42
);

// Result: 5 employees × 5 days × 2 shifts = 50 assignments
// If any validation fails → all rollback (fail-safe)
```

### Coverage Analysis
```bash
GET /api/v1/shift-assignments/coverage?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer <JWT_TOKEN>

# Returns:
{
  "success": true,
  "data": {
    "coverage": [
      {
        "date": "2025-01-01",
        "position_id": 1,
        "position_name": "Manager",
        "required": 2,
        "assigned": 1,
        "shortfall": 1
      },
      ...
    ],
    "summary": {
      "total_dates": 31,
      "total_positions": 5,
      "total_required": 155,
      "total_assigned": 150,
      "total_shortfall": 5
    }
  }
}
```

## Error Responses

### Conflict Error (409)
```json
{
  "success": false,
  "error": "Shift assignment conflicts with existing shift",
  "statusCode": 409,
  "data": {
    "employeeId": 5,
    "conflictingShiftId": 123
  }
}
```

### Business Rule Violation (400)
```json
{
  "success": false,
  "error": "Shift assignment violates business rules",
  "statusCode": 400,
  "data": {
    "violations": [
      "Daily hours (13.00h) exceeds maximum (12.0h)",
      "Break time (4.00h) is less than minimum (11.0h)"
    ]
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "shift_assignment not found",
  "statusCode": 404,
  "data": {
    "resourceType": "shift_assignment",
    "resourceId": 999
  }
}
```

## Database Schema

### Key Models

**day_template**
- id, company_id, location_id
- name (unique per company), description
- is_active, created_at, updated_at, deleted_at
- Relations: company, location, template_shifts

**template_shift**
- id, day_template_id
- name, start_time, end_time
- color, sort_order
- Relations: day_template, position_requirements, shift_assignments

**shift_assignment**
- id, company_id, location_id, employee_id, job_position_id
- template_shift_id (optional)
- shift_date, start_time, end_time
- status (pending | confirmed | cancelled)
- confirmed_by, confirmed_at
- assigned_by, assigned_at
- Relations: company, employee, location, job_position, template_shift

## Development Commands

```bash
# Database
npm run prisma:migrate         # Run migrations
npm run prisma:generate        # Generate Prisma client
npm run prisma:studio          # Open Prisma Studio GUI

# Testing
npm test                       # Run all tests
npm test -- --watch           # Watch mode
npm test -- --coverage        # Coverage report

# Code Generation
npm run generate:crud          # Auto-generate CRUD (advanced)

# Docs
npm run docs:postman           # Generate Postman collection
```

## Time Format

- **Input/Output Format**: `HH:mm` (e.g., "14:30")
- **Timezone**: UTC only (no timezone conversions in backend)
- **Date Format**: `YYYY-MM-DD` (e.g., "2025-01-20")
- **Validation**: Zod schemas reject invalid formats

## Multi-Tenancy

All endpoints are company-scoped:
- Company ID extracted from JWT token (`admin_company_id`)
- Impossible to access data from another company
- All queries filtered by company_id

## Audit Logging

Every operation creates an audit log entry with:
- User ID, Company ID, Action (CREATE/UPDATE/DELETE/BULK_*), Entity Type, Entity ID
- Old values, New values, Timestamp

## Security

- **Authentication**: JWT tokens required for all endpoints except `/auth/login` and `/auth/register`
- **Authorization**: Company-scoped access, role-based for admin operations
- **Soft Deletes**: Deleted records kept with `deleted_at` timestamp for compliance
- **Transactions**: ACID compliance for all critical operations
- **Validation**: Zod schemas for request body validation

## Performance Notes

- Default page limit: 50 items (max: 100)
- Indexes on: company_id, deleted_at, status, shift_date
- Batch operations optimized with fail-safe validation
- Consider Redis caching for company_settings if scaling

## Changelog

### Phase 4 (2025-11-11)
- ✅ Day template management
- ✅ Template shift CRUD
- ✅ Shift assignment with validation
- ✅ Conflict detection (overlapping shifts)
- ✅ Business rules validation (hours, breaks)
- ✅ Shift confirmation workflow
- ✅ Bulk assignment from templates
- ✅ Coverage analysis

# CRUD Generator

Automated CRUD generator for Vibe Calendar backend. Reads from Prisma schema and auto-detects fields to generate complete CRUD modules.

## Usage

```bash
npm run generate:crud
```

## What It Does

1. **Lists all available Prisma models** from `prisma/schema.prisma`
2. **Prompts for model selection** (by name or number)
3. **Auto-detects fields** from the selected model (excludes id, timestamps, relations)
4. **Generates 4 files:**
   - `src/validations/{entity}.validation.ts` - Zod schemas for validation
   - `src/services/{entity}.service.ts` - Business logic and database operations
   - `src/controllers/{entity}.controller.ts` - Request/response handlers
   - `src/routes/{entity}.routes.ts` - Express routes with Swagger docs

## Example

```bash
$ npm run generate:crud

📦 CRUD Generator v1.0

Available models:
  1. company
  2. user
  3. department
  4. employee
  5. shift
  6. shift_template
  7. employee_shift_pattern
  8. audit_log
  9. company_settings

Enter model name or number: department

✅ Selected model: department

Detected fields:
  - company_id: Int
  - name: String
  - description: String?
  - color: String
  - is_active: Boolean

📝 Generating CRUD files for department...

✅ Created: src/validations/department.validation.ts
✅ Created: src/services/department.service.ts
✅ Created: src/controllers/department.controller.ts
✅ Created: src/routes/department.routes.ts

✨ CRUD generation completed!

Next steps:
  1. Review generated files in src/
  2. Add route to app.ts: import departmentRouter from './routes/department.routes';
  3. Add route to app.ts: app.use('/api/v1/departments', departmentRouter);
  4. Update Swagger tags in src/config/swagger.ts
  5. Test endpoints at /api/docs
```

## Generated Files

### Validation File
- Create schema with all required fields
- Update schema with all fields optional
- Query filters schema (pagination, search, sorting)
- Bulk operation schemas (create, update, delete)
- TypeScript types exported from Zod schemas

### Service File
- `getAll()` - List with pagination, search, and filters
- `getById()` - Get single entity
- `create()` - Create with audit logging
- `update()` - Update with audit logging
- `delete()` - Soft delete with audit logging
- `bulkCreate()` - Bulk create (max 100 items)
- `bulkUpdate()` - Bulk update (max 100 items)
- `bulkDelete()` - Bulk delete (max 100 items)

All operations are company-scoped and include proper error handling.

### Controller File
- Request validation using Zod schemas
- Error handling with try-catch
- Proper HTTP status codes (200, 201, 404, etc.)
- Extracts company_id and user_id from JWT token

### Routes File
- RESTful endpoints:
  - `GET /` - List all
  - `GET /:id` - Get by ID
  - `POST /` - Create
  - `PUT /:id` - Update
  - `DELETE /:id` - Delete
  - `POST /bulk/create` - Bulk create
  - `PUT /bulk/update` - Bulk update
  - `DELETE /bulk/delete` - Bulk delete
- Authentication middleware on all routes
- Swagger documentation with @openapi JSDoc comments

## Integration Steps

After generating CRUD files, integrate them into your app:

### 1. Import the router in `app.ts`

```typescript
import departmentRouter from './routes/department.routes';
```

### 2. Register the route

```typescript
app.use('/api/v1/departments', departmentRouter);
```

### 3. Add Swagger tag in `src/config/swagger.ts`

```typescript
tags: [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Audit', description: 'Audit log endpoints' },
  { name: 'Departments', description: 'Department management' }, // Add this
],
```

### 4. Test the endpoints

- Start the server: `npm run dev`
- Visit Swagger UI: http://localhost:3001/api/docs
- Test each endpoint

## Standards Followed

The generator follows all patterns defined in `CRUD_STANDARD.md`:

- ✅ Multi-tenancy with company_id filtering
- ✅ Soft deletes with deleted_at timestamp
- ✅ Audit logging for all CREATE/UPDATE/DELETE operations
- ✅ Pagination (page, limit) with max 100 items
- ✅ Search and filtering capabilities
- ✅ Bulk operations limited to 100 items
- ✅ Proper error handling with custom errors
- ✅ Transactional integrity with Prisma transactions
- ✅ Swagger documentation for all endpoints
- ✅ Zod validation for all inputs

## Field Detection

The generator automatically:

- **Includes:** All scalar fields (String, Int, Boolean, DateTime, etc.)
- **Excludes:**
  - `id` - Auto-generated primary key
  - `created_at`, `updated_at`, `deleted_at` - Timestamps
  - Relations - Handled separately (User, Company, etc.)
  - Foreign keys - Included but handled specially

## Customization

After generation, you may need to customize:

1. **Search fields** in service `getAll()` - Currently searches only `name` field
2. **Validation rules** - Add min/max lengths, regex patterns, etc.
3. **Unique constraints** - Add checks for unique fields
4. **Relations** - Add include/select for related data
5. **Business rules** - Add custom validation logic

## Notes

- Generated code follows UTC-only time handling policy (PLAN.md 4)
- All times are stored/processed in UTC format (HH:mm strings)
- Company-scoped operations prevent cross-company data access
- All operations create audit logs for compliance
- Bulk operations are atomic (all succeed or all fail)

## Troubleshooting

**Error: "Model not found in schema.prisma"**
- Ensure model name is spelled correctly
- Check that `prisma/schema.prisma` exists
- Run `prisma generate` to ensure schema is valid

**Error: "No models found"**
- Verify `prisma/schema.prisma` has model definitions
- Check file path is correct

**Generated files have wrong types**
- Review Prisma schema for field types
- Check `mapPrismaTypeToZod()` function for type mappings
- Customize generated files as needed

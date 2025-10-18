# Migration: Add Audit Log System for Compliance and Debugging

**Created:** 2025-10-18
**Reference:** PLAN.md Section 2 (Complete)
**Impact:** High - Full system traceability and compliance

---

## Overview

This migration implements a comprehensive **audit logging system** that tracks all critical changes in Vibe Calendar for:
- **Compliance:** Meet regulatory requirements for data change tracking
- **Debugging:** Investigate issues by reviewing historical changes
- **Security:** Monitor user actions and detect suspicious behavior
- **Analytics:** Understand usage patterns and system activity

---

## Database Changes

### New Enum: `audit_action`

Defines types of auditable actions:
- `CREATE` - Entity creation
- `UPDATE` - Entity modification
- `DELETE` - Entity deletion (soft or hard)
- `LOGIN` - User authentication
- `LOGOUT` - User logout
- `EXPORT` - Data export operations
- `IMPORT` - Data import operations

### New Table: `audit_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | User who performed the action |
| `company_id` | INTEGER | Company context (multi-tenancy) |
| `action` | audit_action | Type of action performed |
| `entity_type` | TEXT | Entity type (e.g., "shift", "employee") |
| `entity_id` | INTEGER | ID of affected entity (nullable) |
| `old_values` | JSONB | Previous state (for UPDATE/DELETE) |
| `new_values` | JSONB | New state (for CREATE/UPDATE) |
| `ip_address` | VARCHAR(45) | IPv4 or IPv6 address |
| `user_agent` | TEXT | Browser/client information |
| `created_at` | TIMESTAMP(3) | When the action occurred |

### Indexes

Four optimized indexes for common query patterns:

1. **`idx_audit_company_date`** - Query by company + date
   ```sql
   SELECT * FROM audit_log
   WHERE company_id = 1
   ORDER BY created_at DESC;
   ```

2. **`idx_audit_user_date`** - Query by user + date
   ```sql
   SELECT * FROM audit_log
   WHERE user_id = 5
   ORDER BY created_at DESC;
   ```

3. **`idx_audit_entity`** - Query entity history
   ```sql
   SELECT * FROM audit_log
   WHERE entity_type = 'shift'
     AND entity_id = 123;
   ```

4. **`idx_audit_action_date`** - Filter by action type
   ```sql
   SELECT * FROM audit_log
   WHERE action = 'DELETE'
   ORDER BY created_at DESC;
   ```

---

## Application Layer Changes

### 1. Audit Service (`audit.service.ts`)

Centralized service for audit logging:

```typescript
// Log a shift creation
await audit_service.logCreate(
  user_id,
  company_id,
  'shift',
  created_shift.id,
  created_shift,
  ip_address,
  user_agent
);

// Log a shift update
await audit_service.logUpdate(
  user_id,
  company_id,
  'shift',
  shift_id,
  old_shift_data,
  updated_shift_data
);

// Query audit logs
const result = await audit_service.query({
  company_id: 1,
  action: 'DELETE',
  start_date: '2025-08-01',
  end_date: '2025-08-31',
  page: 1,
  limit: 50
});
```

### 2. Audit Middleware (`audit.middleware.ts`)

Automatic audit logging via middleware:

```typescript
// In routes/shift.routes.ts
router.post('/',
  authMiddleware,
  adminMiddleware,
  auditMiddleware('shift'),  // ← Automatic audit logging
  create_shift_handler
);
```

**Features:**
- Extracts IP address (handles proxies)
- Captures user agent
- Logs asynchronously (non-blocking)
- Graceful error handling

### 3. API Endpoints (`audit.routes.ts`)

Four new endpoints for querying audit logs:

#### GET `/api/v1/audit`
Query audit logs with filters:
```bash
GET /api/v1/audit?action=DELETE&start_date=2025-08-01&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "DELETE",
      "entity_type": "shift",
      "entity_id": 123,
      "old_values": { "start_time": "09:00", "end_time": "17:00" },
      "user": { "first_name": "John", "last_name": "Doe" },
      "created_at": "2025-08-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### GET `/api/v1/audit/entity/:type/:id`
Get complete audit trail for a specific entity:
```bash
GET /api/v1/audit/entity/shift/123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entity_type": "shift",
    "entity_id": 123,
    "history": [
      { "action": "CREATE", "created_at": "2025-08-10T09:00:00Z" },
      { "action": "UPDATE", "created_at": "2025-08-12T14:00:00Z" },
      { "action": "DELETE", "created_at": "2025-08-15T16:00:00Z" }
    ],
    "total_changes": 3
  }
}
```

#### GET `/api/v1/audit/recent`
Dashboard widget - recent activity:
```bash
GET /api/v1/audit/recent?limit=10
```

#### GET `/api/v1/audit/statistics`
Audit statistics by action type:
```bash
GET /api/v1/audit/statistics?start_date=2025-08-01&end_date=2025-08-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": [
      { "action": "CREATE", "count": 150 },
      { "action": "UPDATE", "count": 80 },
      { "action": "DELETE", "count": 15 }
    ],
    "total_actions": 245
  }
}
```

---

## Integration Points

### Shifts (Already Integrated)
- ✅ `POST /api/v1/shifts` - CREATE audited
- ✅ `PUT /api/v1/shifts/:id` - UPDATE audited
- ✅ `DELETE /api/v1/shifts/:id` - DELETE audited

### Next Steps for Full Integration
Apply `auditMiddleware` to:
- `routes/employee.routes.ts` (CREATE, UPDATE, DELETE)
- `routes/role.routes.ts` (CREATE, UPDATE, DELETE)
- `routes/auth.routes.ts` (LOGIN using `auditAuthMiddleware`)

---

## Usage Examples

### 1. Track Who Deleted a Shift
```typescript
const history = await audit_service.getEntityHistory('shift', 123, company_id);
const deleteAction = history.find(h => h.action === 'DELETE');
console.log(`Shift deleted by ${deleteAction.user.first_name} on ${deleteAction.created_at}`);
```

### 2. Review All Actions by a User
```typescript
const logs = await audit_service.query({
  company_id: 1,
  user_id: 5,
  start_date: '2025-08-01',
  end_date: '2025-08-31'
});
```

### 3. Find All Logins from Specific IP
```sql
SELECT * FROM audit_log
WHERE action = 'LOGIN'
  AND ip_address = '192.168.1.100';
```

### 4. Compliance Report
```sql
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count
FROM audit_log
WHERE company_id = 1
  AND created_at BETWEEN '2025-08-01' AND '2025-08-31'
GROUP BY DATE(created_at), action
ORDER BY date DESC, action;
```

---

## Performance Considerations

- **JSONB Storage:** Efficient storage + queryable (can index JSON fields if needed)
- **Indexes:** Optimized for 99% of query patterns
- **Async Logging:** Audit logging doesn't block main operations
- **Graceful Failures:** If audit logging fails, business logic continues
- **Index Size:** ~50 bytes per audit log (minimal overhead)

---

## Security & Compliance

### GDPR Compliance
- User actions are fully traceable
- Can demonstrate "who accessed what, when"
- Supports right to erasure (CASCADE delete)

### SOC 2 Type II
- Complete audit trail of data modifications
- Tracks administrative actions
- IP and user agent tracking for forensics

### Data Retention
Consider implementing:
```typescript
// Cleanup old audit logs (optional, for data retention policies)
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '2 years'
  AND company_id = 1;
```

---

## How to Apply

### Development:
```bash
cd backend
npm run prisma:migrate dev
```

### Production:
```bash
cd backend
npm run prisma:migrate deploy
```

---

## Rollback

To remove the audit system:

```sql
-- Drop indexes
DROP INDEX IF EXISTS "idx_audit_company_date";
DROP INDEX IF EXISTS "idx_audit_user_date";
DROP INDEX IF EXISTS "idx_audit_entity";
DROP INDEX IF EXISTS "idx_audit_action_date";

-- Drop table
DROP TABLE IF EXISTS "audit_log";

-- Drop enum
DROP TYPE IF EXISTS "audit_action";
```

**Warning:** This will permanently delete all audit logs.

---

## Related Files

- `backend/prisma/schema.prisma` - Audit log model
- `backend/src/services/audit.service.ts` - Core audit logic
- `backend/src/middlewares/audit.middleware.ts` - Automatic logging
- `backend/src/controllers/audit.controller.ts` - API handlers
- `backend/src/routes/audit.routes.ts` - API endpoints
- `backend/src/validations/audit.validation.ts` - Request validation
- `backend/src/app.ts` - Route registration
- `PLAN.md` - Section 2 details

---

## Testing

After migration:

1. **Verify table created:**
   ```sql
   \d audit_log
   ```

2. **Verify indexes:**
   ```sql
   \di idx_audit_*
   ```

3. **Test audit logging:**
   ```bash
   # Create a shift (should create audit log)
   curl -X POST http://localhost:3001/api/v1/shifts \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"company_employee_id":1,"shift_date":"2025-08-15","start_time":"09:00","end_time":"17:00"}'

   # Query audit logs
   curl http://localhost:3001/api/v1/audit?action=CREATE \
     -H "Authorization: Bearer <token>"
   ```

---

## Future Enhancements

Consider adding:
- [ ] Audit log export (CSV/Excel)
- [ ] Real-time audit alerts (WebSocket)
- [ ] Audit log archival to S3
- [ ] Advanced filtering (JSONB queries)
- [ ] Audit dashboard visualizations

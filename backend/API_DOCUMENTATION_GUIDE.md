# Vibe Calendar API Documentation Guide

Quick guide for accessing and using the Vibe Calendar API documentation.

---

## Table of Contents

- [Viewing Documentation](#viewing-documentation)
- [Using Postman Collection](#using-postman-collection)
- [Error Code Reference](#error-code-reference)
- [Common Workflows](#common-workflows)
- [Time Handling](#time-handling)

---

## Viewing Documentation

### Swagger UI (Interactive)

1. **Start the development server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3001/api/docs
   ```

3. **Features:**
   - Browse all endpoints
   - Try API calls directly from browser
   - View request/response examples
   - See error code documentation
   - Test authentication

### OpenAPI Spec (YAML)

**File:** `backend/src/docs/openapi.yaml`

- Machine-readable API specification
- Can be imported into API tools
- Used to generate Postman collection

---

## Using Postman Collection

### Generate Collection

```bash
cd backend
npm run docs:postman
```

**Output:** `backend/vibe-calendar-postman-collection.json`

### Import into Postman

1. Open Postman
2. Click **Import** button
3. Select `vibe-calendar-postman-collection.json`
4. Collection appears in left sidebar

### Setup Authentication

**Option 1: Register New User**
1. Send `POST /auth/register` request
2. Copy `token` from response
3. Set collection variable `jwt_token` = copied token

**Option 2: Login Existing User**
1. Send `POST /auth/login` request
2. Copy `token` from response
3. Set collection variable `jwt_token` = copied token

**Setting Variable:**
- Click on collection name
- Go to **Variables** tab
- Set `jwt_token` current value
- Save

### Make Authenticated Requests

All requests are pre-configured with Bearer token authentication using the `jwt_token` variable.

Just send requests normally after setting the token!

---

## Error Code Reference

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "metadata": { /* optional context */ }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `EMPLOYEE_NOT_FOUND` | 404 | Employee does not exist |
| `SHIFT_OVERLAP` | 409 | Shift conflicts with existing shift |
| `DUPLICATE_ROLE` | 409 | Role name already exists |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

**Full list:** See `openapi.yaml` ErrorResponse schema (32 error codes total)

### Error Handling Example (Frontend)

```typescript
try {
  const response = await fetch('/api/v1/shifts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shiftData)
  });

  const result = await response.json();

  if (!result.success) {
    // Handle specific errors
    switch (result.error.code) {
      case 'SHIFT_OVERLAP':
        alert(`Shift overlaps with existing shift #${result.error.metadata.existingShift.id}`);
        break;
      case 'VALIDATION_ERROR':
        console.error('Validation errors:', result.error.metadata.issues);
        break;
      case 'UNAUTHORIZED':
        redirectToLogin();
        break;
      default:
        alert(result.error.message);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Common Workflows

### 1. New Company Registration

```
POST /auth/register
{
  "company_name": "Acme Corp",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@acme.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "company_id": 1,
    "user_id": 1,
    "employee_id": 1,
    "role_id": 1
  }
}
```

### 2. Login

```
POST /auth/login
{
  "email": "john@acme.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Use this token in all subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Employee

```
POST /employees
Authorization: Bearer <token>
{
  "email": "employee@acme.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role_id": 2,
  "position": "Cashier"
}
```

### 4. Create Shift

```
POST /shifts
Authorization: Bearer <token>
{
  "company_employee_id": 5,
  "shift_date": "2025-08-25",
  "start_time": "09:00",
  "end_time": "17:00",
  "status": "scheduled"
}
```

### 5. Check for Conflicts

```
POST /shifts/validate-conflicts
Authorization: Bearer <token>
{
  "shifts": [
    {
      "company_employee_id": 5,
      "shift_date": "2025-08-25",
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "hasConflicts": false,
    "conflicts": [],
    "validShifts": 1,
    "conflictCount": 0
  }
}
```

---

## Time Handling

### UTC-Only Policy

**Important:** All times are in UTC format. The backend does NOT perform timezone conversions.

**Format:**
- **Times:** `HH:mm` (e.g., `"14:30"` for 2:30 PM UTC)
- **Dates:** `YYYY-MM-DD` (e.g., `"2025-08-25"`)
- **NO timezone indicators** (no `+00:00`, no `Z`)

**Examples:**

✅ **Correct:**
```json
{
  "shift_date": "2025-08-25",
  "start_time": "14:30",
  "end_time": "22:00"
}
```

❌ **Incorrect:**
```json
{
  "shift_date": "2025-08-25T00:00:00Z",  // ❌ No datetime format
  "start_time": "14:30:00",              // ❌ No seconds
  "end_time": "22:00+00:00"              // ❌ No timezone
}
```

### Frontend Responsibility

**Converting to User's Timezone:**

```typescript
// Backend returns UTC time
const utcTime = "14:30"; // 2:30 PM UTC

// Convert to user's timezone for display
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const [hours, minutes] = utcTime.split(':');
const date = new Date();
date.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

const localTime = date.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: userTimezone
});
// Example: "9:30 AM" (if user in EST, UTC-5)
```

**Converting from User's Timezone:**

```typescript
// User selects 9:30 AM in their timezone (EST)
const localTime = "09:30";
const userTimezone = "America/New_York";

// Convert to UTC for backend
const [hours, minutes] = localTime.split(':');
const date = new Date();
date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

const utcHours = date.getUTCHours().toString().padStart(2, '0');
const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');
const utcTime = `${utcHours}:${utcMinutes}`;
// Example: "14:30" (9:30 AM EST → 2:30 PM UTC)
```

---

## Rate Limiting

**Auth Endpoints:**
- `/auth/register`
- `/auth/login`
- **Limit:** 5 requests / 15 minutes

**Bulk Operations:**
- `/shifts/bulk-create`
- `/shifts/bulk`
- **Limit:** 10 requests / minute

**General API:**
- All other endpoints
- **Limit:** 100 requests / minute

**Headers in Response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1629384000
```

**Error Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please slow down.",
    "metadata": {
      "retryAfter": 900
    }
  }
}
```

---

## Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload (varies by endpoint)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "metadata": {
      // Optional contextual information
    }
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Authentication

### JWT Token Structure

**Payload:**
```json
{
  "user_id": 1,
  "admin_company_id": 1,
  "user_type": "admin",
  "iat": 1629384000,
  "exp": 1629412800
}
```

**Validity:** 8 hours

**Usage in Requests:**
```
Authorization: Bearer <token>
```

### Protected Routes

Most endpoints require authentication. Exceptions:

**Public Endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `GET /health`

**Admin-Only Endpoints:**
- All `/shifts/*` endpoints
- All `/employees/*` endpoints
- All `/roles/*` endpoints
- All `/shift-templates/*` endpoints
- All `/companies/settings/*` endpoints
- All `/audit/*` endpoints

---

## Helpful Commands

### Backend

```bash
# Start development server
npm run dev

# Generate Postman collection
npm run docs:postman

# Run tests
npm test

# View database in Prisma Studio
npm run db:studio
```

### Testing

```bash
# Health check
curl http://localhost:3001/api/v1/health

# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test","first_name":"John","last_name":"Doe","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

---

## Support

### Documentation Issues

If you find issues with the API documentation:

1. Check `openapi.yaml` for accuracy
2. Regenerate Postman collection: `npm run docs:postman`
3. Review `OPENAPI_IMPROVEMENTS.md` for details
4. Contact backend team

### API Issues

For API bugs or unexpected behavior:

1. Check error response for `error.code`
2. Review error documentation in Swagger UI
3. Check `backend/src/errors/` for error definitions
4. Review `backend/src/middlewares/error_handler.ts`

---

## Additional Resources

- **Full OpenAPI Spec:** `backend/src/docs/openapi.yaml`
- **Implementation Details:** `backend/OPENAPI_IMPROVEMENTS.md`
- **Error Classes:** `backend/src/errors/`
- **PLAN.md Section 19:** Lines 770-793

---

**Last Updated:** 2025-10-18
**API Version:** 1.0.0

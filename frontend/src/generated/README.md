# Generated Types

This directory contains auto-generated TypeScript types from the backend OpenAPI/Swagger specification.

## ⚠️ DO NOT EDIT FILES IN THIS DIRECTORY

All files in this directory are automatically generated and will be overwritten.

## Type Generation

Types are generated from the backend Swagger documentation using `openapi-typescript`.

### Manual Generation

To manually generate types (requires backend running on port 3001):

```bash
npm run generate:types
```

### Production Generation

For production builds with custom backend URL:

```bash
BACKEND_URL=https://api.example.com npm run generate:types:prod
```

### Automatic Generation

Types are automatically generated before each build via the `prebuild` script.

## Generated Files

- `api.types.ts` - Complete API type definitions from OpenAPI spec

## Usage

Import types in your code:

```typescript
import type { paths, components } from '@/generated/api.types';

// Example: Get response type for a specific endpoint
type EmployeeListResponse = paths['/api/v1/employee']['get']['responses']['200']['content']['application/json'];

// Example: Get schema type for a component
type Employee = components['schemas']['Employee'];
```

## Troubleshooting

### Generation Fails

**Problem:** `npm run generate:types` fails

**Solutions:**
1. Ensure backend is running on port 3001
2. Verify backend Swagger is accessible at `http://localhost:3001/api/docs/swagger.json`
3. Check backend logs for Swagger generation errors

### Types Out of Sync

**Problem:** Generated types don't match current backend

**Solution:** Regenerate types:
```bash
npm run generate:types
```

### Build Fails Due to Missing Types

**Problem:** Build fails because `api.types.ts` doesn't exist

**Solution:**
1. Start backend server
2. Run `npm run generate:types`
3. Retry build

The `prebuild` script will attempt automatic generation but won't fail the build if types can't be generated.

## Notes

- Types are generated from the runtime Swagger spec, not the source code
- Ensure backend endpoints are registered with Swagger decorators
- Keep backend running during development for automatic regeneration
- Generated types include all endpoints, schemas, and parameters
- Use generated types to ensure frontend-backend type safety

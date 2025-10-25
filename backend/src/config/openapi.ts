import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { join } from 'path';

/**
 * OpenAPI/Swagger configuration using swagger-jsdoc
 * This automatically reads @openapi comments from route files
 */

// Base OpenAPI definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vibe Calendar API',
    version: '1.0.0',
    description: `
**Vibe Calendar** is a modern employee shift management system that enables companies to efficiently plan weekly shifts, manage employees and roles, and track work patterns with an intuitive interface.

## Features
- 🔐 JWT-based authentication
- 👥 Multi-tenant company management
- 📅 Advanced shift scheduling with conflict detection
- 📊 Pattern learning for smart shift suggestions
- 📋 Reusable shift templates
- 🎯 Role-based access control
- 📝 Comprehensive audit logging

## Base URL
All API endpoints are prefixed with \`/api/v1\`

## Authentication
Most endpoints require authentication via JWT Bearer token. Obtain a token by logging in via \`/auth/login\`.

Include the token in requests as:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
- **Auth endpoints**: 5 requests / 15 minutes
- **Bulk operations**: 10 requests / minute
- **General API**: 100 requests / minute

## Response Format
All responses follow a standard format:

**Success Response:**
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "metadata": { ... }
  }
}
\`\`\`

## Time Handling - UTC ONLY
- All time values are in **UTC format** (HH:mm, e.g., "14:30")
- Frontend is responsible for timezone conversions
- Backend NEVER performs timezone conversions
- Dates are in ISO 8601 format (YYYY-MM-DD)
    `,
    contact: {
      name: 'Vibe Calendar Support',
      email: 'support@vibecalendar.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Local development server',
    },
    {
      url: 'https://api.vibecalendar.com/api/v1',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health monitoring' },
    { name: 'Auth', description: 'Authentication and registration endpoints' },
    { name: 'Employees', description: 'Employee management operations' },
    { name: 'Roles', description: 'Company role management' },
    { name: 'Shifts', description: 'Shift scheduling and management' },
    { name: 'Shift Templates', description: 'Reusable shift templates' },
    { name: 'Company Settings', description: 'Company-wide configuration settings' },
    { name: 'Audit', description: 'Audit log queries and analytics' },
    { name: 'Statistics', description: 'Dashboard statistics and analytics' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authorization token obtained from /auth/login or /auth/register',
      },
    },
    schemas: {
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                description: 'Machine-readable error code',
                enum: [
                  // Authentication errors
                  'EMAIL_ALREADY_EXISTS',
                  'INVALID_CREDENTIALS',
                  'UNAUTHORIZED',
                  'FORBIDDEN',
                  'TOKEN_EXPIRED',
                  'INVALID_TOKEN',
                  // Employee errors
                  'EMPLOYEE_NOT_FOUND',
                  'EMPLOYEE_ALREADY_EXISTS',
                  'UNAUTHORIZED_COMPANY_ACCESS',
                  // Shift errors
                  'SHIFT_NOT_FOUND',
                  'SHIFT_OVERLAP',
                  'SHIFT_DUPLICATE_EXACT',
                  'INVALID_TIME_FORMAT',
                  'INVALID_START_TIME_FORMAT',
                  'INVALID_END_TIME_FORMAT',
                  'OVERNIGHT_NOT_ALLOWED',
                  'DUPLICATION_CONFLICTS_DETECTED',
                  'BULK_CREATION_CONFLICTS_DETECTED',
                  'UNAUTHORIZED_SHIFT_ACCESS',
                  'UNAUTHORIZED_OR_INVALID_IDS',
                  // Role errors
                  'DUPLICATE_ROLE',
                  'ROLE_NOT_FOUND',
                  'ROLE_HAS_EMPLOYEES',
                  // Template errors
                  'DUPLICATE_TEMPLATE_NAME',
                  'TEMPLATE_NOT_FOUND',
                  // Database errors
                  'UNIQUE_CONSTRAINT_VIOLATION',
                  'FOREIGN_KEY_CONSTRAINT',
                  // General errors
                  'VALIDATION_ERROR',
                  'NOT_FOUND',
                  'BAD_REQUEST',
                  'TOO_MANY_REQUESTS',
                  'INTERNAL_SERVER_ERROR',
                ],
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
              },
              metadata: {
                type: 'object',
                description: 'Additional error context',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    responses: {
      // Reusable error responses
      Unauthorized: {
        description: 'Unauthorized - Missing or invalid JWT token',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            examples: {
              missing_token: {
                summary: 'Missing authorization token',
                value: {
                  success: false,
                  error: {
                    code: 'UNAUTHORIZED',
                    message: 'No authorization token provided',
                  },
                },
              },
              invalid_token: {
                summary: 'Invalid or expired token',
                value: {
                  success: false,
                  error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired JWT token',
                  },
                },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You do not have permission to access this resource',
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'The requested resource was not found',
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                metadata: {
                  issues: [
                    {
                      path: ['email'],
                      message: 'Invalid email format',
                    },
                    {
                      path: ['password'],
                      message: 'Password must be at least 8 characters',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      ConflictError: {
        description: 'Conflict - Resource already exists or conflicts with existing data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            examples: {
              shift_overlap: {
                summary: 'Shift overlaps with existing shift',
                value: {
                  success: false,
                  error: {
                    code: 'SHIFT_OVERLAP',
                    message: 'Shift overlaps with an existing shift',
                    metadata: {
                      employeeId: 5,
                      date: '2025-10-20',
                      existingShift: {
                        id: 42,
                        start_time: '09:00',
                        end_time: '17:00',
                      },
                    },
                  },
                },
              },
              duplicate: {
                summary: 'Duplicate resource',
                value: {
                  success: false,
                  error: {
                    code: 'EMPLOYEE_ALREADY_EXISTS',
                    message: 'Employee already exists in this company',
                  },
                },
              },
            },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Too many requests - Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                code: 'TOO_MANY_REQUESTS',
                message: 'Rate limit exceeded. Please try again later',
                metadata: {
                  retryAfter: 60,
                  limit: 100,
                  window: '1 minute',
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// swagger-jsdoc options
const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Path to route files with @openapi comments
  apis: [
    join(__dirname, '../routes/*.ts'),      // All route files
    join(__dirname, '../routes/*.js'),      // Compiled JS files (for production)
    join(__dirname, '../app.ts'),           // Health check endpoint
    join(__dirname, '../app.js'),           // Compiled app.js
  ],
};

/**
 * Generate OpenAPI specification from JSDoc comments
 */
export const openAPISpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI configuration options
 * Following best practices for API documentation
 */
const swaggerUIOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Vibe Calendar API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
  },
};

/**
 * Swagger UI Express middleware array
 * Usage: app.use('/api/docs', ...swaggerUIMiddleware)
 */
export const swaggerUIMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(openAPISpec, swaggerUIOptions),
];

/**
 * Export OpenAPI JSON endpoint handler
 * Usage: app.get('/api/docs/openapi.json', openAPIJSONHandler)
 */
export const openAPIJSONHandler = (_req: any, res: any) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openAPISpec);
};

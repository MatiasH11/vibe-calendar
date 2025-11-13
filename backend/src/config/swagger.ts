import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { join } from 'path';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vibe Calendar API',
    version: '1.0.0',
    description: 'Employee shift management system API',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Audit', description: 'Audit log endpoints' },
    { name: 'Company', description: 'Company management endpoints' },
    { name: 'user', description: 'User management endpoints' },
    { name: 'company_settings', description: 'Company settings endpoints' },
    { name: 'department', description: 'Department management endpoints' },
    { name: 'employee', description: 'Employee management endpoints' },
    { name: 'shift', description: 'Shift management endpoints' },
    { name: 'shift_template', description: 'Shift template endpoints' },
    { name: 'job_position', description: 'Job position management endpoints' },
    { name: 'scheduling_batch', description: 'Scheduling batch management endpoints' },
    { name: 'shift_requirement', description: 'Shift requirement management endpoints' },
    { name: 'day_template', description: 'Day template management (shift schedules)' },
    { name: 'template_shift', description: 'Template shift details with time and requirements' },
    { name: 'template_shift_position', description: 'Position requirements for template shifts' },
    { name: 'shift_assignment', description: 'Shift assignments with validation and confirmation' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from login',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    join(__dirname, '../routes/*.ts'),
    join(__dirname, '../routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUIMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Vibe Calendar API',
  }),
];

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

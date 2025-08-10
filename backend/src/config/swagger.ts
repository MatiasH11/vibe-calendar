import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.1',
  info: {
    title: 'Calendar Shift API',
    version: 'v1',
    description: 'API documentation for Calendar Shift',
  },
  servers: [
    { url: '/api/v1', description: 'Base path' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      standard_response: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: {
            type: 'object',
            properties: {
              error_code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  page_size: { type: 'integer' },
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['src/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
export const swaggerUiMiddleware = [swaggerUi.serve, swaggerUi.setup(swaggerSpec) as any];



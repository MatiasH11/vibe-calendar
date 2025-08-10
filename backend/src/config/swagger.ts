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
      auth_register_body: {
        type: 'object',
        required: ['company_name', 'first_name', 'last_name', 'email', 'password'],
        properties: {
          company_name: { type: 'string', example: 'Test Company' },
          first_name: { type: 'string', example: 'Matias' },
          last_name: { type: 'string', example: 'Hidalgo' },
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'Chatwoot1!' },
        },
      },
      auth_login_body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'Chatwoot1!' },
        },
      },
      role: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          company_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Waiter' },
          description: { type: 'string', example: 'Service staff' },
          color: { type: 'string', example: '#FFFFFF' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
      },
      user_public: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 10 },
          first_name: { type: 'string', example: 'Emp' },
          last_name: { type: 'string', example: 'One' },
          email: { type: 'string', example: 'emp1@example.com' },
        },
      },
      employee: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          company_id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 10 },
          role_id: { type: 'integer', example: 2 },
          position: { type: 'string', example: 'Staff' },
          is_active: { type: 'boolean', example: true },
          user: { $ref: '#/components/schemas/user_public' },
          role: { $ref: '#/components/schemas/role' },
        },
      },
      create_shift_body: {
        type: 'object',
        required: ['company_employee_id', 'shift_date', 'start_time', 'end_time'],
        properties: {
          company_employee_id: { type: 'integer', example: 5 },
          shift_date: { type: 'string', example: '2025-08-11' },
          start_time: { type: 'string', example: '09:00' },
          end_time: { type: 'string', example: '13:00' },
          notes: { type: 'string', example: 'Morning shift' },
        },
      },
      update_shift_body: {
        type: 'object',
        properties: {
          company_employee_id: { type: 'integer', example: 5 },
          shift_date: { type: 'string', example: '2025-08-12' },
          start_time: { type: 'string', example: '13:00' },
          end_time: { type: 'string', example: '17:00' },
          notes: { type: 'string', example: 'Afternoon shift' },
        },
      },
      shift: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          company_employee_id: { type: 'integer', example: 5 },
          shift_date: { type: 'string', example: '2025-08-11' },
          start_time: { type: 'string', example: '09:00' },
          end_time: { type: 'string', example: '13:00' },
          notes: { type: 'string', example: 'Morning shift' },
          status: { type: 'string', example: 'confirmed' },
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



import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';

/**
 * Load OpenAPI specification from YAML file
 * Using YAML for better readability and maintainability
 */
const loadOpenAPISpec = () => {
  try {
    const openAPIPath = join(__dirname, '../docs/openapi.yaml');
    const fileContents = readFileSync(openAPIPath, 'utf8');
    const openAPISpec = YAML.parse(fileContents);

    return openAPISpec;
  } catch (error) {
    console.error('Error loading OpenAPI specification:', error);
    throw new Error('Failed to load API documentation');
  }
};

/**
 * OpenAPI specification object
 */
export const openAPISpec = loadOpenAPISpec();

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

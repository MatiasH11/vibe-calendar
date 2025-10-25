import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/environment';
import { prisma } from './config/prisma_client';
import { HTTP_CODES } from './constants/http_codes';
import { error_handler } from './middlewares/error_handler';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';
import { swaggerUIMiddleware, openAPIJSONHandler } from './config/openapi';
import { logger, morganStream } from './utils/logger';
import authRouter from './routes/auth.routes';
import roleRouter from './routes/role.routes';
import employeeRouter from './routes/employee.routes';
import shiftRouter from './routes/shift.routes';
import shiftTemplateRouter from './routes/shift-template.routes';
import statisticsRouter from './routes/statistics.routes';
// NEW: Audit routes (PLAN.md 2.3)
import auditRouter from './routes/audit.routes';
// NEW: Company Settings routes (PLAN.md 5.3)
import companySettingsRouter from './routes/company-settings.routes';

const app: Express = express();

// Request ID middleware (for tracing)
app.use((req, res, next) => {
  (req as any).id = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).id);
  next();
});

// Middlewares
app.use(cors({
  origin: '*', // En producción, especificar dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// HTTP request logging with Winston
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Log application startup
logger.info('Vibe Calendar API starting', {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
});

// Rate limiting for API routes
app.use('/api/', apiRateLimiter);

// OpenAPI Documentation
app.use('/api/docs', ...swaggerUIMiddleware);
app.get('/api/docs/openapi.json', openAPIJSONHandler);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Check the health status of the API and its dependencies (database).
 *       Returns 200 OK if all services are healthy, 500 if any service is degraded.
 *
 *       **Use cases:**
 *       - Kubernetes liveness/readiness probes
 *       - Monitoring systems (Datadog, New Relic, etc.)
 *       - Load balancer health checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok]
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-20T01:30:00.000Z"
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       enum: [up]
 *                       example: up
 *                     database:
 *                       type: string
 *                       enum: [up, down]
 *                       example: up
 *             examples:
 *               healthy:
 *                 summary: All services healthy
 *                 value:
 *                   status: ok
 *                   timestamp: "2025-10-20T01:30:00.000Z"
 *                   services:
 *                     api: up
 *                     database: up
 *       500:
 *         description: System is degraded (database unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       enum: [up]
 *                     database:
 *                       type: string
 *                       enum: [down]
 *             example:
 *               status: ok
 *               timestamp: "2025-10-20T01:30:00.000Z"
 *               services:
 *                 api: up
 *                 database: down
 */
app.get('/api/v1/health', async (req: Request, res: Response) => {
  const dbStatus = await (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch (e) {
      return 'down';
    }
  })();

  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'up',
      database: dbStatus,
    },
  } as const;

  const statusCode = dbStatus === 'up' ? HTTP_CODES.OK : HTTP_CODES.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json(healthCheck);
});

// Register application routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/shifts', shiftRouter);
app.use('/api/v1/shift-templates', shiftTemplateRouter);
app.use('/api/v1/statistics', statisticsRouter);
// NEW: Audit routes (PLAN.md 2.3)
app.use('/api/v1/audit', auditRouter);
// NEW: Company Settings routes (PLAN.md 5.3)
app.use('/api/v1/companies/settings', companySettingsRouter);

// Global Error Handler (debe ser el último middleware)
app.use(error_handler);

export default app;



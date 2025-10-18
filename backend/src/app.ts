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

// Health Check Endpoint
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

// Global Error Handler (debe ser el último middleware)
app.use(error_handler);

export default app;



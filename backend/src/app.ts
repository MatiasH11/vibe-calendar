import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/environment';
import { prisma } from './config/prisma_client';
import { HTTP_CODES } from './constants/http_codes';
import { error_handler } from './middlewares/error_handler';
import { swaggerUIMiddleware } from './config/swagger';
import authRouter from './routes/auth.routes';
import auditRouter from './routes/audit.routes';
import companyRouter from './routes/company.routes';
import userRouter from './routes/user.routes';
import companySettingsRouter from './routes/company_settings.routes';
import locationRouter from './routes/location.routes';
import departmentRouter from './routes/department.routes';
import employeeRouter from './routes/employee.routes';
import shiftTemplateRouter from './routes/shift_template.routes';
import shiftRouter from './routes/shift.routes';
import jobPositionRouter from './routes/job_position.routes';
import schedulingBatchRouter from './routes/scheduling_batch.routes';
import shiftRequirementRouter from './routes/shift_requirement.routes';

const app: Express = express();

// Middlewares
app.use(cors({
  origin: '*', // En producción, especificar dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Health check endpoint
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
    environment: env.NODE_ENV || 'development',
    services: {
      api: 'up',
      database: dbStatus,
    },
  };

  const statusCode = dbStatus === 'up' ? HTTP_CODES.OK : HTTP_CODES.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json(healthCheck);
});

// Swagger API Documentation
app.use('/api/docs', ...swaggerUIMiddleware);

// Register application routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/company', companyRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/company_settings', companySettingsRouter);
app.use('/api/v1/location', locationRouter);
app.use('/api/v1/department', departmentRouter);
app.use('/api/v1/employee', employeeRouter);
app.use('/api/v1/shift_template', shiftTemplateRouter);
app.use('/api/v1/shift', shiftRouter);
app.use('/api/v1/job-positions', jobPositionRouter);
app.use('/api/v1/scheduling-batches', schedulingBatchRouter);
app.use('/api/v1/shift-requirements', shiftRequirementRouter);

// 404 Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global Error Handler (debe ser el último middleware)
app.use(error_handler);

export default app;



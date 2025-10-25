import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/environment';
import { prisma } from './config/prisma_client';
import { HTTP_CODES } from './constants/http_codes';
import { error_handler } from './middlewares/error_handler';
import authRouter from './routes/auth.routes';
import auditRouter from './routes/audit.routes';

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

// Register application routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/audit', auditRouter);

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



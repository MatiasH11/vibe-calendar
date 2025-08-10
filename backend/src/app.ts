import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/environment';
import { prisma } from './config/prisma_client';
import { HTTP_CODES } from './constants/http_codes';
import { error_handler } from './middlewares/error_handler';
import { swaggerUiMiddleware } from './config/swagger';
import authRouter from './routes/auth.routes';

const app: Express = express();

// Middlewares
app.use(cors({
  origin: '*', // En producción, especificar dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger Docs
app.use('/api/docs', ...swaggerUiMiddleware);

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

// Registrar aquí las rutas de la aplicación (ej. /api/v1/auth, /api/v1/roles, ...)
app.use('/api/v1/auth', authRouter);

// Global Error Handler (debe ser el último middleware)
app.use(error_handler);

export default app;



import winston from 'winston';
import { env } from '../config/environment';

const logLevel = env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug');

// Define custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'vibe-calendar-api' },
  transports: [
    // Console transport with different format for development
    new winston.transports.Console({
      format: env.NODE_ENV === 'production' ? customFormat : consoleFormat,
    }),
  ],
});

// Add file transports in production
if (env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create a stream object with a 'write' function for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logRequest = (req: any, additionalInfo?: Record<string, any>) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userId: req.user?.user_id,
    companyId: req.user?.company_id,
    ...additionalInfo,
  });
};

export const logResponse = (req: any, res: any, responseTime?: number) => {
  logger.info('Outgoing response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userId: req.user?.user_id,
    companyId: req.user?.company_id,
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Error occurred', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logDatabaseQuery = (query: string, duration?: number) => {
  logger.debug('Database query', {
    query,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export const logServiceCall = (service: string, method: string, params?: any) => {
  logger.debug('Service call', {
    service,
    method,
    params,
  });
};

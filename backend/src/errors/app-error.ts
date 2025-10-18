/**
 * Base class for all application errors
 * Extends Error to provide consistent error handling across the application
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly metadata?: Record<string, any>;
  readonly isOperational: boolean = true;

  constructor(message: string, metadata?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.metadata && { metadata: this.metadata }),
    };
  }
}

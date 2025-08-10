### **`02_PROMPT_BACKEND_CONFIGURACION_PRODUCCION_v2.md`**

```markdown
# Prompt: Configuración de Backend Nivel Producción, v2 (TypeScript, Prisma, Zod, SRP)

Actúa como un arquitecto de software y desarrollador principal (Lead Developer). Tu tarea es generar la configuración inicial completa para el proyecto "Calendar Shift", siguiendo los más altos estándares de calidad, seguridad y mantenibilidad.

## Principios de Diseño Obligatorios

1.  **Principio de Responsabilidad Única (SRP):** Separación estricta en capas (Rutas, Validación, Controladores, Servicios).
2.  **Seguridad de Tipos Integral:** Uso de TypeScript con tipos e interfaces personalizadas.
3.  **Defensa en Profundidad:** Múltiples capas de validación y seguridad.
4.  **Preparado para Testing:** La estructura debe facilitar las pruebas.
5.  **Manejo de Errores Robusto:** Implementación de un sistema centralizado de manejo de errores.

## Instrucciones Detalladas

### 1. Genera la Estructura de Carpetas Completa
Crea la siguiente estructura de carpetas:
```
/backend
├── /prisma
│   └── schema.prisma
├── /src
│   ├── /config
│   ├── /constants
│   ├── /controllers
│   ├── /middlewares
│   ├── /routes
│   ├── /services
│   ├── /types
│   ├── /utils
│   └── /validations
├── .env
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── tsconfig.json
```

### 2. Crea el `package.json` y `jest.config.js`
**A. `package.json`:**
```json
{
  "name": "calendar-shift-backend",
  "version": "1.0.0",
  "description": "Backend for Calendar Shift application",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "build": "tsc",
    "dev": "nodemon --watch 'src/**/*.ts' --ignore '**/*.test.ts' --exec 'ts-node --transpile-only' src/app.ts",
    "test": "jest --detectOpenHandles --runInBand",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "postinstall": "tsc && prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.1",
    "morgan": "^1.10.0",
    "pg": "^8.11.1",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.3",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/morgan": "^1.9.4",
    "@types/node": "^20.4.5",
    "@types/supertest": "^2.0.12",
    "jest": "^29.6.1",
    "nodemon": "^3.0.1",
    "prisma": "^5.0.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
```
**B. `jest.config.js`:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['dotenv/config'],
};
```

### 3. Crea el `tsconfig.json` y `.gitignore`
**A. `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "typeRoots": ["./src/types", "./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```
**B. `.gitignore`:**
```
# Dependencies
/node_modules

# Build output
/dist

# Environment variables
.env
.env.test

# Logs
*.log
```

### 4. Configura y Valida el Entorno
**A. `.env.example`:**
```
PORT=3001
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/calendar_shift_db"
JWT_SECRET="your_super_secret_key_for_jwt"
NODE_ENV="development"
```
**B. `src/config/environment.ts`:**
```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  JWT_SECRET: z.string().min(1, { message: 'JWT_SECRET is required' }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

### 5. Configura Prisma y Constantes
**A. `prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
**B. `src/config/prismaClient.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```
**C. `src/constants/httpCodes.ts`:**
```typescript
export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
```
**D. `src/constants/auth.ts`:**
```typescript
export const AUTH_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 10,
  JWT_EXPIRATION: '8h',
};
```

### 6. Crea los Middlewares Centrales
**A. `src/middlewares/validation.middleware.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { HTTP_CODES } from '../constants/httpCodes';

const formatZodError = (error: ZodError) => {
  return error.issues.map(issue => ({
    message: issue.message,
    path: issue.path.join('.'),
  }));
};

const validate = (schema: ZodSchema, data: any) => {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof ZodError) {
      return { status: HTTP_CODES.BAD_REQUEST, errors: formatZodError(error) };
    }
    throw error;
  }
};

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const error = validate(schema, req.body);
  if (error) {
    return res.status(error.status).json({ errors: error.errors });
  }
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const error = validate(schema, req.query);
  if (error) {
    return res.status(error.status).json({ errors: error.errors });
  }
  next();
};
```
**B. `src/middlewares/errorHandler.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { HTTP_CODES } from '../constants/httpCodes';
import { env } from '../config/environment';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
  const message = 'An unexpected error occurred.';

  const errorResponse = env.NODE_ENV === 'development'
    ? { message, error: err.message, stack: err.stack }
    : { message };

  res.status(statusCode).json(errorResponse);
};
```

### 7. Define los Tipos Personalizados
**`src/types/jwt.types.ts`:**
```typescript
export interface JwtPayload {
  userId: number;
  companyId: number;
  employeeId: number; // ID de la tabla company_employees
  roleId: number;
}
```

### 8. Configura el Servidor Express (`src/app.ts`)
```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/environment';
import { prisma } from './config/prismaClient';
import { HTTP_CODES } from './constants/httpCodes';
import { errorHandler } from './middlewares/errorHandler';

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

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
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
  };

  const statusCode = dbStatus === 'up' ? HTTP_CODES.OK : HTTP_CODES.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json(healthCheck);
});

// Registrar aquí las rutas de la aplicación (ej. /api/auth, /api/users)


// Global Error Handler (debe ser el último middleware)
app.use(errorHandler);

export default app;
```

### 9. Punto de Entrada para Iniciar el Servidor (`src/server.ts`)
```typescript
import app from './app';
import { env } from './config/environment';

const server = app.listen(env.PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${env.PORT}`);
});

export default server;
```
**Nota:** Modifica el script `"dev"` en `package.json` para apuntar a `src/server.ts` en lugar de `src/app.ts`.

## Salida Esperada
Un conjunto completo de archivos que establecen una base de proyecto robusta, segura y escalable, lista para construir sobre ella.
```
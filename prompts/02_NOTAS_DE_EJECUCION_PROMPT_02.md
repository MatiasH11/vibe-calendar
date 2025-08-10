### 021_NOTAS_DE_EJECUCION_PROMPT_02

Propósito: Guía breve para ejecutar el Prompt 02 (backend inicial) sin errores en Windows, con PostgreSQL en Docker y Prisma.

Requisitos
- Docker Desktop (WSL2 recomendado)
- Node.js 18+ y npm

1) Base de datos con Docker Compose
- Archivo: `db/docker-compose.yml` ya incluido. Usar volumen nombrado para evitar issues con OneDrive.
- Crear `db/.env` con:
```
POSTGRES_DB=calendar_shift_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```
- Comandos (PowerShell):
```
cd db
docker compose --env-file .env up -d
docker compose ps
```
- Si el puerto 5432 está ocupado, cambia a `"15432:5432"` en `docker-compose.yml` y ajusta `DATABASE_URL`.

2) Configurar backend (.env)
- Crear `backend/.env`:
```
PORT=3001
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/calendar_shift_db"
JWT_SECRET="your_super_secret_key_for_jwt"
NODE_ENV="development"
```

3) Instalar dependencias y tipos necesarios
```
cd backend
npm install
npm i -D @types/swagger-jsdoc @types/swagger-ui-express
```

4) Ajuste TypeScript para evitar error de supertest
- En `backend/tsconfig.json` agrega:
```
"types": ["node", "jest"]
```
- Si luego usas Supertest en tests: `"types": ["node", "jest", "supertest"]`.

5) Script dev compatible con Windows (PowerShell)
- En `backend/package.json` usar:
```
"dev": "nodemon --watch src --ext ts,json --ignore \"**/*.test.ts\" --exec \"ts-node --transpile-only\" src/server.ts"
```

6) Prisma (migraciones)
```
npm run prisma:generate
npm run prisma:migrate
```

7) Arrancar el servidor
```
npm run dev
```

Validaciones
- Health: `GET http://localhost:3001/api/v1/health` (debe mostrar database: up)
- Swagger: `http://localhost:3001/api/docs`

Errores comunes y solución rápida
- 'ts-node' is not recognized: usa el script `dev` con comillas escapadas (ver paso 5).
- Cannot find type definition file for 'supertest': agrega `"types": ["node", "jest"]` (o instala `@types/supertest` y añádelo).
- PowerShell no soporta `&&` ni `| cat`: separa con `;` y evita `cat`.
- DB no healthy aún: espera unos segundos y reintenta.
- Puertos ocupados: cambia el mapeo en Docker Compose y `PORT`/`DATABASE_URL`.

Notas
- `shift.start_time` y `shift.end_time` usan tipo TIME nativo de Postgres.
- Se usa volumen nombrado en Docker para datos de Postgres.



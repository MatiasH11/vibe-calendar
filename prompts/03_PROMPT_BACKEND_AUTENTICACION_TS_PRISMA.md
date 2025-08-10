### **Archivo 4: `03_PROMPT_BACKEND_AUTENTICACION_TS_PRISMA.md`**

**Propósito:** La versión definitiva del prompt de autenticación. Incluye manejo de casos límite, una estrategia de testing clara y la **definición explícita de tipos de TypeScript** para las solicitudes, garantizando una seguridad de tipos completa.

```markdown
# Prompt: Implementación de Endpoints de Autenticación con Arquitectura Robusta, v3

Actúa como un desarrollador de backend senior y arquitecto de software. Basándote en la configuración de producción del proyecto "Calendar Shift", tu tarea es implementar un sistema de autenticación completo, a prueba de fallos, testeable y **fuertemente tipado**.

## Objetivo
Crear los endpoints `POST /api/v1/auth/register` y `POST /api/v1/auth/login`, asegurando un manejo explícito de casos límite, directrices de testing y una clara definición de tipos para los datos de entrada.

## Instrucciones Detalladas

### 1. Define los Esquemas de Validación y sus Tipos (Capa de Validación)

En el directorio `src/validations/`, crea el archivo `auth.validation.ts`.

*   **Esquemas Zod:**
    *   **`registerSchema`:** Define el esquema Zod para el `body` de la solicitud de registro (`company_name`, `first_name`, `last_name`, `email`, `password`).
    *   **`loginSchema`:** Define el esquema Zod para el `body` de la solicitud de inicio de sesión (`email`, `password`).
*   **Tipos TypeScript (NUEVO):**
    *   Usando la utilidad `z.infer<typeof schema>`, genera y exporta los tipos de TypeScript correspondientes para los datos validados.
    *   `export type register_body = z.infer<typeof registerSchema>;`
    *   `export type login_body = z.infer<typeof loginSchema>;`

### 2. Crea el Servicio de Autenticación (Capa de Servicio)

En `src/services/`, crea el archivo `auth.service.ts`. Los métodos de este servicio deben usar los nuevos tipos en sus firmas para máxima claridad y seguridad.

*   **`register(data: register_body)`:**
    1.  Recibe un objeto `data` que se adhiere al tipo `register_body`.
    2.  **Validación Previa:** Antes de la transacción, verifica la existencia de `user` por email y `company` por nombre. Lanza errores con mensajes específicos (`EMAIL_ALREADY_EXISTS`, `COMPANY_NAME_ALREADY_EXISTS`).
    3.  Encripta la contraseña.
    4.  **Transacción Atómica de Prisma (`prisma.$transaction`):**
        *   Dentro de un bloque `try...catch` para manejar errores de conexión. Si falla, lanza `Error('TRANSACTION_FAILED')`.
        *   Crea las entidades `company`, `user`, `role` y `company_employees`.
    5.  Devuelve un objeto de éxito.

*   **`login(data: login_body)`:**
    1.  Recibe un objeto `data` del tipo `login_body`.
    2.  Busca al `user`. Si no existe o la contraseña es incorrecta, lanza `Error('INVALID_CREDENTIALS')`.
    3.  **Manejo de Caso Límite:** Busca el registro en `company_employees`. Si no existe, lanza `Error('USER_NOT_ASSOCIATED_WITH_COMPANY')`.
    4.  Crea el `payload` (usando `jwt_payload`) y firma el token.
    5.  Devuelve el token.

### 3. Crea el Controlador de Autenticación (Capa de Controlador)

En `src/controllers/`, crea el archivo `auth.controller.ts`.

*   **Tipado en los Handlers:** Los manejadores deben usar los tipos para el cuerpo de la solicitud para que TypeScript sepa qué hay en `req.body`.
    *   `register_handler(req: Request<{}, {}, register_body>, res: Response)`
    *   `login_handler(req: Request<{}, {}, login_body>, res: Response)`
*   **Manejo de Errores Específico:** En los bloques `catch`, detecta el `error.message` del servicio y responde con el código HTTP apropiado (`400`, `401`, etc.), o pasa el error a `next(error)` para el manejador global.

### 4. Define las Rutas de Autenticación (Capa de Rutas)
(Sin cambios, la definición en `src/routes/auth.routes.ts` es correcta).

### 5. Integra las Rutas en `src/app.ts`
(Sin cambios, el registro del router en `app.ts` es correcto).

### 6. Estrategia de Testing (Guía para el Desarrollo)
(Sin cambios, las directrices de testing siguen siendo las mismas, pero ahora los tests también se beneficiarán de los tipos).

### 7. JWT Claims, Contrato de Respuesta y Swagger

- El JWT debe incluir los siguientes claims para reducir accesos a DB en autorización: `user_id`, `company_id`, `employee_id`, `role_id`, `role_name`.
- Todas las respuestas de estos endpoints deben seguir el contrato global `{ success, data, error, meta }` con propiedades internas en snake_case (por ejemplo, `error.error_code`).
- Documenta en Swagger (OpenAPI 3) los endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  Incluyendo esquemas de request/response, códigos de estado (201/200/400/401/409) y seguridad `bearerAuth`.

## Salida Esperada
Genera el contenido completo y actualizado de:
1.  **`src/validations/auth.validation.ts`** (incluyendo los nuevos tipos exportados).
2.  **`src/services/auth.service.ts`** (con las firmas de los métodos tipadas).
3.  **`src/controllers/auth.controller.ts`** (con las firmas de los handlers tipadas).
4.  Una estructura de esqueleto para **`src/__tests__/auth.integration.test.ts`** que sirva como guía.
```
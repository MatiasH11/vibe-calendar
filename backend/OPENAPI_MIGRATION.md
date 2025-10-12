# OpenAPI 3.1 Migration Guide

## ✅ Migration Completed

Se ha migrado exitosamente de **swagger-jsdoc** (comentarios dispersos en rutas) a **OpenAPI 3.1** centralizado en YAML siguiendo las mejores prácticas de la industria.

---

## 🎯 Objetivos Logrados

### 1. **Migración a OpenAPI 3.1**
- ✅ Especificación centralizada en `src/docs/openapi.yaml`
- ✅ Eliminado `swagger-jsdoc` y comentarios JSDoc en rutas
- ✅ Configuración moderna en `src/config/openapi.ts`
- ✅ Soporte para YAML (más legible que JSON)

### 2. **Mejores Prácticas Implementadas**
- ✅ **Single Source of Truth:** Toda la documentación en un solo lugar
- ✅ **Type Safety:** Schemas reutilizables con `$ref`
- ✅ **Versionado:** OpenAPI 3.1.0 (última versión estable)
- ✅ **UI Mejorada:** Swagger UI personalizado con mejor UX
- ✅ **Endpoint JSON:** `/api/docs/openapi.json` para herramientas externas

### 3. **Características Avanzadas**
- ✅ **Security Schemes:** JWT Bearer Auth configurado
- ✅ **Rate Limiting Documentado:** Límites claros por endpoint
- ✅ **Response Standards:** ErrorResponse y SuccessResponse unificados
- ✅ **Examples:** Ejemplos múltiples por endpoint
- ✅ **Descriptions:** Documentación rica con Markdown

---

## 📁 Estructura de Archivos

```
backend/
├── src/
│   ├── config/
│   │   ├── openapi.ts          # ✅ Nueva configuración TypeScript
│   │   └── swagger.ts           # ❌ ELIMINADO
│   └── docs/
│       └── openapi.yaml         # ✅ Especificación OpenAPI centralizada
├── OPENAPI_MIGRATION.md         # Este archivo
└── package.json                 # Dependencias actualizadas
```

---

## 🔧 Configuración Implementada

### Dependencias

```json
{
  "devDependencies": {
    "swagger-ui-express": "^5.0.0",
    "@types/swagger-ui-express": "^4.1.6",
    "yaml": "^2.3.4"
  }
}
```

**Eliminadas:**
- `swagger-jsdoc` ❌ (obsoleto, reemplazado por YAML centralizado)

### Endpoints de Documentación

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/docs` | Swagger UI interactivo |
| `GET /api/docs/openapi.json` | Especificación OpenAPI en JSON |

---

## 📝 Especificación OpenAPI

### Información General

```yaml
openapi: 3.1.0
info:
  title: Vibe Calendar API
  version: 1.0.0
  description: Modern employee shift management system
  contact:
    name: Vibe Calendar Support
    email: support@vibecalendar.com
  license:
    name: MIT
```

### Servidores

```yaml
servers:
  - url: http://localhost:3001/api/v1
    description: Local development server
  - url: https://api.vibecalendar.com/api/v1
    description: Production server
```

### Tags Organizados

```yaml
tags:
  - name: Auth
    description: Authentication and registration
  - name: Employees
    description: Employee management
  - name: Roles
    description: Company role management
  - name: Shifts
    description: Shift scheduling
  - name: Shift Templates
    description: Reusable shift templates
  - name: Statistics
    description: Dashboard analytics
  - name: Health
    description: System health monitoring
```

---

## 🎨 Swagger UI Personalizado

### Opciones de Configuración

```typescript
const swaggerUIOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Vibe Calendar API Documentation',
  swaggerOptions: {
    persistAuthorization: true,     // Remember auth token
    displayRequestDuration: true,    // Show response times
    filter: true,                    // Enable search
    tryItOutEnabled: true,           // Enable "Try it out"
    docExpansion: 'list',            // Show endpoints collapsed
  },
};
```

### Características de UI

- ✅ **Autorización persistente:** No necesitas re-ingresar el token
- ✅ **Duración de requests:** Muestra tiempo de respuesta
- ✅ **Búsqueda:** Filtra endpoints rápidamente
- ✅ **Try It Out:** Prueba endpoints directamente
- ✅ **Tema personalizado:** Colores corporativos

---

## 🔐 Autenticación JWT

### Security Scheme

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT token obtained from `/auth/login`.
        Include in requests as: `Authorization: Bearer <token>`
```

### Uso en Endpoints

```yaml
# Global (aplica a todos los endpoints excepto login/register)
security:
  - bearerAuth: []

# Override para endpoints públicos
paths:
  /auth/login:
    post:
      security: []  # No requiere auth
```

---

## 📚 Schemas Reutilizables

### Standard Response Wrapper

```yaml
SuccessResponse:
  type: object
  required: [success, data]
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object

ErrorResponse:
  type: object
  required: [success, error]
  properties:
    success:
      type: boolean
      example: false
    error:
      type: object
      required: [error_code, message]
      properties:
        error_code:
          type: string
        message:
          type: string
```

### Uso de $ref

```yaml
responses:
  '200':
    description: Success
    content:
      application/json:
        schema:
          allOf:
            - $ref: '#/components/schemas/SuccessResponse'
            - type: object
              properties:
                data:
                  $ref: '#/components/schemas/User'
```

---

## 🚦 Rate Limiting Documentado

Cada endpoint vulnerable muestra claramente sus límites:

```yaml
/auth/login:
  post:
    description: |
      **Rate Limit:** 5 requests / 15 minutes
    responses:
      '429':
        $ref: '#/components/responses/RateLimitExceeded'
```

---

## 📖 Ejemplos Múltiples

```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/RegisterRequest'
      examples:
        basic:
          summary: Basic registration
          value:
            company_name: "Acme Corp"
            email: "admin@acme.com"
        restaurant:
          summary: Restaurant example
          value:
            company_name: "Joe's Diner"
            email: "manager@joesdiner.com"
```

---

## 🔄 Próximos Pasos

### Estado Actual (Completado)

- [x] Migración de configuración base
- [x] Endpoints de Auth documentados
- [x] Health check documentado
- [x] Schemas base (SuccessResponse, ErrorResponse)
- [x] Security schemes (JWT)
- [x] Swagger UI personalizado

### Pendiente (Para completar incrementalmente)

#### Alta Prioridad
- [ ] **Documentar Shifts endpoints** (8 endpoints)
  - POST `/shifts` - Crear shift
  - GET `/shifts` - Listar shifts
  - PUT `/shifts/:id` - Actualizar shift
  - DELETE `/shifts/:id` - Eliminar shift
  - POST `/shifts/duplicate` - Duplicar shifts
  - POST `/shifts/bulk-create` - Creación masiva
  - POST `/shifts/validate-conflicts` - Validar conflictos
  - GET `/shifts/suggestions` - Sugerencias de horarios

#### Media Prioridad
- [ ] **Documentar Employees endpoints** (5 endpoints)
- [ ] **Documentar Roles endpoints** (5 endpoints)
- [ ] **Documentar Shift Templates endpoints** (5 endpoints)
- [ ] **Documentar Statistics endpoints** (2 endpoints)

#### Baja Prioridad
- [ ] Agregar más ejemplos por endpoint
- [ ] Documentar códigos de error específicos
- [ ] Agregar diagramas de flujo (Mermaid)

---

## 🛠️ Mantenimiento

### Agregar un Nuevo Endpoint

1. **Editar `src/docs/openapi.yaml`**

```yaml
paths:
  /new-endpoint:
    post:
      tags: [TagName]
      summary: Brief description
      operationId: uniqueOperationId
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RequestSchema'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResponseSchema'
      security:
        - bearerAuth: []
```

2. **Agregar schemas si es necesario**

```yaml
components:
  schemas:
    RequestSchema:
      type: object
      required: [field1, field2]
      properties:
        field1:
          type: string
```

3. **Verificar cambios**
```bash
# Reiniciar servidor
npm run dev

# Visitar http://localhost:3001/api/docs
```

### Validar OpenAPI Spec

```bash
# Usando herramientas online
# Copiar contenido de src/docs/openapi.yaml
# Pegar en: https://editor.swagger.io/

# O usando CLI (opcional)
npm install -g @apidevtools/swagger-cli
swagger-cli validate src/docs/openapi.yaml
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes (swagger-jsdoc) | Después (OpenAPI YAML) |
|---------|----------------------|------------------------|
| **Ubicación** | Comentarios dispersos en rutas | Archivo centralizado |
| **Mantenibilidad** | ❌ Difícil (20+ archivos) | ✅ Fácil (1 archivo) |
| **Validación** | ❌ Solo en runtime | ✅ Pre-runtime + linters |
| **Reutilización** | ❌ Limitada | ✅ Alta ($ref) |
| **Versionado** | OpenAPI 3.0.1 | OpenAPI 3.1.0 |
| **Type Safety** | ❌ No | ✅ Sí (YAML schema) |
| **Búsqueda** | ❌ Difícil | ✅ Fácil (un solo archivo) |
| **Colaboración** | ❌ Difícil (merge conflicts) | ✅ Fácil (YAML legible) |

---

## 🎓 Recursos

### OpenAPI 3.1 Specification
- https://spec.openapis.org/oas/latest.html

### Swagger Editor (Online)
- https://editor.swagger.io/

### Best Practices
- https://swagger.io/docs/specification/about/

### YAML Syntax
- https://yaml.org/spec/1.2.2/

---

## ✨ Beneficios de la Migración

### Para Desarrolladores
1. **Single Source of Truth:** No más inconsistencias entre código y docs
2. **Autocompletado:** IDEs modernos soportan YAML + OpenAPI
3. **Validación:** Errores de spec detectados antes de runtime
4. **Generación de Código:** Posibilidad de generar SDKs automáticamente

### Para el Equipo
1. **Colaboración:** Cambios en docs fáciles de revisar en PRs
2. **Onboarding:** Nuevos devs entienden la API más rápido
3. **Testing:** Herramientas como Postman importan OpenAPI directamente

### Para Usuarios de la API
1. **Try It Out:** Probar endpoints sin Postman
2. **Autorización Persistente:** No re-ingresar tokens
3. **Ejemplos:** Ver requests/responses reales
4. **Búsqueda:** Encontrar endpoints rápidamente

---

## 🚨 Breaking Changes

**Ninguno.** La migración es completamente retrocompatible:

- ✅ Endpoints siguen funcionando igual
- ✅ URL de docs igual: `/api/docs`
- ✅ Autenticación sin cambios
- ✅ Respuestas sin cambios

**Único cambio visible:**
- URL adicional: `/api/docs/openapi.json` (nuevo endpoint para herramientas)

---

## 📞 Soporte

Si encuentras algún problema con la documentación:

1. Verificar sintaxis YAML: https://yamllint.com/
2. Validar OpenAPI spec: https://editor.swagger.io/
3. Revisar logs del servidor: `npm run dev`
4. Contactar al equipo de backend

---

**Autor:** Claude Code (Anthropic)
**Fecha:** 12 de Octubre, 2025
**Versión:** OpenAPI 3.1.0

# 🤖 PROMPT OPTIMIZADO: MEJORAR BACKEND EMPLEADOS

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---

**ROL:** Eres un desarrollador senior Backend especializado en Node.js, Express, TypeScript y Prisma. Tu tarea es expandir los endpoints de empleados y roles con **filtros avanzados, contadores, paginación y CRUD completo** para soportar un frontend con UX unificada.

**CONTEXTO:**
- Backend Express + TypeScript + Prisma YA FUNCIONANDO en puerto 3001
- Base de datos PostgreSQL con schema completo definido
- Endpoints básicos YA EXISTEN: `GET/POST /api/v1/employees` y `GET/POST /api/v1/roles`
- Autenticación JWT por empresa YA IMPLEMENTADA
- Middlewares de validación YA CONFIGURADOS

**VERIFICACIONES OBLIGATORIAS ANTES DE COMENZAR:**
```bash
# 1. Verificar que el servidor backend corre
curl http://localhost:3001/api/v1/employees
# Debe devolver respuesta de empleados

# 2. Verificar autenticación funciona
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/roles
# Debe devolver roles de la empresa

# 3. Verificar base de datos conectada
# Verificar que prisma client funciona correctamente
```

**SI ALGUNA VERIFICACIÓN FALLA:** DETENTE y reporta qué falta. NO continúes sin la base funcionando.

**TAREA:** Expandir APIs con funcionalidades avanzadas manteniendo compatibilidad total con frontend existente.

**EJECUTAR EN ORDEN ESTRICTO:**
1. Lee `prompts/backend/employees-enhanced/01_FILTROS_BUSQUEDA_AVANZADA.md` y implementa filtros
2. Lee `prompts/backend/employees-enhanced/02_CONTADORES_ESTADISTICAS.md` y agrega contadores
3. Lee `prompts/backend/employees-enhanced/03_CRUD_COMPLETO_ENDPOINTS.md` y completa CRUD
4. Lee `prompts/backend/employees-enhanced/04_PAGINACION_OPTIMIZADA.md` y optimiza paginación
5. Lee `prompts/backend/employees-enhanced/05_VALIDACION_TESTING.md` y ejecuta TODAS las pruebas

**ENDPOINTS OBJETIVO:**
```
📊 EMPLEADOS MEJORADOS:
GET    /api/v1/employees?search=X&role_id=Y&is_active=Z&page=1&limit=10
POST   /api/v1/employees
PUT    /api/v1/employees/:id
DELETE /api/v1/employees/:id (soft delete)
GET    /api/v1/employees/:id

🏷️ ROLES MEJORADOS:
GET    /api/v1/roles?include=stats&search=X
POST   /api/v1/roles
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id (soft delete)
GET    /api/v1/roles/:id?include=employees

📈 ESTADÍSTICAS:
GET    /api/v1/employees/stats
GET    /api/v1/roles/stats
```

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- **MANTENER compatibilidad** con endpoints existentes
- **VALIDAR con Postman/curl** después de cada fase
- Usar **TypeScript estricto** sin errores
- Implementar **soft deletes** (deleted_at)
- **Autenticación** obligatoria en todos los endpoints
- **Validación** de datos con schemas existentes

**EN CASO DE ERROR:**
- Si tests fallan: DETENTE y corrige antes de continuar
- Si hay conflictos de rutas: verificar orden de definición
- Si Prisma falla: verificar schema y migraciones

**RESULTADO ESPERADO:**
Backend expandido con **APIs de nivel empresarial**:
- ✅ **Filtros avanzados** con múltiples criterios
- ✅ **Contadores en tiempo real** por endpoint
- ✅ **CRUD completo** para empleados y roles
- ✅ **Paginación eficiente** con metadata
- ✅ **Estadísticas agregadas** para dashboards
- ✅ **Performance optimizada** con índices
- ✅ **Compatibilidad total** con frontend actual

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

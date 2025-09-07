# 🏗️ PROMPT OPTIMIZADO: VISTA DE EMPLEADOS CONECTADA A DATOS REALES

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---

**ROL:** Eres un desarrollador senior Frontend especializado en Next.js 14 y TypeScript. Tu tarea es implementar la vista de empleados completamente funcional y conectada a la API real del backend.

**CONTEXTO:**
- Dashboard base YA IMPLEMENTADO con sidebar permanente
- Vista de empleados YA EXISTE pero con datos mock
- Backend API funcionando en puerto 3001 con endpoints `/api/v1/employees`
- Estructura de datos definida en Prisma (company_employee, user, role)
- Tipos TypeScript básicos YA CONFIGURADOS
- Sistema de autenticación YA FUNCIONANDO

**VERIFICACIONES OBLIGATORIAS ANTES DE COMENZAR:**
```bash
# 1. Verificar backend funcionando
curl http://localhost:3001/api/v1/employees
# Debe devolver respuesta (aunque sea error de auth)

# 2. Verificar autenticación activa
# Ir a http://localhost:3000/dashboard - debe mostrar dashboard

# 3. Verificar variables de entorno
cat .env.local | grep NEXT_PUBLIC_API_BASE_URL
# Debe mostrar: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

**SI ALGUNA VERIFICACIÓN FALLA:** DETENTE y reporta qué falta. NO continúes sin la base funcionando.

**TAREA:** Conectar la vista de empleados con datos reales e implementar CRUD completo.

**EJECUTAR EN ORDEN ESTRICTO:**
1. Lee `prompts/frontend/employees-views/01_TIPOS_API_EMPLOYEES.md` y crea TODOS los tipos y métodos API
2. Lee `prompts/frontend/employees-views/02_HOOKS_ESTADO_EMPLOYEES.md` y crea TODOS los hooks y estado
3. Lee `prompts/frontend/employees-views/03_COMPONENTES_UI_EMPLOYEES.md` y crea TODOS los componentes UI
4. Lee `prompts/frontend/employees-views/04_VISTA_PRINCIPAL_EMPLEADOS.md` y crea la vista principal integrada
5. Lee `prompts/frontend/employees-views/05_INTEGRACION_VALIDACION.md` y ejecuta TODAS las validaciones

**ESTRUCTURA DE DATOS DEL BACKEND:**
```json
// GET /api/v1/employees - Respuesta esperada
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": { "first_name": "Juan", "last_name": "Pérez", "email": "juan@empresa.com" },
      "role": { "id": 2, "name": "Vendedor", "color": "#3B82F6" },
      "position": "Vendedor Senior",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- **VALIDAR BUILD** después de cada fase: `npm run build`
- Usar SOLO componentes shadcn/ui ya instalados
- Conectar con API real del backend (puerto 3001)
- Implementar manejo de errores y estados de carga
- Código TypeScript sin errores
- Seguir patrones de diseño existentes del dashboard

**EN CASO DE ERROR:**
- Si `npm run build` falla: DETENTE y corrige antes de continuar
- Si backend no responde: verificar que esté corriendo en puerto 3001
- Si hay errores de tipos: verificar imports y interfaces

**RESULTADO ESPERADO:**
Vista de empleados completamente funcional que:
- Se conecta con el backend real
- Permite crear, editar, desactivar empleados
- Tiene UI profesional y responsiva
- Maneja errores y estados de carga
- Valida datos en tiempo real
- Integra con el sistema de autenticación existente

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

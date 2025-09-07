# 🤖 PROMPT OPTIMIZADO: MEJORAR SECCIÓN EMPLEADOS UX

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---

**ROL:** Eres un desarrollador senior Frontend especializado en Next.js 14 y TypeScript. Tu tarea es transformar la sección de empleados con un **diseño UX unificado** que integre gestión de personal y cargos en una sola vista eficiente.

**CONTEXTO:**
- Dashboard base YA IMPLEMENTADO con sidebar permanente
- Vista de empleados YA EXISTE y funciona conectada a API
- **Backend API EXPANDIDO** funcionando en puerto 3001 con **NUEVOS ENDPOINTS AVANZADOS**:
  - ✅ `GET/POST/PUT/DELETE /api/v1/employees` - **CRUD COMPLETO**
  - ✅ `GET/POST/PUT/DELETE /api/v1/roles` - **CRUD COMPLETO**
  - ✅ `GET /api/v1/employees/advanced` - **FILTROS AVANZADOS**
  - ✅ `GET /api/v1/roles/advanced` - **ROLES CON CONTADORES**
  - ✅ `GET /api/v1/statistics/*` - **ESTADÍSTICAS EN TIEMPO REAL**
- Sistema de autenticación YA FUNCIONANDO
- Roles = Cargos de empresa (Cocinero, Cajero, Mesero, Gerente, etc.)

**VERIFICACIONES OBLIGATORIAS ANTES DE COMENZAR:**
```bash
# 1. Verificar backend funcionando
curl http://localhost:3001/api/v1/employees
# Debe devolver respuesta (aunque sea error de auth)

# 2. Verificar frontend funcionando
curl http://localhost:3000/dashboard/empleados
# Debe mostrar página de empleados

# 3. Verificar autenticación activa
# Ir a http://localhost:3000/dashboard/empleados - debe mostrar empleados
```

**SI ALGUNA VERIFICACIÓN FALLA:** DETENTE y reporta qué falta. NO continúes sin la base funcionando.

**TAREA:** Crear una vista unificada con panel principal de empleados y sidebar contextual de cargos.

**EJECUTAR EN ORDEN ESTRICTO:**
0. 🚀 **Lee `prompts/frontend/employees-improved/00_APIS_EXPANDIDAS_DISPONIBLES.md`** - REVISAR nuevas APIs disponibles
1. Lee `prompts/frontend/employees-improved/01_DISENO_UNIFICADO_EMPLEADOS.md` y crea la estructura base
2. Lee `prompts/frontend/employees-improved/02_SIDEBAR_CARGOS_CONTEXTUAL.md` y implementa gestión de roles
3. Lee `prompts/frontend/employees-improved/03_INTEGRACION_FLUJOS_UX.md` y conecta ambos paneles
4. Lee `prompts/frontend/employees-improved/04_ESTADISTICAS_CONTEXTUALES.md` y mejora las métricas
5. Lee `prompts/frontend/employees-improved/05_VALIDACION_UX_FINAL.md` y ejecuta TODAS las pruebas

**ESTRUCTURA OBJETIVO UX:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Empleados - Gestión Integrada                              │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 [Buscar empleados...] [Filtrar por: Todos los cargos ▼]     │
├──────────────────────────────────────┬──────────────────────────┤
│ PANEL PRINCIPAL (70%)                │ SIDEBAR CARGOS (30%)     │
│ 📊 Estadísticas + 👥 Lista Empleados │ 🏷️ Gestión de Cargos     │
│ ➕ Crear empleado                     │ ➕ Crear cargo            │
│ 🔍 Filtros inteligentes              │ 👁️ Vista por cargo       │
│ 📊 Métricas contextuales             │ 📈 Distribución live     │
└──────────────────────────────────────┴──────────────────────────┘
```

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- **VALIDAR BUILD** después de cada fase: `npm run build`
- Mantener funcionalidad existente intacta
- Usar SOLO componentes shadcn/ui ya instalados
- Conectar con API real del backend (puerto 3001)
- Código TypeScript sin errores
- **UI unificada** sin tabs fragmentados
- **UX optimizada** para flujos de trabajo naturales

**EN CASO DE ERROR:**
- Si `npm run build` falla: DETENTE y corrige antes de continuar
- Si backend no responde: verificar que esté corriendo en puerto 3001
- Si hay errores de tipos: verificar imports y interfaces

**RESULTADO ESPERADO:**
Sección de empleados con **UX unificada y funcionalidad completa** aprovechando el backend expandido:
- ✅ **Vista integrada** (Panel principal + Sidebar roles)
- ✅ **Flujos UX naturales** sin cambios de contexto
- ✅ **CRUD COMPLETO de roles** (crear, editar, eliminar, listar)
- ✅ **CRUD COMPLETO de empleados** (crear, editar, eliminar soft-delete, listar)
- ✅ **Filtros avanzados** con búsqueda en tiempo real
- ✅ **Estadísticas en tiempo real** del backend
- ✅ **Contadores automáticos** por rol y estado
- ✅ **Paginación optimizada** para grandes datasets
- ✅ **Cache inteligente** con actualizaciones automáticas
- ✅ **Responsive design** optimizado

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

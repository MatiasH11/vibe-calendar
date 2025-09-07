# 🤖 PROMPT OPTIMIZADO COPY-PASTE

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---

**ROL:** Eres un desarrollador senior Full-Stack especializado en refactorización de sistemas de autenticación. Tu tarea es separar claramente los **permisos de usuario** (admin/employee) de los **roles de negocio** (Admin, Vendedor, Gerente, etc.) para evitar confusión y permitir un sistema más escalable.

**CONTEXTO:**
- Backend Express + Prisma funcionando en puerto 3001
- Frontend Next.js 14 + TypeScript funcionando en puerto 3000
- Sistema de autenticación JWT existente
- Problema: Confusión entre permisos de usuario y roles de negocio

**TAREA:** Refactorizar el sistema de autenticación para separar conceptos y mejorar escalabilidad.

**EJECUTAR EN ORDEN ESTRICTO:**
1. Lee `prompts/frontend/auth-refactor/01_SEPARACION_PERMISOS_ROLES.md` y ejecuta TODOS los cambios del backend
2. Lee `prompts/frontend/auth-refactor/02_TIPOS_FRONTEND.md` y actualiza TODOS los tipos
3. Lee `prompts/frontend/auth-refactor/03_HOOKS_AUTH.md` y crea TODOS los hooks
4. Lee `prompts/frontend/auth-refactor/04_COMPONENTES_UI.md` y actualiza TODOS los componentes
5. Lee `prompts/frontend/auth-refactor/05_TESTING_VALIDACION.md` y ejecuta TODOS los tests

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- Validar que compila sin errores antes de continuar
- NO romper funcionalidad existente
- Mantener compatibilidad con código actual
- Reportar si algo falla

**RESULTADO ESPERADO:**
Sistema de autenticación refactorizado con separación clara entre permisos de usuario y roles de negocio, completamente funcional y testeado.

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

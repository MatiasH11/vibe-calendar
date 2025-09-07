# 🔐 PROMPT OPTIMIZADO: VISTAS DE AUTENTICACIÓN

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---
ACT

**ROL:** Eres un desarrollador senior Frontend especializado en UX de autenticación y Next.js 14. Tu tarea es crear las vistas de login y register para el sistema de planilla de turnos.

**CONTEXTO:**
- Infraestructura base frontend YA CREADA y funcionando
- Hook `useAuth` disponible con login/logout
- Componentes shadcn/ui instalados (button, card, input, label, form)
- Cliente API configurado para endpoints `/api/v1/auth/login` y `/api/v1/auth/register`
- Middleware JWT protegiendo rutas automáticamente

**TAREA:** Crear ÚNICAMENTE las vistas de login y register funcionales. Aprovechar infraestructura existente.

**EJECUTAR EN ORDEN ESTRICTO:**
1. Lee `prompts/frontend/auth-views/01_FORMULARIOS_AUTH.md` y crea TODOS los componentes
2. Lee `prompts/frontend/auth-views/02_PAGINAS_LOGIN_REGISTER.md` y crea TODAS las páginas
3. Lee `prompts/frontend/auth-views/03_INTEGRACION_HOOKS.md` e integra TODO el estado
4. Lee `prompts/frontend/auth-views/04_ESTILOS_UX.md` y aplica TODOS los estilos
5. Lee `prompts/frontend/auth-views/05_VALIDACION_FUNCIONAL.md` y ejecuta TODAS las validaciones

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- Usar SOLO la infraestructura ya creada (useAuth, shadcn/ui, etc.)
- Validar funcionalidad real con backend antes de continuar
- NO modificar middleware o hooks base
- SOLO crear las vistas y su funcionalidad
- Reportar si algo falla

**RESULTADO ESPERADO:**
Sistema de autenticación UI completo con páginas de login/register funcionando con el backend, redirecciones automáticas y UX moderna.

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

# 🤖 PROMPT OPTIMIZADO COPY-PASTE - VISTA DE TURNOS

## 📋 COPIAR Y PEGAR A TU AGENTE IA:

---

**ROL:** Eres un desarrollador senior Full-Stack especializado en Next.js 14 y TypeScript. Tu tarea es crear una vista completa de gestión de turnos semanal tipo calendario para el sistema de planilla.

**CONTEXTO:**
- Backend Express + Prisma funcionando en puerto 3001
- Endpoints: `/api/v1/shifts` para gestión de turnos
- Sistema de empleados y roles ya implementado
- Vista actual básica en `TurnosView.tsx` que necesita ser reemplazada

**TAREA:** Crear una vista de turnos semanal completa con grilla tipo calendario que muestre empleados en filas y días de la semana en columnas, con celdas de turnos que muestren horarios y colores por rol.

**EJECUTAR EN ORDEN ESTRICTO:**
1. Lee `prompts/frontend/shifts-views/01_SETUP_TURNOS.md` y ejecuta TODOS los comandos
2. Lee `prompts/frontend/shifts-views/02_TIPOS_TURNOS.md` y crea TODOS los archivos
3. Lee `prompts/frontend/shifts-views/03_COMPONENTES_TURNOS.md` y crea TODOS los componentes
4. Lee `prompts/frontend/shifts-views/04_SERVICIOS_TURNOS.md` y crea TODOS los servicios
5. Lee `prompts/frontend/shifts-views/06_CORRECCIONES_BACKEND.md` y aplica TODAS las correcciones
6. Lee `prompts/frontend/shifts-views/05_VALIDACION_TURNOS.md` y ejecuta TODAS las validaciones

**REGLAS ESTRICTAS:**
- Ejecutar cada paso completamente antes del siguiente
- Validar que funciona antes de continuar
- Mantener consistencia con el sistema actual
- Usar colores por rol: púrpura (bar), naranja (cocina), verde (caja)
- Implementar navegación de semana funcional
- Crear vista responsive para móvil y desktop

**CARACTERÍSTICAS REQUERIDAS:**
- Grilla semanal con empleados en filas y días en columnas
- Celdas de turnos con horarios (HH:mm - HH:mm)
- Colores por rol del empleado
- Navegación entre semanas (anterior/siguiente/hoy)
- Filtros por empleado y rol
- Navegación entre semanas funcional
- Interfaz limpia y simplificada
- Click en celda vacía para crear turno
- Click en turno existente para editar

**RESULTADO ESPERADO:**
Vista de turnos semanal completa y funcional que reemplace la vista actual básica, con todas las funcionalidades de gestión de turnos integradas con el backend existente.

**¿Entendido? Responde "SÍ" y comenzaré la ejecución.**

---

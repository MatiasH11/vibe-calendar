# 🔐 Refactorización de Autenticación - Separación de Permisos y Roles

## 📋 Descripción

Esta refactorización separa claramente los **permisos de usuario** (admin/employee) de los **roles de negocio** (Admin, Vendedor, Gerente, etc.) para evitar confusión y permitir un sistema más escalable.

## 🧠 Conceptos Clave

### **Permisos de Usuario (Sistema)**
- **`admin`**: Acceso completo al sistema (gestionar turnos, empleados, roles, estadísticas)
- **`employee`**: Acceso limitado (solo ver sus propios turnos - futuro)

### **Roles de Negocio (Lógica de Negocio)**
- **`"Admin"`**: Cargo de administrador en la empresa
- **`"Vendedor"`**: Cargo de vendedor
- **`"Gerente"`**: Cargo de gerente
- **`"Recepcionista"`**: Cargo de recepcionista
- etc.

## 📁 Estructura de Archivos

```
prompts/frontend/auth-refactor/
├── 01_SEPARACION_PERMISOS_ROLES.md    # Backend: Constantes, servicios, middleware
├── 02_TIPOS_FRONTEND.md               # Frontend: Tipos TypeScript y utilidades
├── 03_HOOKS_AUTH.md                   # Frontend: Hooks de autenticación
├── 04_COMPONENTES_UI.md               # Frontend: Componentes UI actualizados
├── 05_TESTING_VALIDACION.md           # Tests y validación completa
├── EJECUTAR_AHORA.md                  # Guía de ejecución paso a paso
└── README.md                          # Este archivo
```

## 🎯 Objetivos

1. **Separar conceptos**: Distinguir claramente permisos de usuario vs roles de negocio
2. **Mejorar escalabilidad**: Permitir múltiples niveles de permisos en el futuro
3. **Clarificar código**: Hacer el código más legible y mantenible
4. **Evitar confusión**: Eliminar ambigüedades entre permisos y roles
5. **Preparar futuro**: Base sólida para funcionalidades avanzadas

## 🔄 Cambios Principales

### **Backend**
- JWT payload incluye `user_type` (permisos) y `role_name` (rol de negocio)
- Middleware de admin verifica `user_type === "admin"`
- Constantes organizadas para mejor mantenimiento

### **Frontend**
- Tipos TypeScript actualizados con separación clara
- Hooks especializados para manejar permisos
- Utilidades para verificar permisos fácilmente
- Componentes UI que muestran claramente la diferencia

### **UI/UX**
- Badges visuales separados para permisos y roles
- Protección de contenido con componentes reutilizables
- Información de usuario clara y bien organizada
- Página de no autorizado para manejar accesos denegados

## 🚀 Cómo Ejecutar

1. **Leer la documentación**: Revisar todos los archivos en orden
2. **Seguir EJECUTAR_AHORA.md**: Guía paso a paso completa
3. **Ejecutar por fases**: Backend → Tipos → Hooks → UI → Testing
4. **Validar cada fase**: Ejecutar tests después de cada cambio
5. **Probar funcionalidad**: Verificar que todo funciona correctamente

## 📊 Estructura Final

### **JWT Payload**
```typescript
{
  user_id: number;
  company_id: number;
  employee_id: number;
  role_id: number;
  role_name: "Admin" | "Vendedor" | "Gerente" | ...;  // Rol de negocio
  user_type: "admin" | "employee";                    // Permisos del sistema
  exp: number;
}
```

### **Verificaciones de Permisos**
```typescript
// Permisos del sistema
isAdmin(user)                    // user_type === "admin"
isEmployee(user)                 // user_type === "employee"
canManageShifts(user)            // isAdmin(user)
canManageEmployees(user)         // isAdmin(user)
canViewStatistics(user)          // isAdmin(user)

// Roles de negocio
getUserBusinessRole(user)        // role_name
hasBusinessRole(user, "Admin")   // role_name === "Admin"
```

## 🧪 Testing

- **Tests unitarios**: Utilidades de permisos
- **Tests de hooks**: Lógica de autenticación
- **Tests de componentes**: UI y funcionalidad
- **Tests de integración**: Flujo completo backend-frontend
- **Validación manual**: Script para verificar funcionalidad

## 📚 Documentación Adicional

- Cada archivo contiene ejemplos de código completos
- Comentarios explicativos en el código
- Casos de uso y escenarios de prueba
- Guías de troubleshooting

## ⚠️ Consideraciones

1. **Compatibilidad**: Mantener compatibilidad con código existente
2. **Migración**: Considerar usuarios existentes con tokens antiguos
3. **Testing**: Probar todos los flujos de permisos
4. **Documentación**: Actualizar documentación después de implementar
5. **Rollback**: Tener plan de rollback en caso de problemas

## 🎉 Beneficios

- **Código más claro**: Separación clara de responsabilidades
- **Mejor mantenimiento**: Estructura más organizada
- **Escalabilidad**: Base para funcionalidades avanzadas
- **Menos errores**: Menos confusión entre conceptos
- **Mejor UX**: Información más clara para el usuario

---

**¿Listo para comenzar? Ve a `EJECUTAR_AHORA.md` para la guía paso a paso.**

# 🚀 APIs EXPANDIDAS DISPONIBLES - REFERENCIA COMPLETA

## 🎯 RESUMEN

El backend ha sido **completamente expandido** con funcionalidades empresariales de nivel profesional. Todas las limitaciones anteriores han sido **ELIMINADAS** y ahora tienes acceso a:

- ✅ **CRUD COMPLETO** para empleados y roles
- ✅ **Filtros avanzados** con búsqueda en tiempo real  
- ✅ **Estadísticas agregadas** del backend
- ✅ **Paginación optimizada** con metadata
- ✅ **Cache inteligente** con invalidación automática
- ✅ **Contadores automáticos** por rol y estado

---

## 📡 ENDPOINTS EMPLEADOS - EXPANDIDOS

### **Lista Simple (Compatibilidad)**
```bash
GET /api/v1/employees
# Respuesta: { success: true, data: Employee[] }
```

### **Lista Avanzada (NUEVO)**
```bash
GET /api/v1/employees/advanced?search=texto&role_id=1&is_active=true&page=1&limit=10&sort_by=user.first_name&sort_order=asc

# Respuesta:
{
  "success": true,
  "data": Employee[],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **CRUD Completo (NUEVO)**
```bash
# Obtener empleado específico
GET /api/v1/employees/:id
# Respuesta: { success: true, data: Employee }

# Crear empleado (existente)
POST /api/v1/employees
Body: { email, first_name, last_name, role_id, position }

# Actualizar empleado (NUEVO)
PUT /api/v1/employees/:id
Body: { role_id?, position?, is_active? }

# Eliminar empleado - soft delete (NUEVO)
DELETE /api/v1/employees/:id
# Respuesta: { success: true, message: "Employee deleted successfully" }
```

---

## 🏷️ ENDPOINTS ROLES - EXPANDIDOS

### **Lista Simple (Compatibilidad)**
```bash
GET /api/v1/roles
# Respuesta: { success: true, data: Role[] }
```

### **Lista Avanzada con Contadores (NUEVO)**
```bash
GET /api/v1/roles/advanced?include=stats&search=admin&sort_by=employee_count&sort_order=desc

# Respuesta:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Gerente",
      "description": "Gestión de equipo",
      "color": "#FF5722",
      "_count": {
        "employees": 5  // ✅ Contador automático
      }
    }
  ],
  "pagination": { ... }
}
```

### **CRUD Completo (NUEVO)**
```bash
# Obtener rol con empleados
GET /api/v1/roles/:id?include=employees
# Respuesta: { success: true, data: Role & { employees: Employee[] } }

# Crear rol (existente mejorado)
POST /api/v1/roles
Body: { name, description?, color? }

# Actualizar rol (NUEVO)
PUT /api/v1/roles/:id
Body: { name?, description?, color? }

# Eliminar rol (NUEVO)
DELETE /api/v1/roles/:id
# Solo si no tiene empleados asignados
```

---

## 📊 ENDPOINTS ESTADÍSTICAS (NUEVO)

### **Estadísticas de Empleados**
```bash
GET /api/v1/statistics/employees

# Respuesta:
{
  "success": true,
  "data": {
    "total_employees": 25,
    "active_employees": 23,
    "inactive_employees": 2,
    "active_percentage": 92,
    "recent_hires": 3,
    "distribution_by_role": [
      {
        "role_id": 1,
        "role_name": "Cocinero",
        "role_color": "#FF5722",
        "total_employees": 8,
        "active_employees": 7,
        "inactive_employees": 1
      }
    ],
    "roles_with_employees": 4,
    "average_employees_per_role": 6
  }
}
```

### **Estadísticas de Roles**
```bash
GET /api/v1/statistics/roles

# Respuesta:
{
  "success": true,
  "data": {
    "total_roles": 5,
    "roles_with_employees": 4,
    "empty_roles": 1,
    "utilization_percentage": 80,
    "max_employees_in_role": 8,
    "min_employees_in_role": 0,
    "roles": [
      {
        "id": 1,
        "name": "Cocinero",
        "employee_count": 8,
        "color": "#FF5722"
      }
    ]
  }
}
```

### **Dashboard Completo**
```bash
GET /api/v1/statistics/dashboard

# Respuesta:
{
  "success": true,
  "data": {
    "employees": { /* stats de empleados */ },
    "roles": { /* stats de roles */ },
    "growth": { /* métricas de crecimiento */ },
    "summary": {
      "total_employees": 25,
      "total_roles": 5,
      "active_percentage": 92,
      "role_utilization": 80
    }
  }
}
```

### **Métricas de Crecimiento**
```bash
GET /api/v1/statistics/growth

# Respuesta:
{
  "success": true,
  "data": {
    "employees_last_month": 22,
    "employees_this_month": 25,
    "monthly_growth_rate": 14,
    "hires_3_months": 8,
    "terminations_3_months": 2,
    "net_growth_3_months": 6,
    "turnover_rate_3_months": 8
  }
}
```

---

## 🔧 PARÁMETROS DE CONSULTA

### **Filtros de Empleados**
```typescript
interface EmployeeFilters {
  search?: string;           // Buscar en nombre, email, rol, posición
  role_id?: number;         // Filtrar por rol específico
  is_active?: boolean;      // Filtrar por estado activo
  user_id?: number;         // Filtrar por usuario específico
  page?: number;            // Página (default: 1)
  limit?: number;           // Items por página (default: 10, max: 100)
  sort_by?: 'created_at' | 'user.first_name' | 'user.last_name' | 'role.name';
  sort_order?: 'asc' | 'desc';
}
```

### **Filtros de Roles**
```typescript
interface RoleFilters {
  search?: string;          // Buscar en nombre o descripción
  include?: 'stats' | 'employees'; // Incluir datos adicionales
  page?: number;            // Página (default: 1)
  limit?: number;           // Items por página (default: 50, max: 100)
  sort_by?: 'created_at' | 'name' | 'employee_count';
  sort_order?: 'asc' | 'desc';
}
```

---

## 🎨 INTERFACES TYPESCRIPT

### **Employee Expandido**
```typescript
interface Employee {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: {
    id: number;
    name: string;
    description: string | null;
    color: string;
  };
}
```

### **Role con Contadores**
```typescript
interface RoleWithStats {
  id: number;
  name: string;
  description: string | null;
  color: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  _count: {
    employees: number;  // ✅ Contador automático
  };
  employees?: Employee[]; // Si include=employees
}
```

### **Paginación**
```typescript
interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

---

## ⚡ FUNCIONALIDADES AVANZADAS

### **Cache Inteligente**
- ✅ Búsquedas se **cachean automáticamente** (2-5 minutos)
- ✅ **Invalidación automática** en operaciones CRUD
- ✅ Headers `X-Cache: HIT/MISS` para debug
- ✅ Performance optimizada para consultas frecuentes

### **Validaciones Robustas**
- ✅ **Esquemas Zod** para validación estricta
- ✅ **Error handling** consistente
- ✅ **Códigos de error** específicos
- ✅ **Mensajes descriptivos** en español

### **Soft Deletes**
- ✅ Empleados se **marcan como eliminados** (deleted_at)
- ✅ **Preserva integridad** de datos históricos
- ✅ **Filtra automáticamente** elementos eliminados
- ✅ **Recuperación posible** (si se necesita)

---

## 🚀 EJEMPLOS DE USO EN FRONTEND

### **Hook para Empleados Avanzado**
```typescript
// Usar filtros avanzados del backend
const { employees, pagination, isLoading } = useEmployees({
  search: 'juan',
  role_id: 1,
  is_active: true,
  page: 1,
  limit: 10,
  sort_by: 'user.first_name',
  sort_order: 'asc'
});

// CRUD completo
const { updateEmployee, deleteEmployee } = useEmployeeMutations();
```

### **Hook para Roles con Contadores**
```typescript
// Obtener roles con contadores automáticos
const { roles } = useRoles({ 
  include: 'stats',
  sort_by: 'employee_count',
  sort_order: 'desc'
});

// Cada rol tendrá: role._count.employees
```

### **Hook para Estadísticas**
```typescript
// Estadísticas en tiempo real del backend
const { employeeStats } = useEmployeeStats();
const { roleStats } = useRoleStats();
const { dashboardStats } = useDashboardStats();

// Sin necesidad de calcular en frontend
```

---

## 🎯 BENEFICIOS PARA EL FRONTEND

### **Performance**
- ⚡ **Cache automático** - consultas repetidas son instantáneas
- ⚡ **Paginación real** - maneja datasets grandes eficientemente
- ⚡ **Queries optimizadas** - el backend hace el trabajo pesado

### **UX Mejorada**
- 🎨 **Filtros en tiempo real** - búsqueda instantánea
- 🎨 **Contadores live** - sin necesidad de calcular manualmente
- 🎨 **Estadísticas agregadas** - métricas profesionales

### **Desarrollo Simplificado**
- 🔧 **Menos lógica en frontend** - el backend maneja complejidad
- 🔧 **APIs predecibles** - respuestas consistentes
- 🔧 **Error handling robusto** - mensajes claros

---

## 🎉 **¡TODAS LAS LIMITACIONES ELIMINADAS!**

**Antes:**
- ❌ Solo GET/POST básicos
- ❌ Sin filtros ni búsqueda
- ❌ Sin estadísticas del backend
- ❌ Sin CRUD completo
- ❌ Sin paginación real

**Ahora:**
- ✅ **CRUD completo** para empleados y roles
- ✅ **Filtros avanzados** con búsqueda de texto
- ✅ **Estadísticas en tiempo real** del backend
- ✅ **Paginación optimizada** con metadata
- ✅ **Cache inteligente** con invalidación automática
- ✅ **Performance de nivel empresarial**

---

**¡Ahora puedes crear la UX de empleados más avanzada y profesional! 🚀**

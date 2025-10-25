# 📝 Audit Log - Vibe Calendar

## ✅ Eventos Registrados Automáticamente

### **Autenticación**

#### Registro (`POST /api/v1/auth/register`)
Se crean **4 audit logs** en la misma transacción:

1. **Company Creation**
   ```json
   {
     "action": "CREATE",
     "entity_type": "company",
     "entity_id": <company_id>,
     "new_values": {
       "name": "Company Name",
       "email": "admin@company.com"
     }
   }
   ```

2. **User Creation**
   ```json
   {
     "action": "CREATE",
     "entity_type": "user",
     "entity_id": <user_id>,
     "new_values": {
       "email": "user@example.com",
       "first_name": "John",
       "last_name": "Doe"
     }
   }
   ```

3. **Department Creation**
   ```json
   {
     "action": "CREATE",
     "entity_type": "department",
     "entity_id": <department_id>,
     "new_values": {
       "name": "Management"
     }
   }
   ```

4. **Employee Creation**
   ```json
   {
     "action": "CREATE",
     "entity_type": "employee",
     "entity_id": <employee_id>,
     "new_values": {
       "company_role": "OWNER",
       "position": "Owner"
     }
   }
   ```

---

#### Login (`POST /api/v1/auth/login`)
Se crea **1 audit log**:

```json
{
  "action": "LOGIN",
  "entity_type": "user",
  "entity_id": <user_id>,
  "new_values": {
    "email": "user@example.com"
  }
}
```

---

## 📊 Estructura del Audit Log

Cada registro de auditoría contiene:

```typescript
{
  id: number;              // ID único del log
  user_id: number;         // Usuario que ejecutó la acción
  company_id: number;      // Compañía asociada
  action: audit_action;    // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT
  entity_type: string;     // Tipo de entidad: "company", "user", "department", "employee", etc.
  entity_id: number | null; // ID de la entidad afectada
  old_values: Json | null; // Estado anterior (para UPDATE/DELETE)
  new_values: Json | null; // Estado nuevo (para CREATE/UPDATE)
  ip_address: string | null; // IP del cliente (si está disponible)
  user_agent: string | null; // User agent del cliente
  created_at: Date;        // Timestamp de la acción
}
```

---

## 🔍 Consultar Audit Logs

### **Listar todos los logs (con filtros)**
```bash
GET /api/v1/audit?page=1&limit=50
GET /api/v1/audit?action=CREATE
GET /api/v1/audit?entity_type=company
GET /api/v1/audit?user_id=5
GET /api/v1/audit?start_date=2025-08-01&end_date=2025-08-31
```

### **Historial de una entidad específica**
```bash
GET /api/v1/audit/entity/company/1
GET /api/v1/audit/entity/employee/5
GET /api/v1/audit/entity/department/3
```

### **Logs recientes (dashboard)**
```bash
GET /api/v1/audit/recent?limit=10
```

### **Estadísticas**
```bash
GET /api/v1/audit/statistics
GET /api/v1/audit/statistics?start_date=2025-08-01
```

---

## 🎯 Acciones Disponibles

```typescript
enum audit_action {
  CREATE   // Creación de una entidad
  UPDATE   // Actualización de una entidad
  DELETE   // Eliminación de una entidad
  LOGIN    // Usuario inició sesión
  LOGOUT   // Usuario cerró sesión
  EXPORT   // Exportación de datos
  IMPORT   // Importación de datos
}
```

---

## 🚀 Agregar Audit Log en Nuevos Módulos

Cuando crees nuevos endpoints, agrega audit logging:

```typescript
// Example: Create Department
async createDepartment(data: CreateDepartmentDto, userId: number, companyId: number) {
  const department = await prisma.department.create({ data });

  // Create audit log
  await prisma.audit_log.create({
    data: {
      user_id: userId,
      company_id: companyId,
      action: 'CREATE',
      entity_type: 'department',
      entity_id: department.id,
      new_values: { name: department.name, color: department.color },
    },
  });

  return department;
}

// Example: Update Employee
async updateEmployee(id: number, data: UpdateEmployeeDto, userId: number, companyId: number) {
  // Get old values
  const oldEmployee = await prisma.employee.findUnique({ where: { id } });

  // Update
  const employee = await prisma.employee.update({
    where: { id },
    data,
  });

  // Create audit log
  await prisma.audit_log.create({
    data: {
      user_id: userId,
      company_id: companyId,
      action: 'UPDATE',
      entity_type: 'employee',
      entity_id: employee.id,
      old_values: { company_role: oldEmployee.company_role, position: oldEmployee.position },
      new_values: { company_role: employee.company_role, position: employee.position },
    },
  });

  return employee;
}

// Example: Delete Shift
async deleteShift(id: number, userId: number, companyId: number) {
  const shift = await prisma.shift.findUnique({ where: { id } });

  await prisma.shift.update({
    where: { id },
    data: { deleted_at: new Date() }, // Soft delete
  });

  // Create audit log
  await prisma.audit_log.create({
    data: {
      user_id: userId,
      company_id: companyId,
      action: 'DELETE',
      entity_type: 'shift',
      entity_id: id,
      old_values: { shift_date: shift.shift_date, start_time: shift.start_time },
    },
  });
}
```

---

## 💡 Mejores Prácticas

1. **Siempre registra los cambios importantes:**
   - Creación de entidades
   - Actualizaciones de datos sensibles
   - Eliminaciones (especialmente soft deletes)
   - Acciones de autenticación (login, logout)
   - Exportaciones/importaciones de datos

2. **Incluye información relevante en `new_values` y `old_values`:**
   - No incluyas datos sensibles (contraseñas, tokens)
   - Incluye solo los campos que cambiaron
   - Usa objetos JSON para estructurar los datos

3. **Usa transacciones cuando sea necesario:**
   - Si creas múltiples entidades, registra todos los logs en la misma transacción
   - Evita audit logs parciales si la operación falla

4. **Captura IP y User Agent (cuando esté disponible):**
   ```typescript
   await prisma.audit_log.create({
     data: {
       // ... otros campos
       ip_address: req.ip,
       user_agent: req.headers['user-agent'],
     },
   });
   ```

---

## 📋 Ejemplo Completo de Transacción con Audit

```typescript
async function createEmployeeWithAudit(data: CreateEmployeeDto, userId: number, companyId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create employee
    const employee = await tx.employee.create({
      data: {
        company_id: companyId,
        user_id: data.user_id,
        department_id: data.department_id,
        company_role: data.company_role,
        position: data.position,
      },
    });

    // 2. Create audit log in same transaction
    await tx.audit_log.create({
      data: {
        user_id: userId,
        company_id: companyId,
        action: 'CREATE',
        entity_type: 'employee',
        entity_id: employee.id,
        new_values: {
          department_id: employee.department_id,
          company_role: employee.company_role,
          position: employee.position,
        },
      },
    });

    return employee;
  });
}
```

---

**Última actualización:** 2025-10-24

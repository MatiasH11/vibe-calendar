### **Archivo 2: `01_PROMPT_MVP_BASE_DE_DATOS.md`**

**Propósito:** Este es el prompt que **copiarás y pegarás** para dárselo a la IA. Es una orden de trabajo clara, concisa y ejecutable que le pide construir solo la parte del "Plano Maestro" que necesitamos para la Fase 1.

# Prompt: Generación del Esquema de Base de Datos para el MVP

Actúa como un arquitecto de bases de datos experto, especializado en PostgreSQL. Tu tarea es generar el esquema SQL para el Producto Mínimo Viable (MVP) de una nueva aplicación de gestión de turnos llamada `Calendar Shift`.

El diseño debe ser un subconjunto de una arquitectura más grande y robusta, asegurando la compatibilidad futura. Todos los nombres de tablas, columnas y tipos deben estar en inglés.

## Requisitos del Esquema MVP

### 1. Tipos de Datos Personalizados
Primero, define este tipo ENUM para el estado de los turnos:
```sql
CREATE TYPE shift_status AS ENUM ('draft', 'confirmed', 'cancelled');
```

### 2. Tablas Principales del MVP
Ahora, crea las siguientes tablas con sus respectivas columnas y relaciones. Usa `TIMESTAMPTZ` para las fechas y horas con zona horaria, y añade `created_at` y `updated_at` a cada tabla. Incluye también `deleted_at` para borrado lógico (soft delete).

**Tabla `companies`**:
```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

**Tabla `users`**:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

**Tabla `roles`**:```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#FFFFFF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, name)
);
```

**Tabla `company_employees`**:
```sql
CREATE TABLE company_employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    position VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (company_id, user_id)
);
```

**Tabla `shifts`**:
```sql
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    company_employee_id INTEGER NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    status shift_status NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### 3. Función de Trigger para `updated_at`
Finalmente, crea una función y los triggers correspondientes para actualizar automáticamente el campo `updated_at` en todas las tablas del MVP.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_employees_updated_at BEFORE UPDATE ON company_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Por favor, genera el script SQL completo y ordenado para ejecutar esta creación del esquema del MVP.
```

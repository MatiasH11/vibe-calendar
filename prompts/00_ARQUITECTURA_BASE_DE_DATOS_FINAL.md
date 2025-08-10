# Constitución y Plano Maestro Arquitectónico - Calendar Shift

**Propósito:** Este es tu documento de referencia principal. **Contiene la visión completa y final de la base de datos**. No se lo darás a la IA en la primera fase, pero lo usarás como tu "fuente de verdad" para planificar todas las futuras actualizaciones.

## 1. Visión del Producto

Calendar Shift es una plataforma SaaS diseñada para ofrecer una solución integral y robusta para la gestión de horarios de empleados. La plataforma debe ser intuitiva para la planificación manual, pero lo suficientemente potente como para soportar flujos de trabajo complejos, automatización y análisis de datos. La arquitectura está pensada para evolucionar desde un Producto Mínimo Viable (MVP) sólido hasta una herramienta empresarial completa.

## 2. Stack Tecnológico

*   **Backend:** Node.js (Express.js)
*   **Frontend:** Next.js (React)
*   **Base de Datos:** PostgreSQL
*   **Estilos:** Tailwind CSS con una librería de componentes (ej: shadcn/ui).

## 3. Arquitectura de Base de Datos (Visión Completa y Final)

Este es el esquema completo y definitivo de la base de datos que guía nuestro desarrollo. Todos los nombres técnicos están en inglés.

### Tipos de Datos Personalizados
```sql
CREATE TYPE shift_status AS ENUM ('draft', 'confirmed', 'cancelled', 'completed');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE request_type AS ENUM ('swap', 'cover', 'cancel');
```

### Tablas Principales
```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, business_name VARCHAR(255), tax_id VARCHAR(100), email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(20), timezone VARCHAR(50) DEFAULT 'UTC', work_start_time TIME DEFAULT '09:00:00', work_end_time TIME DEFAULT '17:00:00', is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, phone VARCHAR(20), failed_login_attempts INTEGER DEFAULT 0, locked_until TIMESTAMPTZ, email_verified BOOLEAN DEFAULT FALSE, last_login TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, name VARCHAR(100) NOT NULL, description TEXT, color VARCHAR(7) DEFAULT '#FFFFFF', permissions JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, UNIQUE (company_id, name)
);

CREATE TABLE company_employees (
    id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role_id INTEGER NOT NULL, employee_code VARCHAR(50), position VARCHAR(100), department VARCHAR(100), hire_date DATE, hourly_rate DECIMAL(10,2), address TEXT, emergency_contact_name VARCHAR(200), emergency_contact_phone VARCHAR(20), is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ, FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (role_id) REFERENCES roles(id), UNIQUE (company_id, user_id), UNIQUE (company_id, employee_code)
);

CREATE TABLE shift_templates (
    id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, name VARCHAR(100) NOT NULL, description TEXT, start_time TIME NOT NULL, end_time TIME NOT NULL, days_of_week INTEGER[] NOT NULL, color VARCHAR(7) DEFAULT '#3498db', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, CONSTRAINT check_template_time_order CHECK (end_time > start_time), CONSTRAINT check_days_of_week CHECK (array_length(days_of_week, 1) > 0 AND days_of_week <@ ARRAY)
);

CREATE TABLE shifts (
    id SERIAL PRIMARY KEY, company_employee_id INTEGER NOT NULL, template_id INTEGER, shift_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, break_duration INTERVAL DEFAULT '0 minutes', notes TEXT, status shift_status NOT NULL DEFAULT 'confirmed', actual_start_time TIMESTAMPTZ, actual_end_time TIMESTAMPTZ, created_by INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ, FOREIGN KEY (company_employee_id) REFERENCES company_employees(id) ON DELETE CASCADE, FOREIGN KEY (template_id) REFERENCES shift_templates(id) ON DELETE SET NULL, FOREIGN KEY (created_by) REFERENCES company_employees(id) ON DELETE SET NULL, CONSTRAINT check_shift_time_order CHECK (end_time > start_time OR end_time < start_time)
);

CREATE TABLE shift_requests (
    id SERIAL PRIMARY KEY, original_shift_id INTEGER NOT NULL, requesting_employee_id INTEGER NOT NULL, target_employee_id INTEGER, replacement_shift_id INTEGER, request_type request_type NOT NULL, reason TEXT, status request_status DEFAULT 'pending', approved_by INTEGER, approved_at TIMESTAMPTZ, response_notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), FOREIGN KEY (original_shift_id) REFERENCES shifts(id) ON DELETE CASCADE, FOREIGN KEY (requesting_employee_id) REFERENCES company_employees(id) ON DELETE CASCADE, FOREIGN KEY (target_employee_id) REFERENCES company_employees(id) ON DELETE CASCADE, FOREIGN KEY (replacement_shift_id) REFERENCES shifts(id) ON DELETE CASCADE, FOREIGN KEY (approved_by) REFERENCES company_employees(id) ON DELETE SET NULL
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, company_id INTEGER, token_hash VARCHAR(255) NOT NULL UNIQUE, device_info TEXT, ip_address INET, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_used_at TIMESTAMPTZ DEFAULT NOW(), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, company_id INTEGER NOT NULL, type VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, message TEXT NOT NULL, data JSONB, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY, company_id INTEGER, user_id INTEGER, entity_type VARCHAR(100) NOT NULL, entity_id INTEGER NOT NULL, action VARCHAR(50) NOT NULL, old_values JSONB, new_values JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Índices, Triggers y Vistas
```sql
CREATE INDEX idx_shifts_date_employee ON shifts (shift_date, company_employee_id);
CREATE UNIQUE INDEX idx_no_overlap_shifts ON shifts (company_employee_id, shift_date) WHERE deleted_at IS NULL AND status != 'cancelled';
-- ... (etc., todos los demás índices, triggers y vistas)

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (etc., todos los demás triggers)

CREATE VIEW v_shifts_detailed AS SELECT ...;
CREATE VIEW v_employee_hours_summary AS SELECT ...;
```
```

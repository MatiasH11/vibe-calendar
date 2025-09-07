import { user_type } from '@prisma/client';

export interface jwt_payload {
  user_id: number;
  company_id: number;
  employee_id: number; // ID de la tabla company_employees
  role_id: number;
  role_name: string;        // Rol de negocio: "Admin", "Vendedor", etc.
  user_type: user_type;     // Permisos del sistema desde enum de Prisma
  // exp es manejado automáticamente por JWT
}



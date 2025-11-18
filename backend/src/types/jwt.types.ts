import { user_type, company_role } from '@prisma/client';

export interface jwt_payload {
  user_id: number;
  employee_id: number;
  company_id: number; // Company ID the user is currently working with
  user_type: user_type; // Platform-level permission: SUPER_ADMIN or USER
  company_role: company_role; // Company-level permission: OWNER, ADMIN, MANAGER, EMPLOYEE
  email: string;
  // exp and iat are handled automatically by JWT
}



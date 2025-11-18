import { user_type } from '@prisma/client';

export interface jwt_payload {
  user_id: number;
  employee_id: number;
  company_id: number; // Company ID the user is currently working with
  user_type: user_type; // Permission level: SUPER_ADMIN, ADMIN, or USER
  email: string;
  // exp and iat are handled automatically by JWT
}



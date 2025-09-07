export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  user_id: number;
  company_id: number;
  employee_id: number;
  role_id: number;
  role: string;
  email?: string;
  exp?: number;
}

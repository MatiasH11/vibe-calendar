export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    error_code: string;
    message: string;
  };
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface LoginResponse {
  token: string;
  user: Employee;
}

export interface RegisterResponse {
  token: string;
  user: Employee;
}
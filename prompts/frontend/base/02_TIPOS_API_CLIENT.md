# 🔗 FASE 2: Tipos y Cliente API

## 🎯 Objetivo
Configurar tipos TypeScript básicos y cliente API para conectar con el backend. **Solo infraestructura**, no implementación de vistas.

## 📝 PASO 1: Tipos Base

### `types/auth.ts`
```typescript
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
  user_id: number;
  company_id: number;
  employee_id: number;
  role_id: number;
  role_name: string;
}
```

### `types/api.ts`
```typescript
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
```

## 🌐 PASO 2: Cliente API Base

### `lib/api.ts`
```typescript
import { LoginRequest, RegisterRequest } from '@/types/auth';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Métodos básicos - implementación específica se hará después
  async login(data: LoginRequest) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

## 🛠️ PASO 3: Utilidades Base

### `lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## ✅ Validación

```bash
# Verificar tipos
npx tsc --noEmit

# Verificar archivos (Windows)
dir types
dir lib
```

## 🎯 Resultado

- **Tipos TypeScript** básicos definidos
- **Cliente API** configurado para backend
- **Estructura base** para comunicación HTTP
- **Utilidades** esenciales creadas

**La infraestructura está lista** para implementar autenticación y vistas después.

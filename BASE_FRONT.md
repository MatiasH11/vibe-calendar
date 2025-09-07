# 🏗️ Frontend Base Project - Next.js + Tailwind + shadcn/ui + Backend Integration

## 🎯 INSTRUCCIONES PARA IA - EJECUCIÓN PASO A PASO

### Contexto del Proyecto
Generar un frontend Next.js 14 completamente funcional e integrado con backend Express + Prisma para sistema de planilla de turnos. El proyecto debe incluir autenticación JWT, navegación con sidebar permanente, y gestión completa de empleados y turnos.

### Pre-requisitos
- **Backend funcionando**: Express + Prisma en puerto 3001
- **Base de datos**: PostgreSQL con migraciones aplicadas
- **Endpoints disponibles**: `/api/v1/auth`, `/api/v1/employees`, `/api/v1/roles`, `/api/v1/shifts`

### Orden de Ejecución OBLIGATORIO
1. ✅ **Fase 1**: Setup inicial y dependencias
2. ✅ **Fase 2**: Configuración base (archivos de config)
3. ✅ **Fase 3**: Estructura de tipos y API client
4. ✅ **Fase 4**: Middleware y autenticación
5. ✅ **Fase 5**: Componentes UI base
6. ✅ **Fase 6**: Layouts y navegación
7. ✅ **Fase 7**: Páginas de autenticación
8. ✅ **Fase 8**: Dashboard y páginas protegidas
9. ✅ **Fase 9**: Gestión de empleados
10. ✅ **Fase 10**: Validación final y testing

### Criterios de Éxito por Fase
- **Cada fase debe compilar sin errores**
- **Todas las rutas deben ser accesibles**
- **Autenticación JWT debe funcionar completamente**
- **Integración con backend debe estar operativa**

## 📋 Objetivo Técnico
Establecer la **base fundacional** de un proyecto frontend moderno conectado con backend de planilla de turnos que sirva como punto de partida para generar vistas específicas (login, register, dashboard, etc.) manteniendo consistencia en el stack tecnológico, convenciones y integración completa con la API.

## 🚀 Stack Tecnológico

### Core Framework
- **Next.js 14** con **App Router** → Full-stack React framework con SSR/SSG
- **React 18** → Biblioteca UI moderna con server components
- **TypeScript** → Tipado estricto y mejor DX

### Estilos y UI
- **TailwindCSS** → Utility-first CSS framework
- **shadcn/ui** → Componentes accesibles basados en Radix UI
- **Lucide React** → Librería de iconos moderna
- **Framer Motion** → Animaciones fluidas y performantes

### Estado y Data
- **Zustand** → Estado global simple y performante  
- **TanStack Query (React Query)** → Manejo de server state, cache y sincronización
- **Next.js Router** → Navegación con App Router

### Networking y Utils
- **Fetch API nativo** → Cliente HTTP integrado con Next.js
- **date-fns** → Manipulación de fechas (lightweight)
- **Zod** → Validación de esquemas y tipos runtime

### Backend Integration
- **API REST** → Conexión con backend Express + Prisma
- **JWT Authentication** → Autenticación basada en tokens
- **Middleware de Auth** → Protección de rutas en Next.js
- **TypeScript Types** → Tipos compartidos entre frontend y backend

### Desarrollo y Testing
- **ESLint + Prettier** → Linting y formateo consistente
- **Vitest + React Testing Library** → Testing framework

## 📁 Estructura de Directorios (Next.js App Router)

```
frontend/
├── app/                       # App Router de Next.js 14
│   ├── (auth)/               # Grupo de rutas de autenticación
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                # Grupo de rutas de aplicación protegida
│   │   ├── layout.tsx        # Layout con sidebar permanente
│   │   ├── dashboard/page.tsx
│   │   ├── employees/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                  # API Routes de Next.js
│   │   ├── _utils/
│   │   │   └── backend.ts    # Utilidad para conectar con backend
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── register/route.ts
│   │   ├── employees/route.ts
│   │   ├── roles/route.ts
│   │   └── shifts/route.ts
│   ├── globals.css           # Estilos globales + Tailwind
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   └── middleware.ts         # Middleware de autenticación
├── components/               # Componentes reutilizables
│   ├── ui/                  # Componentes base de shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── theme-switch.tsx
│   ├── navigation/          # Componentes de navegación
│   │   ├── Sidebar.tsx
│   │   └── SidebarItem.tsx
│   ├── employees/           # Componentes específicos de empleados
│   │   ├── EmployeeForm.tsx
│   │   └── EmployeeList.tsx
│   └── schedule/            # Componentes de planilla
│       └── WeekNavigation.tsx
├── hooks/                   # Custom hooks
│   ├── useAuth.ts          # Hook de autenticación
│   ├── useEmployees.ts     # Hook para gestión de empleados
│   ├── useShifts.ts        # Hook para gestión de turnos
│   ├── useRoles.ts         # Hook para gestión de roles
│   └── useTheme.ts         # Hook para manejo de tema
├── lib/                    # Configuraciones y utilidades
│   ├── api.ts              # Cliente API configurado
│   ├── auth.ts             # Utilidades de autenticación
│   ├── types.ts            # Tipos TypeScript compartidos
│   ├── utils.ts            # Funciones helper generales
│   ├── queryClient.ts      # Configuración React Query
│   └── routes.ts           # Constantes de rutas
├── providers/              # Providers de contexto
│   ├── AppProviders.tsx    # Provider principal
│   ├── QueryProvider.tsx   # Provider React Query
│   └── ThemeProvider.tsx   # Provider de tema
├── stores/                 # Estado global con Zustand
│   ├── authStore.ts        # Estado de autenticación
│   └── uiStore.ts          # Estado de UI global
└── types/                  # Tipos TypeScript específicos
    ├── auth.ts             # Tipos de autenticación
    ├── employee.ts         # Tipos de empleados
    ├── shift.ts            # Tipos de turnos
    └── api.ts              # Tipos de respuestas API
```

## 🔗 Configuración de Backend Integration

### API Endpoints Disponibles

Tu backend proporciona los siguientes endpoints principales:

#### Autenticación (`/api/v1/auth`)
- `POST /auth/register` - Registro de empresa y usuario admin
- `POST /auth/login` - Login con credenciales

#### Gestión de Empleados (`/api/v1/employees`)
- `GET /employees` - Listar empleados de la empresa
- `POST /employees` - Crear nuevo empleado
- `PUT /employees/:id` - Actualizar empleado
- `DELETE /employees/:id` - Eliminar empleado

#### Gestión de Roles (`/api/v1/roles`)
- `GET /roles` - Listar roles disponibles
- `POST /roles` - Crear nuevo rol
- `PUT /roles/:id` - Actualizar rol
- `DELETE /roles/:id` - Eliminar rol

#### Gestión de Turnos (`/api/v1/shifts`)
- `GET /shifts` - Listar turnos con filtros
- `POST /shifts` - Crear nuevo turno
- `PUT /shifts/:id` - Actualizar turno
- `DELETE /shifts/:id` - Eliminar turno

#### Health Check
- `GET /api/v1/health` - Estado del servidor y base de datos

### Tipos TypeScript para API

```typescript
// types/auth.ts
export interface RegisterRequest {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    company_id: number;
    user_id: number;
    role_id: number;
    employee_id: number;
  };
}

export interface JWTPayload {
  user_id: number;
  company_id: number;
  employee_id: number;
  role_id: number;
  role_name: string;
}

// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    error_code: string;
    message: string;
  };
}

export interface ApiError {
  error_code: string;
  message: string;
}
```

## 📦 FASE 2: Configuración Base

### PASO 1: Cliente API Completo (`lib/api.ts`)

```typescript
// lib/api.ts - IMPLEMENTACIÓN COMPLETA
import { RegisterRequest, LoginRequest, AuthResponse, RegisterResponse, ApiResponse } from '@/types/auth';
import { Employee, Role, Shift } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // ===== AUTENTICACIÓN =====
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse['data']>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== EMPLEADOS =====
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.request<Employee[]>('/api/v1/employees');
  }

  async createEmployee(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return this.request<Employee>('/api/v1/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return this.request<Employee>(`/api/v1/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== ROLES =====
  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request<Role[]>('/api/v1/roles');
  }

  async createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
    return this.request<Role>('/api/v1/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== TURNOS =====
  async getShifts(filters?: { startDate?: string; endDate?: string }): Promise<ApiResponse<Shift[]>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/shifts?${queryString}` : '/api/v1/shifts';
    
    return this.request<Shift[]>(endpoint);
  }

  async createShift(data: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return this.request<Shift>('/api/v1/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShift(id: number, data: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return this.request<Shift>(`/api/v1/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteShift(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/shifts/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; services: any }>> {
    return this.request<any>('/api/v1/health');
  }
}

export const apiClient = new ApiClient();
```

### PASO 2: Tipos TypeScript Completos (`types/`)

Crear `types/auth.ts`:
```typescript
// types/auth.ts
export interface RegisterRequest {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    company_id: number;
    user_id: number;
    role_id: number;
    employee_id: number;
  };
}

export interface JWTPayload {
  user_id: number;
  company_id: number;
  employee_id: number;
  role_id: number;
  role_name: string;
  iat?: number;
  exp?: number;
}
```

Crear `types/api.ts`:
```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    error_code: string;
    message: string;
  };
}

export interface ApiError {
  error_code: string;
  message: string;
}

export interface Employee {
  id: number;
  user_id: number;
  company_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Role {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: number;
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}
```

### ✅ Criterios de Éxito Fase 2
- [ ] `lib/api.ts` creado con cliente completo
- [ ] `types/auth.ts` creado con interfaces
- [ ] `types/api.ts` creado con modelos
- [ ] No errores de TypeScript en estos archivos

### Middleware de Autenticación Next.js (`middleware.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret'
);

const protectedRoutes = ['/dashboard', '/employees', '/schedule', '/reports', '/settings'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Ruta protegida sin token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Ruta de auth con token válido
  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Token inválido, continuar a la página de auth
    }
  }

  // Verificar validez del token en rutas protegidas
  if (isProtectedRoute && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Agregar información del usuario al header para uso en componentes
      const response = NextResponse.next();
      response.headers.set('x-user-data', JSON.stringify(payload));
      return response;
    } catch (error) {
      // Token inválido, redirigir a login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Hook de Autenticación (`hooks/useAuth.ts`)

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { LoginRequest, RegisterRequest, JWTPayload } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query para obtener usuario actual
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      // Decodificar JWT para obtener datos del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
        return payload;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (response) => {
      const { token } = response.data;
      apiClient.setToken(token);
      
      // Guardar token en cookie para middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 días
      
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: () => {
      router.push('/login');
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  // Función de logout
  const logout = () => {
    apiClient.clearToken();
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    queryClient.clear();
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

### Store de Autenticación (`stores/authStore.ts`)

```typescript
import { create } from 'zustand';
import { JWTPayload } from '@/types/auth';

interface AuthState {
  user: JWTPayload | null;
  isAuthenticated: boolean;
  setUser: (user: JWTPayload | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
```

### Variables de Entorno (`.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# JWT Configuration (debe coincidir con el backend)
JWT_SECRET=your-super-secret-jwt-key-here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME="Vibe Calendar"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Development
NODE_ENV=development

# Database (si necesitas conexión directa desde frontend)
# DATABASE_URL="postgresql://user:password@localhost:5432/vibe_calendar"
```

### Variables de Entorno de Producción (`.env.production`)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com

# JWT Configuration
JWT_SECRET=your-production-secret-key

# Next.js Configuration
NEXT_PUBLIC_APP_NAME="Vibe Calendar"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Production
NODE_ENV=production
```

**⚠️ Importante**: 
- Variables con `NEXT_PUBLIC_` son accesibles en el cliente
- `JWT_SECRET` solo es accesible en el servidor (middleware)
- Nunca commits archivos `.env.*` con datos sensibles

## ⚙️ Configuraciones Clave

### 1. Tailwind Config (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2. TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🎨 Sistema de Tema (Dark/Light)

### Características
- **Soporte completo** para modo claro y oscuro
- **Persistencia** en localStorage
- **Cambio dinámico** sin recarga de página
- **Variables CSS personalizadas** para colores
- **Componentes theme-aware** por defecto

### Implementación
- `ThemeProvider` wrapeando la aplicación
- Hook `useTheme` para cambiar tema
- Clases `dark:` de Tailwind para estilos condicionales
- Variables CSS en `:root` y `[data-theme="dark"]`

## 📦 FASE 1: Setup Inicial y Dependencias

### Comandos de Instalación (VERSIONES ESPECÍFICAS)

```bash
# 1. Crear proyecto Next.js con configuración específica
npx create-next-app@14.1.0 frontend-project --typescript --tailwind --eslint --app --import-alias "@/*"
cd frontend-project

# 2. Instalar dependencias principales con versiones exactas
npm install zustand@4.4.7 @tanstack/react-query@5.17.15 date-fns@3.0.6
npm install jose@5.2.0  # Para verificación JWT en middleware

# 3. Instalar shadcn/ui y componentes UI
npx shadcn-ui@0.8.0 init --defaults
npx shadcn-ui@0.8.0 add button card input label form select badge

# 4. Instalar dependencias adicionales para UI
npm install lucide-react@0.307.0 framer-motion@10.16.16 clsx@2.0.0 tailwind-merge@2.2.0

# 5. Instalar Zod para validaciones
npm install zod@3.22.4 @hookform/resolvers@3.3.2 react-hook-form@7.48.2

# 6. Instalar herramientas de desarrollo
npm install -D @types/node@20.10.6

# 7. Crear variables de entorno
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
JWT_SECRET=vibe-calendar-super-secret-jwt-key-2024
NEXT_PUBLIC_APP_NAME=Vibe Calendar
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
EOF

# 8. Crear estructura de directorios completa
mkdir -p {components/{ui,navigation,employees,schedule},hooks,lib,providers,stores,types}
mkdir -p app/{api/{_utils,auth/{login,logout,register},employees,roles,shifts},(auth)/{login,register},(app)/{dashboard,employees,schedule,reports,settings}}
```

### Validación de Fase 1
```bash
# Verificar instalación
npm list | grep -E "(next|react|zustand|@tanstack)"
# Verificar estructura
ls -la components/ hooks/ lib/ stores/ types/
# Verificar variables de entorno
cat .env.local
```

### ✅ Criterios de Éxito Fase 1
- [ ] Proyecto Next.js 14.1.0 creado
- [ ] Todas las dependencias instaladas correctamente
- [ ] Estructura de directorios creada
- [ ] Variables de entorno configuradas
- [ ] `npm run dev` ejecuta sin errores

### Configuración Rápida del Backend

Si es la primera vez que ejecutas el backend:

```bash
# En directorio backend/
npm install

# Configurar base de datos PostgreSQL
cd db
docker-compose up -d  # Levanta PostgreSQL en Docker

# Migrar base de datos
cd ..
npx prisma migrate dev

# Ejecutar servidor
npm run dev
```

## 📋 VALIDACIÓN Y TESTING AUTOMÁTICO

### Scripts de Validación

Crear `scripts/validate.sh`:
```bash
#!/bin/bash
# scripts/validate.sh - Script de validación automática

echo "🔍 Iniciando validación del proyecto..."

# 1. Verificar dependencias
echo "✅ Verificando dependencias..."
npm list --depth=0 > /dev/null || { echo "❌ Error en dependencias"; exit 1; }

# 2. Verificar TypeScript
echo "✅ Verificando TypeScript..."
npx tsc --noEmit || { echo "❌ Errores de TypeScript"; exit 1; }

# 3. Verificar ESLint
echo "✅ Verificando ESLint..."
npx eslint . --ext .ts,.tsx || { echo "❌ Errores de ESLint"; exit 1; }

# 4. Verificar estructura de archivos
echo "✅ Verificando estructura..."
required_dirs=("components" "hooks" "lib" "stores" "types" "app/api" "app/(auth)" "app/(app)")
for dir in "${required_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Falta directorio: $dir"
    exit 1
  fi
done

# 5. Verificar archivos clave
required_files=("lib/api.ts" "types/auth.ts" "types/api.ts" "middleware.ts" ".env.local")
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Falta archivo: $file"
    exit 1
  fi
done

# 6. Verificar que la app compila
echo "✅ Verificando compilación..."
npm run build > /dev/null || { echo "❌ Error en compilación"; exit 1; }

echo "🎉 ¡Validación completada exitosamente!"
```

### Criterios de Éxito por Componente

#### ✅ Autenticación
- [ ] Login funcional con validación
- [ ] Register funcional con empresa
- [ ] JWT storage en localStorage y cookies
- [ ] Middleware redirecciona correctamente
- [ ] Logout limpia todo el estado

#### ✅ Navegación
- [ ] Sidebar visible en todas las páginas app
- [ ] Rutas protegidas no accesibles sin auth
- [ ] Transiciones suaves entre páginas
- [ ] Active state en navegación

#### ✅ API Integration
- [ ] Todas las llamadas al backend funcionan
- [ ] Manejo de errores implementado
- [ ] Loading states visibles
- [ ] React Query cache funcionando

#### ✅ UI/UX
- [ ] Responsive en mobile/tablet/desktop
- [ ] Tema claro/oscuro funcional
- [ ] Formularios con validación
- [ ] Feedback visual para acciones

### Tests E2E Básicos

Crear `cypress/e2e/auth.cy.ts`:
```typescript
// cypress/e2e/auth.cy.ts
describe('Autenticación', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('Debe poder hacer login exitosamente', () => {
    cy.get('[data-testid=email-input]').type('admin@example.com')
    cy.get('[data-testid=password-input]').type('Chatwoot1!')
    cy.get('[data-testid=login-button]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid=sidebar]').should('be.visible')
  })

  it('Debe mostrar error con credenciales inválidas', () => {
    cy.get('[data-testid=email-input]').type('wrong@email.com')
    cy.get('[data-testid=password-input]').type('wrongpassword')
    cy.get('[data-testid=login-button]').click()
    
    cy.get('[data-testid=error-message]').should('be.visible')
  })
})
```

## 🛠️ Convenciones y Estándares OBLIGATORIOS

### Nomenclatura ESTRICTA
- **Componentes**: PascalCase (ej. `UserProfile.tsx`)
- **Archivos**: camelCase (ej. `authStore.ts`)
- **Carpetas**: lowercase (ej. `components/`, `hooks/`)
- **Constantes**: SCREAMING_SNAKE_CASE (ej. `API_BASE_URL`)
- **Data testids**: kebab-case (ej. `data-testid="login-button"`)

### Imports ORDENADOS
```typescript
// 1. React y Next.js
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. Librerías externas
import { useMutation } from '@tanstack/react-query'

// 3. Imports internos (usando alias @/)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'

// 4. Tipos
import type { LoginRequest } from '@/types/auth'
```

### Estructura de Componentes REQUERIDA
```typescript
// Estructura OBLIGATORIA para todos los componentes
import React from 'react'
import type { ComponentProps } from '@/types/components'

interface Props {
  title: string
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
}

export const Component: React.FC<Props> = ({
  title,
  isLoading = false,
  children,
  className = ''
}) => {
  return (
    <div className={`p-4 ${className}`} data-testid="component-container">
      <h2 className="text-xl font-semibold" data-testid="component-title">
        {title}
      </h2>
      {isLoading ? (
        <div data-testid="loading-spinner">Cargando...</div>
      ) : (
        children
      )}
    </div>
  )
}
```

### Testing OBLIGATORIO
- **Ubicación**: `__tests__/` dentro de cada directorio
- **Convención**: `Component.test.tsx`
- **Data testids**: TODOS los elementos interactivos
- **Cobertura mínima**: 80% en componentes críticos

## 🎯 Próximos Pasos de Desarrollo

### Fase 1: Configuración Base ✅
1. ✅ Configurar proyecto Next.js con stack definido
2. ✅ Configurar integración con backend Express + Prisma
3. ✅ Implementar sistema de autenticación JWT
4. ✅ Setup de estado global (Zustand + React Query)
5. ✅ Configurar middleware de autenticación

### Fase 2: Autenticación y Navegación
1. Crear páginas de Login y Register con validación
2. Implementar sidebar permanente con navegación
3. Configurar layouts para rutas auth vs app
4. Implementar protección de rutas

### Fase 3: Dashboard y Gestión de Empleados
1. Crear dashboard principal con métricas
2. Implementar CRUD completo de empleados
3. Integrar gestión de roles
4. Crear formularios reactivos con React Hook Form

### Fase 4: Planilla de Turnos
1. Implementar vista semanal de turnos
2. Crear componentes drag & drop para asignación
3. Integrar filtros y búsquedas
4. Implementar reportes básicos

### Fase 5: Características Avanzadas
1. Implementar sistema de notificaciones
2. Agregar exportación de reportes
3. Optimización de performance
4. Testing completo e2e

---

## 💡 Notas Importantes

### Backend Integration
- **Sincronización**: El frontend está completamente sincronizado con tu backend Express + Prisma
- **Tipos Compartidos**: Los tipos TypeScript reflejan exactamente tu esquema de base de datos
- **Autenticación**: JWT implementado con middleware de Next.js para protección de rutas
- **Error Handling**: Manejo consistente de errores entre frontend y backend

### Mejores Prácticas
- **Accesibilidad**: Todos los componentes siguen estándares WCAG
- **Performance**: React Query para optimización de llamadas API
- **SEO**: Meta tags dinámicos para cada vista
- **Responsive**: Mobile-first approach con Tailwind breakpoints
- **Seguridad**: Validación tanto en frontend como backend

### Estructura del Proyecto
- **Sidebar Permanente**: La navegación persiste en todas las páginas de la app [[memory:6460679]]
- **API Routes**: Next.js API routes como proxy al backend Express
- **Middleware**: Protección automática de rutas con verificación JWT
- **Estado Global**: Combinación de Zustand para UI y React Query para server state

## 🚨 TROUBLESHOOTING COMÚN

### Errores de Instalación

#### Error: "Cannot find module 'next'"
```bash
# Solución
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Module not found: Can't resolve '@/'"
```bash
# Verificar tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Errores de Autenticación

#### Error: "JWT malformed"
```typescript
// Verificar formato en middleware.ts
const token = request.cookies.get('auth_token')?.value;
if (!token || !token.startsWith('eyJ')) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

#### Error: "Invalid credentials" pero usuario existe
```bash
# Verificar backend está corriendo
curl http://localhost:3001/api/v1/health

# Verificar variables de entorno
echo $NEXT_PUBLIC_API_BASE_URL
```

### Errores de Compilación

#### Error: "Type 'string | undefined' is not assignable"
```typescript
// Usar non-null assertion o verificar
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
// O
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
```

#### Error: "Cannot use import statement outside a module"
```json
// Verificar package.json tiene
{
  "type": "module"
}
```

### Errores de UI

#### Sidebar no se ve en móvil
```css
/* Verificar en globals.css */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
```

#### Tema oscuro no funciona
```typescript
// Verificar ThemeProvider en layout.tsx
import { ThemeProvider } from '@/providers/ThemeProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Comandos de Diagnóstico

```bash
# Verificar toda la configuración
npm run lint
npm run type-check
npm run build

# Verificar conexión con backend
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Chatwoot1!"}'

# Verificar estructura de archivos
find . -name "*.ts" -o -name "*.tsx" | grep -E "(api|auth|components)" | head -20
```

### Lista de Verificación Rápida

- [ ] Backend corriendo en puerto 3001
- [ ] `.env.local` existe con variables correctas
- [ ] `lib/api.ts` importa tipos correctamente
- [ ] `middleware.ts` está en la raíz del proyecto
- [ ] Todas las páginas tienen `data-testid`
- [ ] `npm run build` ejecuta sin errores

---

Este README servirá como **guía fundacional EJECUTABLE** para generar un frontend completamente funcional e integrado con tu backend de planilla de turnos.
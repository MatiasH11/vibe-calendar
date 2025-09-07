# 🔐 FASE 3: Autenticación Base

## 🎯 Objetivo
Configurar sistema de autenticación base: middleware, hooks y store. **Sin crear vistas** de login/register.

## 🛡️ PASO 1: Middleware JWT

### `middleware.ts` (raíz del proyecto)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vibe-calendar-jwt-secret-2024'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !token) {
    // Redireccionar a página de inicio por ahora (no existe /login aún)
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtected && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Token inválido, limpiar cookie y redireccionar
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## 🎣 PASO 2: Hook de Autenticación Base

### `hooks/useAuth.ts`
```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { LoginRequest, RegisterRequest, JWTPayload } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setUser(payload);
          apiClient.setToken(token);
        }
      } catch {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await apiClient.login(data);
      if (response.success && response.data?.token) {
        const token = response.data.token;
        apiClient.setToken(token);
        
        // Guardar en cookie para middleware
        document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 días
        
        const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
        setUser(payload);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.clearToken();
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
```

## 🏪 PASO 3: Store de Autenticación

### `stores/authStore.ts`
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

## 🌐 PASO 4: Providers Base

### `lib/providers.tsx`
```typescript
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Actualizar `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vibe Calendar',
  description: 'Sistema de gestión de turnos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

## ✅ Validación

```bash
# Verificar middleware (Windows)
dir middleware.ts

# Verificar hooks y stores (Windows)
dir hooks
dir stores

# Verificar compilación
npm run build
```

## 🎯 Resultado

- **Middleware JWT** protegiendo rutas
- **Hook useAuth** listo para usar en vistas
- **Store de autenticación** configurado
- **Providers** base configurados
- **Infraestructura de auth** lista

**La base de autenticación está preparada** para implementar páginas de login/register después.

# 🔗 FASE 3: Integración con Hooks y Estado

## 🎯 Objetivo
Integrar completamente los formularios y páginas con el hook `useAuth` existente y manejar estados de autenticación.

## 🔄 PASO 1: Mejorar el Hook useAuth

### Actualizar `src/hooks/useAuth.ts`
```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { LoginRequest, RegisterRequest, JWTPayload } from '@/types/auth';
import { LoginResponse } from '@/types/api';

export function useAuth() {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  // Inicializar usuario al cargar
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setUser(payload);
          apiClient.setToken(token);
        } else {
          // Token expirado
          await logout();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      setIsAuthenticating(true);
      const response = await apiClient.login(data);
      
      if (response.success && response.data) {
        const loginData = response.data as LoginResponse;
        const token = loginData.token;
        
        // Configurar token en cliente API
        apiClient.setToken(token);
        
        // Guardar en cookie para middleware
        document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 días
        
        // Decodificar y guardar usuario
        const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
        setUser(payload);
        
        // Redireccionar al dashboard
        router.push('/dashboard');
        return response;
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      // Limpiar estado local
      setUser(null);
      apiClient.clearToken();
      
      // Limpiar cookies
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // Redireccionar a home
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsAuthenticating(true);
      const response = await apiClient.register(data);
      
      if (response.success) {
        // No hacer login automático, ir a página de login
        router.push('/login?message=Registro exitoso. Por favor inicia sesión.');
        return response;
      } else {
        throw new Error('Error en el registro');
      }
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthenticating,
    login,
    logout,
    register,
    initializeAuth,
  };
}
```

## 📱 PASO 2: Hook para Mensajes de Estado

### Crear `src/hooks/useMessages.ts`
```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useMessages() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    const error = searchParams.get('error');
    
    if (urlMessage) {
      setMessage(urlMessage);
      setMessageType('success');
    } else if (error) {
      setMessage(error);
      setMessageType('error');
    }
  }, [searchParams]);

  const clearMessage = () => {
    setMessage(null);
  };

  return {
    message,
    messageType,
    clearMessage,
  };
}
```

## 🔄 PASO 3: Actualizar Formularios con Integración Completa

### Actualizar `src/components/auth/LoginForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import Link from 'next/link';

export function LoginForm() {
  const { login, isAuthenticating } = useAuth();
  const { message, messageType, clearMessage } = useMessages();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      clearMessage();
      await login(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mensaje de la URL */}
        {message && (
          <div className={`p-3 rounded-md mb-4 ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : messageType === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              messageType === 'success' 
                ? 'text-green-600' 
                : messageType === 'error'
                ? 'text-red-600'
                : 'text-blue-600'
            }`}>
              {message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              {...register('email')}
              disabled={isAuthenticating}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isAuthenticating}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isAuthenticating}>
            {isAuthenticating ? (
              <>
                <Loading size="sm" className="mr-2" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Actualizar `src/components/auth/RegisterForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function RegisterForm() {
  const { register: registerUser, isAuthenticating } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...registerData } = data;
      
      await registerUser(registerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Registra tu empresa en Vibe Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de la Empresa</Label>
            <Input
              id="company_name"
              placeholder="Mi Empresa S.A."
              {...register('company_name')}
              disabled={isAuthenticating}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                placeholder="Juan"
                {...register('first_name')}
                disabled={isAuthenticating}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                placeholder="Pérez"
                {...register('last_name')}
                disabled={isAuthenticating}
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@miempresa.com"
              {...register('email')}
              disabled={isAuthenticating}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isAuthenticating}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isAuthenticating}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isAuthenticating}>
            {isAuthenticating ? (
              <>
                <Loading size="sm" className="mr-2" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔒 PASO 4: Actualizar Cliente API para Register

### Actualizar `src/lib/api.ts`
```typescript
// Agregar método register si no existe
async register(data: RegisterRequest) {
  return this.request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

## ✅ Validación

```bash
# Verificar hooks actualizados
npx tsc --noEmit

# Verificar que no hay errores de import
npm run build

# Verificar archivos creados
dir src\hooks\useAuth.ts
dir src\hooks\useMessages.ts
```

## 🎯 Resultado

- ✅ **Hook useAuth** mejorado con estados completos
- ✅ **Hook useMessages** para manejo de notificaciones
- ✅ **Formularios** integrados completamente
- ✅ **Estados de loading** consistentes
- ✅ **Manejo de errores** robusto
- ✅ **Redirecciones** automáticas configuradas

**La integración está completa** y lista para funcionar con el backend.

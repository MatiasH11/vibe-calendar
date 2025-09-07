# 📝 FASE 1: Formularios de Autenticación

## 🎯 Objetivo
Crear componentes de formularios reutilizables para login y register usando shadcn/ui y validaciones con zod.

## 🔧 PASO 1: Schemas de Validación

### `src/lib/validations/auth.ts`
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  company_name: z
    .string()
    .min(1, 'El nombre de la empresa es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  first_name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z
    .string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

## 📋 PASO 2: Componente de Login

### `src/components/auth/LoginForm.tsx`
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
import Link from 'next/link';

export function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      setError(null);
      await login(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              {...register('email')}
              disabled={isLoading}
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
              disabled={isLoading}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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

## 📋 PASO 3: Componente de Register

### `src/components/auth/RegisterForm.tsx`
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
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      setError(null);
      
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...registerData } = data;
      
      const response = await apiClient.register(registerData);
      
      if (response.success) {
        // Redirigir a login con mensaje de éxito
        router.push('/login?message=Registro exitoso. Inicia sesión para continuar.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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

## 📦 PASO 4: Dependencias Adicionales

### Instalar react-hook-form y resolver
```bash
npm install react-hook-form @hookform/resolvers
```

## ✅ Validación

```bash
# Verificar dependencias instaladas
npm list react-hook-form @hookform/resolvers

# Verificar TypeScript
npx tsc --noEmit

# Verificar archivos creados (Windows)
dir src\lib\validations\auth.ts
dir src\components\auth\LoginForm.tsx
dir src\components\auth\RegisterForm.tsx
```

## 🎯 Resultado

- ✅ **Schemas de validación** con zod configurados
- ✅ **LoginForm** component funcional
- ✅ **RegisterForm** component funcional  
- ✅ **Validaciones** en tiempo real
- ✅ **Estados de loading** implementados
- ✅ **Manejo de errores** configurado

**Los formularios están listos** para ser usados en las páginas de autenticación.

# 📄 FASE 2: Páginas de Login y Register

## 🎯 Objetivo
Crear las páginas Next.js para login y register con layouts responsivos y navegación correcta.

## 🏗️ PASO 1: Estructura de Rutas

Crear la siguiente estructura en el App Router:
```
src/app/
├── (auth)/
│   ├── layout.tsx          # Layout común para auth
│   ├── login/
│   │   └── page.tsx        # Página de login
│   └── register/
│       └── page.tsx        # Página de register
```

## 🎨 PASO 2: Layout de Autenticación

### `src/app/(auth)/layout.tsx`
```typescript
import { APP_NAME } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo - Branding */}
      <div className="lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white">
        <div className="flex flex-col justify-center items-center text-center lg:text-left">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{APP_NAME}</h1>
            <p className="text-xl text-blue-100 mb-6">
              Gestiona los turnos de tu equipo de manera eficiente
            </p>
          </div>
          
          <div className="space-y-4 text-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Planificación automática de turnos</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Gestión completa de empleados</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Reportes y estadísticas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
```

## 🔐 PASO 3: Página de Login

### `src/app/(auth)/login/page.tsx`
```typescript
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loading } from '@/components/ui/loading';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Vibe Calendar',
  description: 'Inicia sesión en Vibe Calendar para gestionar los turnos de tu equipo',
};

// Componente para manejar search params de manera segura
function LoginContent() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="flex justify-center">
          <Loading size="lg" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
```

## 📝 PASO 4: Página de Register

### `src/app/(auth)/register/page.tsx`
```typescript
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Vibe Calendar',
  description: 'Crea tu cuenta en Vibe Calendar y comienza a gestionar los turnos de tu equipo',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
    </div>
  );
}
```

## 🏠 PASO 5: Actualizar Página de Inicio

### Actualizar `src/app/page.tsx`
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {APP_NAME}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La solución completa para gestionar los turnos de trabajo de tu equipo.
            Simplifica la planificación y optimiza la productividad.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>📅 Planificación Inteligente</CardTitle>
              <CardDescription>
                Crea y gestiona turnos de manera automática considerando disponibilidad y preferencias.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>👥 Gestión de Equipos</CardTitle>
              <CardDescription>
                Administra empleados, roles y permisos desde una interfaz intuitiva.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>📊 Reportes Detallados</CardTitle>
              <CardDescription>
                Analiza productividad, asistencia y costos con reportes completos.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

## 🔄 PASO 6: Redirecciones Automáticas

### Crear `src/components/auth/AuthRedirect.tsx`
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthRedirect({ 
  children, 
  redirectTo = '/dashboard',
  requireAuth = false 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (!requireAuth && isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Si requiere auth y no está autenticado, o viceversa, no mostrar contenido
  if (
    (requireAuth && !isAuthenticated) || 
    (!requireAuth && isAuthenticated)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### Actualizar layout de auth para usar redirección
```typescript
// Agregar al final de src/app/(auth)/layout.tsx
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect>
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* ... resto del código del layout ... */}
      </div>
    </AuthRedirect>
  );
}
```

## 🗂️ PASO 7: Crear Directorios

```bash
# Crear estructura de directorios (Windows)
mkdir src\app\(auth)
mkdir src\app\(auth)\login  
mkdir src\app\(auth)\register
mkdir src\components\auth
mkdir src\lib\validations
```

## ✅ Validación

```bash
# Verificar estructura creada (Windows)
dir src\app\(auth)
dir src\app\(auth)\login
dir src\app\(auth)\register

# Verificar que compila sin errores
npx tsc --noEmit

# Verificar que el build funciona
npm run build
```

## 🎯 Resultado

- ✅ **Estructura de rutas** Next.js configurada
- ✅ **Layout de autenticación** responsivo
- ✅ **Página de login** funcional
- ✅ **Página de register** funcional
- ✅ **Página de inicio** actualizada
- ✅ **Redirecciones automáticas** implementadas
- ✅ **Metadata SEO** configurado

**Las páginas están listas** para integrar con los hooks de autenticación.

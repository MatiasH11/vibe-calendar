# 🏗️ FASE 1: Layout Base del Dashboard

## 🎯 Objetivo
Crear la estructura base del layout del dashboard que ocupe toda la pantalla sin scroll, con sidebar fijo y área de contenido fluido.

## 📐 PASO 1: Estructura de Layout Principal

### Crear `src/app/(dashboard)/layout.tsx`
```typescript
'use client';

import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardProvider } from '@/components/dashboard/DashboardProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect requireAuth={true}>
      <DashboardProvider>
        <div className="h-screen w-screen overflow-hidden bg-gray-50">
          {/* Layout principal: sidebar + contenido */}
          <div className="flex h-full">
            {/* Sidebar fijo */}
            <Sidebar />
            
            {/* Área de contenido principal */}
            <main className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DashboardProvider>
    </AuthRedirect>
  );
}
```

### Actualizar `src/app/(dashboard)/page.tsx`
```typescript
'use client';

import { DashboardHome } from '@/components/dashboard/views/DashboardHome';

export default function DashboardPage() {
  return <DashboardHome />;
}
```

## 🎨 PASO 2: Provider de Contexto del Dashboard

### Crear `src/components/dashboard/DashboardProvider.tsx`
```typescript
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  breadcrumbs: string[];
  setBreadcrumbs: (breadcrumbs: string[]) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState(['Dashboard']);

  const value = {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    breadcrumbs,
    setBreadcrumbs,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
```

## 📱 PASO 3: Componente Sidebar Base

### Crear `src/components/dashboard/Sidebar.tsx`
```typescript
'use client';

import { APP_NAME } from '@/lib/constants';
import { useDashboard } from './DashboardProvider';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarCollapsed } = useDashboard();

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">VC</span>
          </div>
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
          )}
        </div>
      </div>

      {/* Área de navegación */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {/* Los items de navegación se agregarán en la Fase 2 */}
          <div className="text-sm text-gray-500">
            {sidebarCollapsed ? "•••" : "Navegación (Fase 2)"}
          </div>
        </div>
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {sidebarCollapsed ? "U" : "Usuario (Fase 2)"}
        </div>
      </div>
    </aside>
  );
}
```

## 🖥️ PASO 4: Vista Principal Temporal

### Crear `src/components/dashboard/views/DashboardHome.tsx`
```typescript
'use client';

import { useDashboard } from '../DashboardProvider';
import { FadeIn } from '@/components/ui/transitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export function DashboardHome() {
  const { setBreadcrumbs } = useDashboard();

  // Establecer breadcrumbs para esta vista
  useEffect(() => {
    setBreadcrumbs(['Dashboard']);
  }, [setBreadcrumbs]);

  return (
    <div className="p-6 space-y-6">
      <FadeIn delay={0.1}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control de turnos
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ✅ Layout principal funcionando
              </p>
              <p className="text-sm text-gray-600">
                ✅ Sidebar base implementado
              </p>
              <p className="text-sm text-gray-600">
                ✅ Área de contenido fluido
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                🔲 Navegación del sidebar (Fase 2)
              </p>
              <p className="text-sm text-gray-600">
                🔲 Sistema de ruteo (Fase 3)
              </p>
              <p className="text-sm text-gray-600">
                🔲 Vistas adicionales (Fase 4)
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Especificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                📐 Altura: 100vh sin scroll
              </p>
              <p className="text-sm text-gray-600">
                📱 Responsive: Sidebar adaptable
              </p>
              <p className="text-sm text-gray-600">
                🎨 Diseño: Coherente con auth
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
```

## 🗂️ PASO 5: Migrar Dashboard Actual

### Mover dashboard actual para conservar logout
```typescript
// Conservar la funcionalidad de logout del dashboard actual
```

### Crear `src/components/dashboard/views/TestView.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { FadeIn } from '@/components/ui/transitions';

export function TestView() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <FadeIn delay={0.1}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vista de Pruebas
            </h1>
            <p className="text-gray-600 mt-2">Dashboard temporal para testing</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Cerrar Sesión
          </Button>
        </div>
      </FadeIn>

      {/* Welcome Section */}
      <FadeIn delay={0.2}>
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">
              ¡Sistema de Layout Funcionando! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              El nuevo layout con sidebar está activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Usuario ID:</strong> {user.sub}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Email:</strong> {user.email || 'No disponible'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-700">
                    <strong>Empresa ID:</strong> {user.company_id || 'No disponible'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
```

## 📦 PASO 6: Verificar Dependencias

### Instalar iconos solo si es necesario
```bash
# Verificar si lucide-react está instalado
npm list lucide-react

# Solo instalar si no está instalado
npm install lucide-react
```

## ✅ Validación

```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar compilación
npm run build

# Verificar estructura creada
dir src\app\(dashboard)
dir src\components\dashboard
```

## 🎯 Resultado

- ✅ **Layout base** ocupando toda la pantalla (100vh)
- ✅ **Sidebar fijo** con estructura base
- ✅ **Área de contenido** fluido y scrolleable
- ✅ **Provider de contexto** para estado del dashboard
- ✅ **Vista principal** temporal funcionando
- ✅ **Migración** del dashboard anterior preservada

**La base del layout está lista** para implementar navegación en la Fase 2.

# 🔄 FASE 3: Sistema de Navegación Dinámico

## 🎯 Objetivo
Implementar un sistema de navegación fluida entre vistas del dashboard sin perder el sidebar, con breadcrumbs, hooks de navegación, y transiciones suaves.

## 🧠 PASO 1: Hook de Navegación del Dashboard

### Crear `src/hooks/useDashboardNavigation.ts`
```typescript
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { useEffect } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  breadcrumbs: string[];
}

const navigationMap: Record<string, NavigationItem> = {
  '/dashboard': {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    breadcrumbs: ['Dashboard'],
  },
  '/dashboard/empleados': {
    id: 'empleados',
    label: 'Empleados',
    href: '/dashboard/empleados',
    breadcrumbs: ['Dashboard', 'Empleados'],
  },
  '/dashboard/turnos': {
    id: 'turnos',
    label: 'Turnos',
    href: '/dashboard/turnos',
    breadcrumbs: ['Dashboard', 'Turnos'],
  },
  '/dashboard/reportes': {
    id: 'reportes',
    label: 'Reportes',
    href: '/dashboard/reportes',
    breadcrumbs: ['Dashboard', 'Reportes'],
  },
  '/dashboard/configuracion': {
    id: 'configuracion',
    label: 'Configuración',
    href: '/dashboard/configuracion',
    breadcrumbs: ['Dashboard', 'Configuración'],
  },
};

export function useDashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentView, setBreadcrumbs, isMobile, setSidebarOpen } = useDashboard();

  // Actualizar vista actual basado en la ruta
  useEffect(() => {
    const currentNav = navigationMap[pathname];
    if (currentNav) {
      setCurrentView(currentNav.id);
      setBreadcrumbs(currentNav.breadcrumbs);
    }
  }, [pathname, setCurrentView, setBreadcrumbs]);

  const navigateTo = (href: string) => {
    const navItem = navigationMap[href];
    if (navItem) {
      setCurrentView(navItem.id);
      setBreadcrumbs(navItem.breadcrumbs);
      router.push(href);
      
      // Cerrar sidebar en móvil después de navegar
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  const getCurrentNavigation = () => {
    return navigationMap[pathname] || navigationMap['/dashboard'];
  };

  return {
    navigateTo,
    getCurrentNavigation,
    navigationMap,
    currentPath: pathname,
  };
}
```

## 📍 PASO 2: Componente de Breadcrumbs

### Crear `src/components/dashboard/Breadcrumbs.tsx`
```typescript
'use client';

import { useDashboard } from './DashboardProvider';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs } = useDashboard();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      <Home className="w-4 h-4 text-gray-500" />
      
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span 
            className={cn(
              index === breadcrumbs.length - 1
                ? "text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {crumb}
          </span>
        </div>
      ))}
    </nav>
  );
}
```

## 🎭 PASO 3: Header del Dashboard

### Crear `src/components/dashboard/DashboardHeader.tsx`
```typescript
'use client';

import { useDashboard } from './DashboardProvider';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { isMobile, sidebarOpen, setSidebarOpen } = useDashboard();
  const { getCurrentNavigation } = useDashboardNavigation();
  
  const currentNav = getCurrentNavigation();
  const displayTitle = title || currentNav.label;

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Botón menú móvil */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          <div>
            {/* Breadcrumbs */}
            <Breadcrumbs className="mb-1" />
            
            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900">
              {displayTitle}
            </h1>
            
            {/* Subtítulo */}
            {subtitle && (
              <p className="text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Área de acciones personalizadas */}
        {children && (
          <div className="flex items-center space-x-3">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
```

## 🎨 PASO 4: Componente de Contenedor de Vista

### Crear `src/components/dashboard/ViewContainer.tsx`
```typescript
'use client';

import { FadeIn } from '@/components/ui/transitions';
import { DashboardHeader } from './DashboardHeader';
import { cn } from '@/lib/utils';

interface ViewContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  showHeader?: boolean;
}

export function ViewContainer({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  className,
  showHeader = true 
}: ViewContainerProps) {
  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <DashboardHeader title={title} subtitle={subtitle}>
          {headerActions}
        </DashboardHeader>
      )}
      
      <div className={cn("flex-1 overflow-y-auto", className)}>
        <FadeIn delay={0.1}>
          {children}
        </FadeIn>
      </div>
    </div>
  );
}
```

## 🏠 PASO 5: Actualizar Vista Principal

### Actualizar `src/components/dashboard/views/DashboardHome.tsx`
```typescript
'use client';

import { ViewContainer } from '../ViewContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/transitions';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

const statsCards = [
  {
    title: 'Empleados Activos',
    value: '24',
    change: '+2 este mes',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Turnos Programados',
    value: '156',
    change: '+12 esta semana',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Horas Totales',
    value: '1,248',
    change: '+5.2% vs mes anterior',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Eficiencia',
    value: '94.2%',
    change: '+1.8% mejora',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function DashboardHome() {
  return (
    <ViewContainer 
      title="Dashboard" 
      subtitle="Resumen general de tu sistema de turnos"
    >
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <FadeIn key={stat.title} delay={0.1 + index * 0.1}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad Reciente */}
          <FadeIn delay={0.5}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    'Juan Pérez fue asignado al turno de mañana',
                    'Se creó nuevo turno para el departamento de ventas',
                    'María González completó su turno de 8 horas',
                    'Se generó reporte mensual de asistencia',
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{activity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Alertas y Notificaciones */}
          <FadeIn delay={0.6}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Alertas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Turno sin cubrir
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      El turno de noche del viernes necesita asignación
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Horas extra disponibles
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      3 empleados disponibles para horas extra esta semana
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Meta mensual alcanzada
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Se cumplió el 100% de cobertura de turnos este mes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </ViewContainer>
  );
}
```

## 🔄 PASO 6: Actualizar Componente de Navegación

### Actualizar `src/components/dashboard/NavigationItem.tsx`
```typescript
'use client';

import { cn } from '@/lib/utils';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { LucideIcon } from 'lucide-react';

interface NavigationItemProps {
  item: {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
  };
  collapsed: boolean;
}

export function NavigationItem({ item, collapsed }: NavigationItemProps) {
  const { navigateTo, currentPath } = useDashboardNavigation();
  
  const isActive = currentPath === item.href;

  const handleClick = () => {
    navigateTo(item.href);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center text-left transition-all duration-200 rounded-lg group",
        collapsed ? "p-2 justify-center" : "p-3 space-x-3",
        isActive
          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon 
        className={cn(
          "flex-shrink-0 transition-colors duration-200",
          collapsed ? "w-5 h-5" : "w-5 h-5",
          isActive 
            ? "text-blue-600" 
            : "text-gray-500 group-hover:text-gray-700"
        )} 
      />
      
      {!collapsed && (
        <span className={cn(
          "font-medium truncate transition-colors duration-200",
          isActive ? "text-blue-700" : "text-gray-700 group-hover:text-gray-900"
        )}>
          {item.label}
        </span>
      )}
      
      {!collapsed && isActive && (
        <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto flex-shrink-0" />
      )}
    </button>
  );
}
```

## ✅ Validación

```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar compilación
npm run build

# Probar navegación:
# 1. Ir a /dashboard
# 2. Hacer clic en diferentes items del sidebar
# 3. Verificar que breadcrumbs cambian
# 4. Verificar que header se actualiza
# 5. Probar en móvil (F12 responsive)
```

## 🎯 Resultado

- ✅ **Hook de navegación** funcionando con rutas dinámicas
- ✅ **Breadcrumbs** actualizándose automáticamente
- ✅ **Header responsive** con menú móvil
- ✅ **Contenedor de vistas** reutilizable
- ✅ **Vista principal** actualizada con contenido real
- ✅ **Navegación fluida** sin pérdida de sidebar
- ✅ **Estados activos** sincronizados correctamente

**El sistema de navegación está completo** y listo para implementar las vistas adicionales en la Fase 4.

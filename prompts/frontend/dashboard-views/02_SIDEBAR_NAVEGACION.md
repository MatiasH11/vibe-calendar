# 🧭 FASE 2: Sidebar de Navegación

## 🎯 Objetivo
Implementar el sidebar completo con navegación funcional, logo, secciones principales, y información del usuario.

## 🔧 PASO 1: Verificar e Instalar Iconos (si es necesario)

```bash
# Solo instalar si no está ya instalado
npm install lucide-react
```

## 📋 PASO 2: Actualizar Sidebar Principal

### Actualizar `src/components/dashboard/Sidebar.tsx`
```typescript
'use client';

import { APP_NAME } from '@/lib/constants';
import { useDashboard } from './DashboardProvider';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NavigationItem } from './NavigationItem';
import { UserInfo } from './UserInfo';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'empleados',
    label: 'Empleados',
    icon: Users,
    href: '/dashboard/empleados',
  },
  {
    id: 'turnos',
    label: 'Turnos',
    icon: Calendar,
    href: '/dashboard/turnos',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    href: '/dashboard/reportes',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    href: '/dashboard/configuracion',
  },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useDashboard();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Botón de colapso */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">VC</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {APP_NAME}
              </h1>
              {user?.company_id && (
                <p className="text-xs text-gray-500 truncate">
                  Empresa #{user.company_id}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <div className={cn(
            "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3",
            sidebarCollapsed && "text-center"
          )}>
            {sidebarCollapsed ? "•" : "Menú Principal"}
          </div>
          
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer del Sidebar - Información del Usuario */}
      <UserInfo collapsed={sidebarCollapsed} />
    </aside>
  );
}
```

## 🎯 PASO 3: Componente de Item de Navegación

### Crear `src/components/dashboard/NavigationItem.tsx`
```typescript
'use client';

import { cn } from '@/lib/utils';
import { useDashboard } from './DashboardProvider';
import { LucideIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

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
  const { currentView, setCurrentView } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = pathname === item.href || currentView === item.id;

  const handleClick = () => {
    setCurrentView(item.id);
    router.push(item.href);
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

## 👤 PASO 4: Información del Usuario

### Crear `src/components/dashboard/UserInfo.tsx`
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  User, 
  LogOut, 
  ChevronUp,
  Building2,
  Mail
} from 'lucide-react';
import { useState } from 'react';

interface UserInfoProps {
  collapsed: boolean;
}

export function UserInfo({ collapsed }: UserInfoProps) {
  const { user, logout } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const handleLogout = () => {
    logout();
  };

  if (collapsed) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col space-y-2">
          <button
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Información del usuario"
            onClick={() => setShowDetails(!showDetails)}
          >
            <User className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors group"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="space-y-3">
        {/* Info del usuario */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              Usuario #{user?.user_id || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || 'admin'}
            </p>
          </div>
          <ChevronUp 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              showDetails && "rotate-180"
            )} 
          />
        </button>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="space-y-2 pl-2">
            {user?.email && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user?.company_id && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building2 className="w-3 h-3" />
                <span>Empresa #{user.company_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 transition-colors group"
        >
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
          </div>
          <span className="text-sm font-medium text-red-600 group-hover:text-red-700">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );
}
```

## 📱 PASO 5: Responsividad Móvil Base

### Actualizar `src/components/dashboard/DashboardProvider.tsx`
```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DashboardContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  breadcrumbs: string[];
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const value = {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    breadcrumbs,
    setBreadcrumbs,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
```

## 🔄 PASO 6: Actualizar Layout para Móvil

### Actualizar `src/app/(dashboard)/layout.tsx`
```typescript
'use client';

import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardProvider, useDashboard } from '@/components/dashboard/DashboardProvider';
import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, sidebarOpen, setSidebarOpen } = useDashboard();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout principal */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={cn(
          "transition-transform duration-300 z-50",
          isMobile ? "fixed left-0 top-0 h-full" : "relative",
          isMobile && !sidebarOpen && "-translate-x-full"
        )}>
          <Sidebar />
        </div>
        
        {/* Área de contenido principal */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect requireAuth={true}>
      <DashboardProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </DashboardProvider>
    </AuthRedirect>
  );
}
```

## ✅ Validación

```bash
# Instalar iconos
npm install lucide-react

# Verificar TypeScript
npx tsc --noEmit

# Verificar compilación
npm run build

# Verificar que navegación funciona
# Ir a /dashboard y probar clicks en sidebar
```

## 🎯 Resultado

- ✅ **Sidebar completo** con navegación funcional
- ✅ **Items de navegación** con estados activos y hover
- ✅ **Información del usuario** expandible
- ✅ **Botón de logout** accesible
- ✅ **Colapso/expansión** del sidebar
- ✅ **Responsive base** para móvil
- ✅ **Iconos** de Lucide React integrados

**El sidebar está completo** y listo para el sistema de navegación en la Fase 3.

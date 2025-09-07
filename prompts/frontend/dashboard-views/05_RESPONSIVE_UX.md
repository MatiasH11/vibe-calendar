# 📱 FASE 5: Responsive y UX Avanzado

## 🎯 Objetivo
Optimizar el dashboard para móvil, mejorar la experiencia de usuario con animaciones, micro-interacciones, y optimización de performance.

## 📱 PASO 1: Optimización Mobile del Sidebar

### Actualizar `src/components/dashboard/Sidebar.tsx`
```typescript
'use client';

import { APP_NAME } from '@/lib/constants';
import { useDashboard } from './DashboardProvider';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NavigationItem } from './NavigationItem';
import { UserInfo } from './UserInfo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  X
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
  const { sidebarCollapsed, setSidebarCollapsed, isMobile, sidebarOpen, setSidebarOpen } = useDashboard();
  const { user } = useAuth();

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  const sidebarContent = (
    <motion.aside 
      initial={false}
      animate={isMobile ? (sidebarOpen ? "open" : "closed") : "open"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative",
        isMobile ? "w-64" : (sidebarCollapsed ? "w-16" : "w-64"),
        isMobile && "shadow-xl"
      )}
    >
      {/* Botón de cerrar en móvil */}
      {isMobile && (
        <button
          onClick={closeMobileSidebar}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Botón de colapso en desktop */}
      {!isMobile && (
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
      )}

      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <motion.div 
          className="flex items-center space-x-3"
          layout
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">VC</span>
          </div>
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {APP_NAME}
                </h1>
                {user?.company_id && (
                  <p className="text-xs text-gray-500 truncate">
                    Empresa #{user.company_id}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Área de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <motion.div 
            layout
            className={cn(
              "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3",
              (sidebarCollapsed && !isMobile) && "text-center"
            )}
          >
            {(sidebarCollapsed && !isMobile) ? "•" : "Menú Principal"}
          </motion.div>
          
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavigationItem
                item={item}
                collapsed={sidebarCollapsed && !isMobile}
              />
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Footer del Sidebar - Información del Usuario */}
      <UserInfo collapsed={sidebarCollapsed && !isMobile} />
    </motion.aside>
  );

  if (isMobile) {
    return sidebarContent;
  }

  return sidebarContent;
}
```

## 🔧 PASO 2: Optimización del Header Mobile

### Actualizar `src/components/dashboard/DashboardHeader.tsx`
```typescript
'use client';

import { useDashboard } from './DashboardProvider';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { isMobile, sidebarOpen, setSidebarOpen } = useDashboard();
  const { getCurrentNavigation } = useDashboardNavigation();
  const [showActions, setShowActions] = useState(false);
  
  const currentNav = getCurrentNavigation();
  const displayTitle = title || currentNav.label;

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Botón menú móvil */}
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </motion.div>
            </motion.button>
          )}

          <div className="min-w-0 flex-1">
            {/* Breadcrumbs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Breadcrumbs className="mb-1" />
            </motion.div>
            
            {/* Título */}
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
            >
              {displayTitle}
            </motion.h1>
            
            {/* Subtítulo */}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mt-1 text-sm sm:text-base truncate"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {/* Área de acciones */}
        {children && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            {isMobile ? (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Mostrar acciones"
                >
                  <ChevronDown className={cn(
                    "w-5 h-5 text-gray-600 transition-transform duration-200",
                    showActions && "rotate-180"
                  )} />
                </motion.button>
                
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50"
                  >
                    {children}
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3"
              >
                {children}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
```

## 🎨 PASO 3: Animaciones de Transición entre Vistas

### Actualizar `src/components/dashboard/ViewContainer.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
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

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const contentVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export function ViewContainer({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  className,
  showHeader = true 
}: ViewContainerProps) {
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex flex-col"
    >
      {showHeader && (
        <DashboardHeader title={title} subtitle={subtitle}>
          {headerActions}
        </DashboardHeader>
      )}
      
      <motion.div 
        variants={contentVariants}
        className={cn("flex-1 overflow-y-auto", className)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
```

## 🎯 PASO 4: Micro-interacciones en Componentes

### Actualizar `src/components/dashboard/StatsCard.tsx`
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  icon: Icon, 
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  className 
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-gray-600 truncate"
              >
                {title}
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-xl sm:text-2xl font-bold text-gray-900"
              >
                {value}
              </motion.p>
              {change && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn("text-xs sm:text-sm", trendColors[trend])}
                >
                  {change}
                </motion.p>
              )}
            </div>
            <motion.div 
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn("p-2 sm:p-3 rounded-lg flex-shrink-0", bgColor)}
            >
              <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

## 📊 PASO 5: Optimización de DataTable para Móvil

### Actualizar `src/components/dashboard/DataTable.tsx`
```typescript
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useDashboard } from './DashboardProvider';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  className,
  emptyMessage = "No hay datos disponibles"
}: DataTableProps<T>) {
  const { isMobile } = useDashboard();

  if (data.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </motion.div>
    );
  }

  // Vista móvil: Cards en lugar de tabla
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4 space-y-2"
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map((column) => (
                <div key={String(column.key)} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    {column.label}:
                  </span>
                  <span className="text-sm text-gray-900">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </span>
                </div>
              ))}
          </motion.div>
        ))}
      </div>
    );
  }

  // Vista desktop: Tabla tradicional
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th 
                key={String(column.key)}
                className="text-left py-3 px-4 font-medium text-gray-900"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td 
                  key={String(column.key)}
                  className={cn("py-3 px-4", column.className)}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key])
                  }
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## ⚡ PASO 6: Optimización de Performance

### Crear `src/hooks/useIntersectionObserver.ts`
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting && !hasTriggered) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasTriggered]);

  const shouldAnimate = triggerOnce ? hasTriggered : isIntersecting;

  return { elementRef, isIntersecting: shouldAnimate };
}
```

### Crear componente de animación lazy `src/components/ui/LazyMotion.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ReactNode } from 'react';

interface LazyMotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function LazyMotion({ 
  children, 
  className = '', 
  delay = 0, 
  direction = 'up' 
}: LazyMotionProps) {
  const { elementRef, isIntersecting } = useIntersectionObserver();

  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isIntersecting ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

## 🔄 PASO 7: Estados de Loading Mejorados

### Crear `src/components/dashboard/LoadingStates.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-8 h-8 bg-gray-200 rounded-lg"
          />
          <div className="space-y-2 flex-1">
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              className="h-4 bg-gray-200 rounded w-3/4"
            />
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-3 bg-gray-200 rounded w-1/2"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="h-4 bg-gray-200 rounded"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="h-4 bg-gray-200 rounded w-2/3"
                />
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: (i * 0.1) + 0.2 }}
                  className="h-8 bg-gray-200 rounded w-1/2"
                />
              </div>
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: (i * 0.1) + 0.3 }}
                className="w-12 h-12 bg-gray-200 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## ✅ Validación

```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar compilación
npm run build

# Probar responsive:
# 1. Abrir DevTools (F12)
# 2. Alternar vista móvil
# 3. Probar diferentes tamaños de pantalla
# 4. Verificar sidebar colapsable
# 5. Probar navegación en móvil
# 6. Verificar animaciones fluidas
```

## 🎯 Resultado

- ✅ **Sidebar completamente responsive** con overlay en móvil
- ✅ **Header optimizado** para pantallas pequeñas
- ✅ **Animaciones de transición** entre vistas
- ✅ **Micro-interacciones** en componentes
- ✅ **DataTable responsive** con vista de cards en móvil
- ✅ **Performance optimizada** con lazy loading
- ✅ **Estados de loading** mejorados con skeletons
- ✅ **UX consistente** en todos los dispositivos

**El dashboard está completamente optimizado** para móvil y desktop con una experiencia de usuario superior.

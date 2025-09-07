# 🎨 FASE 4: Actualizar Componentes UI

## 🎯 Objetivo
Actualizar los componentes de UI para mostrar correctamente la información de permisos y roles, y crear componentes reutilizables para la gestión de permisos.

## 🔧 PASO 1: Crear Componente de Badge de Permisos

### `frontend/src/components/ui/permission-badge.tsx`
```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { USER_TYPE_COLORS, USER_TYPE_ICONS } from '@/lib/constants';
import { UserType } from '@/types/auth';

interface PermissionBadgeProps {
  userType: UserType;
  className?: string;
}

export function PermissionBadge({ userType, className }: PermissionBadgeProps) {
  const colorClass = USER_TYPE_COLORS[userType];
  const icon = USER_TYPE_ICONS[userType];
  const label = userType === 'admin' ? 'Administrador' : 'Empleado';

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} text-white ${className}`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
}
```

## 🔧 PASO 2: Crear Componente de Badge de Rol de Negocio

### `frontend/src/components/ui/role-badge.tsx`
```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { ROLE_COLORS, ROLE_ICONS } from '@/lib/constants';
import { BusinessRole } from '@/types/auth';

interface RoleBadgeProps {
  role: BusinessRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colorClass = ROLE_COLORS[role] || ROLE_COLORS.default;
  const icon = ROLE_ICONS[role] || ROLE_ICONS.default;

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} text-white border-0 ${className}`}
    >
      <span className="mr-1">{icon}</span>
      {role}
    </Badge>
  );
}
```

## 🔧 PASO 3: Crear Componente de Información de Usuario

### `frontend/src/components/ui/user-info-card.tsx`
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PermissionBadge } from './permission-badge';
import { RoleBadge } from './role-badge';
import { useUserContext } from '@/hooks/useUserContext';
import { usePermissions } from '@/hooks/usePermissions';

export function UserInfoCard() {
  const { employeeData, getUserFullName, getUserRoleDisplay } = useUserContext();
  const { businessRole } = usePermissions();

  if (!employeeData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Cargando información del usuario...
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = `${employeeData.user.first_name[0]}${employeeData.user.last_name[0]}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{getUserFullName()}</h3>
            <p className="text-sm text-gray-500">{employeeData.user.email}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <PermissionBadge userType={employeeData.user_type || 'employee'} />
          {businessRole && <RoleBadge role={businessRole} />}
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Posición:</strong> {employeeData.position}</p>
          <p><strong>Rol de Negocio:</strong> {employeeData.role.name}</p>
          <p><strong>Empresa:</strong> ID {employeeData.company_id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔧 PASO 4: Crear Componente de Protección de Contenido

### `frontend/src/components/ui/protected-content.tsx`
```typescript
'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserType } from '@/types/auth';

interface ProtectedContentProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEmployee?: boolean;
  fallback?: ReactNode;
  showUnauthorized?: boolean;
}

export function ProtectedContent({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireEmployee = false,
  fallback = null,
  showUnauthorized = false,
}: ProtectedContentProps) {
  const { isAuthenticated, isAdmin, isEmployee } = usePermissions();

  // Verificar autenticación
  if (requireAuth && !isAuthenticated) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Debes iniciar sesión para acceder a este contenido</p>
      </div>
    ) : fallback;
  }

  // Verificar permisos de admin
  if (requireAdmin && !isAdmin) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">No tienes permisos de administrador</p>
        <p className="text-gray-500 mb-4">Solo los administradores pueden acceder a esta sección</p>
      </div>
    ) : fallback;
  }

  // Verificar permisos de empleado
  if (requireEmployee && !isEmployee) {
    return showUnauthorized ? (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">No tienes permisos de empleado</p>
      </div>
    ) : fallback;
  }

  return <>{children}</>;
}
```

## 🔧 PASO 5: Actualizar Componente de Sidebar

### `frontend/src/components/dashboard/Sidebar.tsx` (Actualización)
```typescript
// ... existing imports ...
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionBadge } from '@/components/ui/permission-badge';

export function Sidebar() {
  const { canManageShifts, canManageEmployees, canViewStatistics, businessRole } = usePermissions();
  // ... existing code ...

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      {/* Header con información del usuario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Usuario</p>
            <PermissionBadge userType="admin" className="text-xs" />
          </div>
        </div>
        {businessRole && (
          <div className="text-xs text-gray-500">
            Rol: {businessRole}
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="p-4 space-y-2">
        <NavigationItem 
          href="/dashboard" 
          icon={Home} 
          label="Dashboard" 
        />
        
        {/* Solo mostrar si tiene permisos de admin */}
        {canManageShifts && (
          <NavigationItem 
            href="/dashboard/turnos" 
            icon={Calendar} 
            label="Turnos" 
          />
        )}
        
        {canManageEmployees && (
          <NavigationItem 
            href="/dashboard/empleados" 
            icon={Users} 
            label="Empleados" 
          />
        )}
        
        {canViewStatistics && (
          <NavigationItem 
            href="/dashboard/reportes" 
            icon={BarChart3} 
            label="Reportes" 
          />
        )}
        
        <NavigationItem 
          href="/dashboard/configuracion" 
          icon={Settings} 
          label="Configuración" 
        />
      </nav>
    </div>
  );
}
```

## 🔧 PASO 6: Crear Página de No Autorizado

### `frontend/src/app/unauthorized/page.tsx`
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Acceso Denegado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Si crees que esto es un error, contacta a tu administrador.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-red-600">
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## ✅ Validación

```bash
# Verificar compilación del frontend
cd frontend
npm run build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Probar componentes en el navegador
```

## 🎯 Resultado

- **Componentes de UI actualizados** para mostrar permisos y roles correctamente
- **Badges visuales** para distinguir permisos de usuario y roles de negocio
- **Protección de contenido** con componentes reutilizables
- **Sidebar actualizado** que muestra solo las opciones permitidas
- **Página de no autorizado** para manejar accesos denegados
- **Información de usuario** clara y bien organizada

**Los componentes UI ahora reflejan correctamente la separación entre permisos de usuario y roles de negocio.**

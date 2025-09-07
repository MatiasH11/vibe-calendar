# 🎣 FASE 3: Actualizar Hooks de Autenticación

## 🎯 Objetivo
Actualizar el hook `useAuth` y crear hooks adicionales para manejar correctamente la nueva separación entre permisos de usuario y roles de negocio.

## 🔧 PASO 1: Actualizar Hook Principal de Autenticación

### `frontend/src/hooks/useAuth.ts`
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

  // Inicializar usuario al cargar
  useEffect(() => {
    initializeAuth();
  }, []);

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

## 🔧 PASO 2: Crear Hook de Permisos

### `frontend/src/hooks/usePermissions.ts`
```typescript
import { useAuth } from './useAuth';
import { 
  isAdmin, 
  isEmployee, 
  canManageShifts, 
  canManageEmployees, 
  canViewStatistics,
  getUserBusinessRole,
  hasBusinessRole
} from '@/lib/permissions';
import { BusinessRole } from '@/types/auth';

export function usePermissions() {
  const { user } = useAuth();

  return {
    // Permisos básicos
    isAdmin: isAdmin(user),
    isEmployee: isEmployee(user),
    
    // Permisos específicos
    canManageShifts: canManageShifts(user),
    canManageEmployees: canManageEmployees(user),
    canViewStatistics: canViewStatistics(user),
    
    // Información del rol de negocio
    businessRole: getUserBusinessRole(user),
    hasBusinessRole: (role: BusinessRole) => hasBusinessRole(user, role),
    
    // Información del usuario
    user,
    isAuthenticated: !!user,
  };
}
```

## 🔧 PASO 3: Crear Hook de Contexto de Usuario

### `frontend/src/hooks/useUserContext.ts`
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api';
import { Employee } from '@/types/employee';

export function useUserContext() {
  const { user, isAuthenticated } = useAuth();
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeData = async () => {
    if (!user || !isAuthenticated) {
      setEmployeeData(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getEmployee(user.employee_id);
      if (response.success && response.data) {
        setEmployeeData(response.data);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [user, isAuthenticated]);

  const getUserFullName = (): string => {
    if (employeeData) {
      return `${employeeData.user.first_name} ${employeeData.user.last_name}`;
    }
    return user ? 'Usuario' : '';
  };

  const getUserDisplayName = (): string => {
    if (employeeData) {
      return `${employeeData.user.first_name} ${employeeData.user.last_name}`;
    }
    return user ? 'Usuario' : '';
  };

  const getUserRoleDisplay = (): string => {
    if (employeeData) {
      return `${employeeData.role.name} - ${employeeData.position}`;
    }
    return user?.role_name || '';
  };

  return {
    user,
    employeeData,
    isLoading,
    isAuthenticated,
    getUserFullName,
    getUserDisplayName,
    getUserRoleDisplay,
    refreshEmployeeData: fetchEmployeeData,
  };
}
```

## 🔧 PASO 4: Crear Hook de Protección de Rutas

### `frontend/src/hooks/useRouteProtection.ts`
```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';

interface RouteProtectionOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEmployee?: boolean;
  redirectTo?: string;
}

export function useRouteProtection(options: RouteProtectionOptions = {}) {
  const { 
    requireAuth = true, 
    requireAdmin = false, 
    requireEmployee = false,
    redirectTo = '/login'
  } = options;
  
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isEmployee } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Esperar a que termine la carga

    // Verificar autenticación
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Verificar permisos de admin
    if (requireAdmin && !isAdmin) {
      router.push('/unauthorized');
      return;
    }

    // Verificar permisos de empleado
    if (requireEmployee && !isEmployee) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isAdmin, isEmployee, isLoading, requireAuth, requireAdmin, requireEmployee, redirectTo, router]);

  return {
    isAuthenticated,
    isAdmin,
    isEmployee,
    isLoading,
    canAccess: isAuthenticated && (!requireAdmin || isAdmin) && (!requireEmployee || isEmployee),
  };
}
```

## 🔧 PASO 5: Actualizar Componentes que Usan Autenticación

### `frontend/src/components/shifts/ShiftsView.tsx` (Actualización)
```typescript
// ... existing imports ...
import { usePermissions } from '@/hooks/usePermissions';

export function ShiftsView() {
  const { canManageShifts, isAdmin } = usePermissions();
  // ... rest of existing code ...

  // Verificar permisos de administrador
  if (!canManageShifts) {
    return (
      <ViewContainer title="Turnos" subtitle="Acceso denegado">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">No tienes permisos para gestionar turnos</p>
          <p className="text-gray-500 mb-4">Solo los administradores pueden crear y editar turnos</p>
        </div>
      </ViewContainer>
    );
  }

  // ... rest of existing code ...
}
```

## ✅ Validación

```bash
# Verificar compilación del frontend
cd frontend
npm run build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Probar hooks en componentes
```

## 🎯 Resultado

- **Hook useAuth actualizado** con nueva estructura de permisos
- **Hook usePermissions** para verificar permisos fácilmente
- **Hook useUserContext** para obtener datos completos del usuario
- **Hook useRouteProtection** para proteger rutas automáticamente
- **Componentes actualizados** para usar la nueva estructura

**Los hooks ahora manejan correctamente la separación entre permisos de usuario y roles de negocio.**

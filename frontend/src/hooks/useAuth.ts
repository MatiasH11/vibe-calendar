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

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { FadeIn, ErrorMessage } from '@/components/ui/transitions';
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
    <FadeIn delay={0.2}>
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {/* Mensaje de la URL */}
          {message && (
            <FadeIn delay={0.1}>
              <div className={`p-4 rounded-lg mb-6 ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : messageType === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm font-medium ${
                  messageType === 'success' 
                    ? 'text-green-700' 
                    : messageType === 'error'
                    ? 'text-red-700'
                    : 'text-blue-700'
                }`}>
                  {message}
                </p>
              </div>
            </FadeIn>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FadeIn delay={0.3}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  {...register('email')}
                  disabled={isAuthenticating}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isAuthenticating}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </FadeIn>

            <ErrorMessage message={error || ''} show={!!error} />

            <FadeIn delay={0.5}>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </FadeIn>
          </form>

          <FadeIn delay={0.6}>
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">¿No tienes una cuenta? </span>
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                Regístrate aquí
              </Link>
            </div>
          </FadeIn>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
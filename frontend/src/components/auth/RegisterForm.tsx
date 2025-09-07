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
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function RegisterForm() {
  const { register: registerUser, isAuthenticating } = useAuth();
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
      setError(null);
      
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...registerData } = data;
      
      await registerUser(registerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    }
  };

  return (
    <FadeIn delay={0.2}>
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Registra tu empresa en Vibe Calendar
          </CardDescription>
        </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FadeIn delay={0.3}>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">Nombre de la Empresa</Label>
            <Input
              id="company_name"
              placeholder="Mi Empresa S.A."
              {...register('company_name')}
              disabled={isAuthenticating}
              className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name.message}</p>
            )}
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">Nombre</Label>
              <Input
                id="first_name"
                placeholder="Juan"
                {...register('first_name')}
                disabled={isAuthenticating}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Apellido</Label>
                <Input
                  id="last_name"
                  placeholder="Pérez"
                  {...register('last_name')}
                  disabled={isAuthenticating}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.5}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@miempresa.com"
                {...register('email')}
                disabled={isAuthenticating}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </FadeIn>
          
          <FadeIn delay={0.6}>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
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

          <FadeIn delay={0.7}>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isAuthenticating}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </FadeIn>

          <ErrorMessage message={error || ''} show={!!error} />

          <FadeIn delay={0.8}>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </FadeIn>
        </form>

        <FadeIn delay={0.9}>
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </FadeIn>
      </CardContent>
    </Card>
    </FadeIn>
  );
}

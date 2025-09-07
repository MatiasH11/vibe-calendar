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

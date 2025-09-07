import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Vibe Calendar',
  description: 'Crea tu cuenta en Vibe Calendar y comienza a gestionar los turnos de tu equipo',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
    </div>
  );
}

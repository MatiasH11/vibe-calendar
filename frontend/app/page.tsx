import { redirect } from 'next/navigation';

export default function Home() {
  // Después del reseteo de UI, siempre redirigir al login
  // La infraestructura de autenticación se mantiene intacta
  redirect('/login');
}



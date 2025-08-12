import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const token = cookies().get('auth_token')?.value;
  if (token) {
    redirect('/dashboard');
  }
  redirect('/login');
}



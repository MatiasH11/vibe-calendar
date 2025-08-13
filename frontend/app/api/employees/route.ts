import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('auth_token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing token' } }), { status: 401 });
  }
  const res = await fetch(`${process.env.API_BASE_URL}/api/v1/employees`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}



import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_name, first_name, last_name, email, password } = body ?? {};
    if (!company_name || !first_name || !last_name || !email || !password) {
      return new Response(JSON.stringify({ success: false, error: { error_code: 'BAD_REQUEST', message: 'missing required fields' } }), { status: 400 });
    }

    const res = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name, first_name, last_name, email, password }),
      cache: 'no-store',
    });
    const data = await res.json();

    if (!res.ok || !data?.success) {
      return new Response(JSON.stringify(data), { status: res.status });
    }

    // Opcional: login automático
    const loginRes = await fetch(`${process.env.API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    let response = NextResponse.json({ success: true, data: { ok: true } }, { status: 201 });
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      const token = loginData?.data?.token as string | undefined;
      if (token) {
        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 8,
        });
      }
    }
    return response;
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: { error_code: 'INTERNAL', message: e?.message ?? 'internal error' } }), { status: 500 });
  }
}



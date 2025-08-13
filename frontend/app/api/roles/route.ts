import { cookies } from 'next/headers';

export async function GET() {
	const token = cookies().get('auth_token')?.value;
	if (!token) {
		return new Response(JSON.stringify({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing token' } }), { status: 401 });
	}
	const res = await fetch(`${process.env.API_BASE_URL}/api/v1/roles`, {
		headers: { 'Authorization': `Bearer ${token}` },
		cache: 'no-store',
	});
	const body = await res.text();
	return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
	const token = cookies().get('auth_token')?.value;
	if (!token) {
		return new Response(JSON.stringify({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing token' } }), { status: 401 });
	}
	const body = await request.text();
	const res = await fetch(`${process.env.API_BASE_URL}/api/v1/roles`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body,
		cache: 'no-store',
	});
	const out = await res.text();
	return new Response(out, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}



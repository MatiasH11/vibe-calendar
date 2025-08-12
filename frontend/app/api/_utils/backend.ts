export async function backendFetch(path: string, init: RequestInit & { token?: string } = {}) {
  const base = process.env.API_BASE_URL!;
  const headers = new Headers(init.headers);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
  headers.set('Content-Type', 'application/json');
  return fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
}



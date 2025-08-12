import { cookies as nextCookies } from 'next/headers';

export function getSession() {
  const token = nextCookies().get('auth_token')?.value;
  return { isAuthenticated: Boolean(token) } as const;
}

export function isAuthenticated() {
  return getSession().isAuthenticated;
}



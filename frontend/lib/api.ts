export type StandardResponse<T> = {
  success: boolean;
  data?: T;
  error?: { error_code: string; message: string; details?: unknown };
  meta?: unknown;
};

export async function postJson<TReq, TRes>(path: string, body: TReq): Promise<StandardResponse<TRes>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data as StandardResponse<TRes>;
}



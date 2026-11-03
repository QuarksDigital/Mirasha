// Browser-side API calls go to same-origin /api/*, which next.config.ts rewrites to the
// backend. Same origin means the httpOnly session cookie is sent automatically.

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Request failed"), { status: res.status });
  return data as T;
}

export const getJSON = <T>(path: string) => request<T>("GET", path);
export const postJSON = <T>(path: string, body: unknown) => request<T>("POST", path, body);
export const putJSON = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
export const patchJSON = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
export const deleteJSON = <T>(path: string) => request<T>("DELETE", path);

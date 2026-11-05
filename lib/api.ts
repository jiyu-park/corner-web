export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const KEY = 'corner_token';
const NAME = 'corner_name';

export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem(KEY));
export const getName = () => (typeof window === 'undefined' ? null : localStorage.getItem(NAME));
export function setAuth(token: string, name: string) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(NAME, name);
}
export function clearAuth() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(NAME);
}

export class ApiError extends Error {
  statusCode: number;
  source: 'db' | 'backend';
  db_constraint?: string | null;
  constructor(statusCode: number, source: 'db' | 'backend', message: string, db_constraint?: string | null) {
    super(message);
    this.statusCode = statusCode;
    this.source = source;
    this.db_constraint = db_constraint;
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'backend', '서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해 주세요.');
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false && typeof window !== 'undefined') {
      clearAuth();
      window.location.href = '/login';
    }
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `오류가 났어요 (${res.status})`;
    throw new ApiError(res.status, data?.source === 'db' ? 'db' : 'backend', msg, data?.db_constraint);
  }
  return data as T;
}

export function fmtMin(m: number): string {
  const neg = m < 0;
  const a = Math.abs(Math.round(m));
  const h = Math.floor(a / 60);
  const r = a % 60;
  const s = h && r ? `${h}시간 ${r}분` : h ? `${h}시간` : `${r}분`;
  return (neg ? '-' : '') + s;
}

export const STATUS_LABEL: Record<string, string> = {
  reserved: '예약됨',
  completed: '사용 완료',
  cancelled: '취소',
  no_show: '노쇼',
};

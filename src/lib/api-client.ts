function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export class ApiError extends Error {
  status: number;
  data?: Record<string, unknown>;

  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    let data: Record<string, unknown> | undefined;
    try {
      data = await res.json();
    } catch {
      // response body is not JSON
    }
    throw new ApiError(
      (data?.message as string) || `API error: ${res.status} ${res.statusText}`,
      res.status,
      data
    );
  }

  return res.json() as Promise<T>;
}

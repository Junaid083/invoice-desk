export class ApiError extends Error {
  /** HTTP status code, or 0 when the server could not be reached */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Envelope<T> = { data: T } | { error: string };

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      cache: "no-store",
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Could not reach the server. Try again.", 0);
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (body && "error" in body) throw new ApiError(body.error, res.status);
  if (!res.ok || !body || !("data" in body)) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }
  return body.data;
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof ApiError ? err.message : fallback;
}

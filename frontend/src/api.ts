const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  options: { allowGuest?: boolean } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success === false) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      !options.allowGuest
    ) {
      window.dispatchEvent(new Event("parcel:expired"));
    }
    throw new ApiError(
      result?.error?.message || "Something went wrong. Please try again.",
      response.status,
    );
  }
  return result?.data as T;
}

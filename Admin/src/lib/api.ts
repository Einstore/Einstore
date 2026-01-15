import { translate } from "./i18n";

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return import.meta.env.MODE === "development"
    ? "http://localhost:8100"
    : "https://api.einstore.pro";
};

export const API_BASE_URL = resolveApiBaseUrl();

type ApiError = {
  error?: string;
  message?: string;
};

type RefreshResponse = {
  session?: {
    accessToken: string;
    refreshToken: string;
  };
};

let refreshPromise: Promise<string | null> | null = null;
let hasForcedLogout = false;

const shouldRetryAuth = (payload: ApiError | null, status: number) =>
  payload?.error === "token_expired" || status === 401;

const forceLogout = () => {
  if (hasForcedLogout) {
    return;
  }
  hasForcedLogout = true;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.replace("/login");
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const text = await response.text();
        const data = text ? (JSON.parse(text) as RefreshResponse) : null;
        if (!response.ok || !data?.session?.accessToken) {
          return null;
        }
        localStorage.setItem("accessToken", data.session.accessToken);
        if (data.session.refreshToken) {
          localStorage.setItem("refreshToken", data.session.refreshToken);
        }
        return data.session.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const execute = async (overrideToken?: string | null) => {
    const token = overrideToken ?? localStorage.getItem("accessToken");
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body && !headers.has("Content-Type")) {
      if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return { response, data: {} as T };
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { response, data };
  };

  const initial = await execute();
  if (initial.response.ok) {
    return initial.data as T;
  }

  const payload = (initial.data || {}) as ApiError;
  if (shouldRetryAuth(payload, initial.response.status)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retry = await execute(refreshed);
      if (retry.response.ok) {
        return retry.data as T;
      }
      const retryPayload = (retry.data || {}) as ApiError;
      if (shouldRetryAuth(retryPayload, retry.response.status)) {
        forceLogout();
      }
      throw new Error(
        retryPayload.error ||
          retryPayload.message ||
          translate("api.error.requestFailed", "Request failed")
      );
    }
    forceLogout();
  }

  throw new Error(
    payload.error || payload.message || translate("api.error.requestFailed", "Request failed")
  );
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const execute = async (overrideToken?: string | null) => {
    const token = overrideToken ?? localStorage.getItem("accessToken");
    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { response, data };
  };

  const initial = await execute();
  if (initial.response.ok) {
    return initial.data as T;
  }

  const payload = (initial.data || {}) as ApiError;
  if (shouldRetryAuth(payload, initial.response.status)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retry = await execute(refreshed);
      if (retry.response.ok) {
        return retry.data as T;
      }
      const retryPayload = (retry.data || {}) as ApiError;
      if (shouldRetryAuth(retryPayload, retry.response.status)) {
        forceLogout();
      }
      throw new Error(
        retryPayload.error ||
          retryPayload.message ||
          translate("api.error.uploadFailed", "Upload failed")
      );
    }
    forceLogout();
  }

  throw new Error(
    payload.error || payload.message || translate("api.error.uploadFailed", "Upload failed")
  );
}

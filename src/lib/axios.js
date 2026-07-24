import axios from "axios";
import config from "@/config";
import { retryWithBackoff, isRetryableError, handleApiError } from "./errorHandler";
import { useAuthStore, getAuthToken } from "@/stores/authStore";

const AUTH_REQUIRED_PREFIXES = [
  "/suppliers",
  "/tours/supplier",
  "/bookings",
  "/notifications",
  "/admin",
  "/reviews",
  "/payout",
];

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
});

function getRequestAuthorization(headers) {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get("Authorization") || headers.get("authorization");
  }
  return headers.Authorization || headers.authorization || null;
}

function setRequestAuthorization(headers, value) {
  if (typeof headers.set === "function") {
    headers.set("Authorization", value);
    return headers;
  }
  headers.Authorization = value;
  return headers;
}

function requiresAuth(requestConfig) {
  if (requestConfig.skipAuthGuard) {
    return false;
  }

  const url = (requestConfig.url || "").split("?")[0];
  if (url === "/auth/login" || url.endsWith("/auth/login")) {
    return false;
  }

  if (AUTH_REQUIRED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return true;
  }

  const method = (requestConfig.method || "get").toLowerCase();
  if (/^\/tours(\/|$)/.test(url) && method !== "get") {
    return true;
  }

  return false;
}

function createAuthRequiredError() {
  const error = new axios.CanceledError("Authentication required");
  error.code = "AUTH_REQUIRED";
  return error;
}

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (requestConfig) => {
    const token = getAuthToken();
    const headers = requestConfig.headers ?? {};

    if (token && !getRequestAuthorization(headers)) {
      requestConfig.headers = setRequestAuthorization(headers, `Bearer ${token}`);
    }

    const authorization = getRequestAuthorization(requestConfig.headers ?? headers);
    if (requiresAuth(requestConfig) && !authorization) {
      return Promise.reject(createAuthRequiredError());
    }

    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (axios.isCancel(error) || error.code === "AUTH_REQUIRED") {
      return Promise.reject(error);
    }

    if (config.isDevelopment()) {
      console.error("API Error:", {
        status: error.response?.status,
        url: originalRequest?.url,
        message: error.message,
        response: error.response?.data,
      });
    }

    // Handle 401 — attempt token refresh via backend
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken },
            { skipGlobalErrorHandler: true }
          );
          const data = res.data?.data;
          if (data?.accessToken) {
            localStorage.setItem("auth_token", data.accessToken);
            useAuthStore.getState().setToken(data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        if (config.isDevelopment()) {
          console.error("[Auth] Token refresh failed:", refreshErr?.response?.status, refreshErr?.message);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_return_url", window.location.pathname + window.location.search);
      }
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("refresh_token");
      useAuthStore.getState().setUnauthenticated();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= config.api.retryAttempts) {
        try {
          return await retryWithBackoff(
            () => api.request(originalRequest),
            config.api.retryAttempts - originalRequest._retryCount,
            1000
          );
        } catch (retryError) {
          if (!originalRequest?.skipGlobalErrorHandler) {
            handleApiError(retryError);
          }
          return Promise.reject(retryError);
        }
      }
    }

    if (!originalRequest?.skipGlobalErrorHandler) {
      handleApiError(error);
    }

    if (error.response?.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("refresh_token");
      useAuthStore.getState().setUnauthenticated();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export async function apiRequest(requestFn) {
  try {
    return await retryWithBackoff(requestFn, config.api.retryAttempts);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export default api;

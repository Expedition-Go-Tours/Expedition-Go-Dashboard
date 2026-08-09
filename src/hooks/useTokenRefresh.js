import { useEffect, useRef } from 'react';
import axios from 'axios';
import config from '@/config';
import { getAuthToken, useAuthStore } from '@/stores/authStore';

function decodeTokenPayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const REFRESH_BEFORE_MS = 5 * 60 * 1000;

export function useTokenRefresh() {
  const timerRef = useRef(null);

  useEffect(() => {
    const scheduleRefresh = () => {
      const token = getAuthToken();
      if (!token) return;

      const decoded = decodeTokenPayload(token);
      if (!decoded?.exp) return;

      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const delay = Math.max(timeUntilExpiry - REFRESH_BEFORE_MS, 0);

      if (delay > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(refresh, delay);
      }
    };

    const refresh = async () => {
      const token = getAuthToken();
      if (!token) return;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return;

      try {
        const res = await axios.post(
          `${config.api.baseURL}/auth/refresh`,
          { refreshToken },
          { skipGlobalErrorHandler: true }
        );
        const data = res.data?.data;
        if (data?.accessToken) {
          localStorage.setItem('auth_token', data.accessToken);
          if (data?.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
          }
          useAuthStore.getState().setToken(data.accessToken);
        }
      } catch (err) {
        if (config.isDevelopment()) {
          console.error('[TokenRefresh] Failed to proactively refresh token:', err?.response?.status, err?.message);
        }
      }

      scheduleRefresh();
    };

    scheduleRefresh();

    const handleActivity = () => {
      const token = getAuthToken();
      if (!token) return;
      const decoded = decodeTokenPayload(token);
      if (!decoded?.exp) return;
      const expiresAt = decoded.exp * 1000;
      const timeUntilExpiry = expiresAt - Date.now();
      if (timeUntilExpiry < REFRESH_BEFORE_MS + 10_000) {
        refresh();
      } else {
        scheduleRefresh();
      }
    };

    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);
}

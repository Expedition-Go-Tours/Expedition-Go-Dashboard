import { useEffect, useRef, useCallback } from "react";
import config from "@/config";
import { useAuthStore, getAuthToken } from "@/stores/authStore";

const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export function useGoogleOneTap() {
  const initialized = useRef(false);
  const callbackRef = useRef(null);

  const setCallback = useCallback((fn) => {
    callbackRef.current = fn;
  }, []);

  useEffect(() => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    const clientId = config.google.clientId;

    if (!clientId || isAuthenticated || getAuthToken()) {
      return;
    }

    const handleCredential = (response) => {
      if (response?.credential && callbackRef.current) {
        callbackRef.current(response.credential);
      }
    };

    const cancelOneTap = () => {
      window.google?.accounts?.id?.cancel();
    };

    const initOneTap = () => {
      if (initialized.current || typeof window.google === "undefined") return;
      initialized.current = true;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          cancel_on_tap_outside: false,
          auto_select: true,
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn("[OneTap]", notification.getNotDisplayedReason() || notification.getSkippedReason());
          }
        });
      } catch (err) {
        console.warn("[OneTap] Initialization failed:", err);
      }
    };

    if (typeof window.google !== "undefined" && window.google.accounts) {
      initOneTap();
    } else {
      const script = document.createElement("script");
      script.src = GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = initOneTap;
      script.onerror = () => console.warn("[OneTap] Failed to load Google Identity Services script");
      document.head.appendChild(script);
    }

    return cancelOneTap;
  }, []);

  return { setCallback };
}

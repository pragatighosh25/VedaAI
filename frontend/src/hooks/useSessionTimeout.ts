"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthStore,
  INACTIVITY_TIMEOUT_MS,
  isTokenExpired,
  getTokenExpMs,
} from "@/store/authStore";
import { refreshToken as apiRefreshToken } from "@/lib/api";

const THROTTLE_MS = 15 * 1000; // Throttle activity updates to once every 15s
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // Refresh token if less than 10 mins remaining

export function useSessionTimeout() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);

  const lastActivityRecordedRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  const handleExpire = useCallback(() => {
    logout();
    router.replace("/login?reason=session_expired");
  }, [logout, router]);

  // Attempt to refresh the JWT token silently if it's nearing expiry
  const attemptTokenRefresh = useCallback(async () => {
    if (!token || isRefreshingRef.current) return;
    const expMs = getTokenExpMs(token);
    if (!expMs) return;

    const timeUntilExp = expMs - Date.now();
    if (timeUntilExp > 0 && timeUntilExp < REFRESH_THRESHOLD_MS) {
      isRefreshingRef.current = true;
      try {
        const data = await apiRefreshToken();
        if (data.token) {
          setToken(data.token);
        }
      } catch (err) {
        console.warn("Silent token refresh failed:", err);
      } finally {
        isRefreshingRef.current = false;
      }
    }
  }, [token, setToken]);

  // Record user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRecordedRef.current < THROTTLE_MS) {
      return;
    }
    lastActivityRecordedRef.current = now;
    if (typeof window !== "undefined") {
      localStorage.setItem("veda-last-active", now.toString());
    }

    // Try refreshing the token if needed while user is active
    attemptTokenRefresh();
  }, [attemptTokenRefresh]);

  useEffect(() => {
    if (!hydrated || !token) return;

    // 1. Initial check on mount/hydration
    const lastActiveStr = typeof window !== "undefined" ? localStorage.getItem("veda-last-active") : null;
    const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();

    if (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS || isTokenExpired(token)) {
      handleExpire();
      return;
    }

    // Initialize last active if not set
    if (!lastActiveStr && typeof window !== "undefined") {
      localStorage.setItem("veda-last-active", Date.now().toString());
    }

    // 2. Attach user activity listeners
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "wheel",
    ];

    const onUserActivity = () => {
      recordActivity();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    // 3. Multi-tab synchronization via storage event
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "veda-auth" && !e.newValue) {
        // Logged out in another tab
        logout();
        router.replace("/login");
      } else if (e.key === "veda-last-active" && e.newValue) {
        lastActivityRecordedRef.current = parseInt(e.newValue, 10) || Date.now();
      }
    };
    window.addEventListener("storage", onStorageChange);

    // 4. Periodic interval checker for inactivity & token expiration
    const intervalId = setInterval(() => {
      const currentLastActiveStr = localStorage.getItem("veda-last-active");
      const currentLastActive = currentLastActiveStr
        ? parseInt(currentLastActiveStr, 10)
        : lastActivityRecordedRef.current;

      const idleDuration = Date.now() - currentLastActive;
      const currentToken = useAuthStore.getState().token;

      if (idleDuration >= INACTIVITY_TIMEOUT_MS || isTokenExpired(currentToken)) {
        handleExpire();
      }
    }, 10 * 1000); // Check every 10 seconds

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserActivity);
      });
      window.removeEventListener("storage", onStorageChange);
      clearInterval(intervalId);
    };
  }, [hydrated, token, recordActivity, handleExpire, logout, router]);
}

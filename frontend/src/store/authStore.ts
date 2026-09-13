import { create } from "zustand";
import { persist } from "zustand/middleware";

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  schoolName?: string;
  subject?: string;
  className?: string;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload) as { exp?: number };
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export function getTokenExpMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,

      setHydrated: (value) =>
        set({
          hydrated: value,
        }),

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("veda-last-active", Date.now().toString());
        }
        set({
          user,
          token,
        });
      },

      setToken: (token) =>
        set({
          token,
        }),

      updateUser: (user) =>
        set({
          user,
        }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("veda-auth");
          localStorage.removeItem("veda-last-active");
        }
        set({
          user: null,
          token: null,
        });
      },
    }),

    {
      name: "veda-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined") {
          const lastActiveStr = localStorage.getItem("veda-last-active");
          const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : null;
          const isIdleExpired = lastActive ? Date.now() - lastActive > INACTIVITY_TIMEOUT_MS : false;

          if (state?.token && (isTokenExpired(state.token) || isIdleExpired)) {
            state.logout();
          }
        }
        state?.setHydrated(true);
      },
    }
  )
);
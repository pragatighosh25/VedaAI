import { create } from "zustand";

import { persist } from "zustand/middleware";

interface User {
  _id: string;

  name: string;

  email: string;

  avatar?: string;

  schoolName?: string;

  subject?: string;

  className?: string;
}

interface AuthState {
  user: User | null;

  token: string | null;

  hydrated: boolean;

  setHydrated: (
    value: boolean
  ) => void;

  setAuth: (
    user: User,
    token: string
  ) => void;

  updateUser: (
    user: User
  ) => void;

  logout: () => void;
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        user: null,

        token: null,

        hydrated: false,

        setHydrated: (
          value
        ) =>
          set({
            hydrated: value,
          }),

        setAuth: (
          user,
          token
        ) =>
          set({
            user,
            token,
          }),

        updateUser: (user) =>
          set({
            user,
          }),

        logout: () => {
  localStorage.removeItem("veda-auth");

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

        onRehydrateStorage:
          () => (state) => {
            state?.setHydrated(
              true
            );
          },
      }
    )
  );
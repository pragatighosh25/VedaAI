"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { Sidebar } from "./Sidebar";

import { Header } from "./Header";

import { MobileNavbar } from "./MobileNavbar";

import { MobileHeader } from "./MobileHeader";

import { useAuthStore } from "@/store/authStore";

interface DashboardLayoutProps {
  children: React.ReactNode;

  headerTitle?: string;

  showBack?: boolean;

  backHref?: string;
}

export function DashboardLayout({
  children,
  headerTitle,
  showBack,
  backHref,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const token =
    useAuthStore(
      (state) => state.token
    );
    const hydrated =
  useAuthStore(
    (state) => state.hydrated
  );

  const router =
    useRouter();

  /* PROTECT ROUTES */
  useEffect(() => {
    if (hydrated && !token) {
      router.replace(
        "/login"
      );
    }
  }, [hydrated, token, router]);

  /* PREVENT FLASH */
  if (!hydrated) {
  return null;
}
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-veda-gray p-3 sm:p-4 lg:p-6">

      {/* MOBILE HEADER */}
      <div className="mb-4 lg:hidden">
        <MobileHeader
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-4 lg:gap-6">

        {/* DESKTOP SIDEBAR */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">

            <button
              className="absolute inset-0 bg-black/40"
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <div className="relative z-10 h-full w-[280px] p-4">
              <Sidebar />
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="flex min-w-0 flex-1 flex-col">

          {/* DESKTOP HEADER */}
          <div className="hidden lg:block">
            <Header
              title={headerTitle}
              showBack={showBack}
              backHref={backHref}
            />
          </div>

          {/* PAGE CONTENT */}
          <div className="mt-4 flex-1 pb-24 lg:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE NAVBAR */}
      <div className="lg:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
}
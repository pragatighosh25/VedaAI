"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import {
  ArrowLeft,
  LayoutGrid,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export function Header({
  title = "Assignment",
  showBack = true,
  backHref = "/assignments",
}: HeaderProps) {
  const { user, logout } =
    useAuthStore();
    const hydrated = useAuthStore((state) => state.hydrated);

   

  const [open, setOpen] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);


  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);
  if (!hydrated) {
    return null; 
  }

  return (
    <header className="flex h-14 items-center justify-between rounded-[16px] bg-white px-6 shadow-sm">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        
        {showBack && (
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E9E9] bg-white text-[#303030] transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}

        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-[#B0B0B0]" />

          <span className="text-[16px] font-medium text-[#9A9A9A]">
            {title}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#303030] transition hover:bg-gray-50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full bg-[#FF6B3D]" />
        </button>

        {/* Profile Dropdown */}
        <div
          className="relative"
          ref={dropdownRef}
        >
          <button
            type="button"
            onClick={() =>
              setOpen(!open)
            }
            className="flex items-center gap-2 rounded-full border border-[#EFEFEF] bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:bg-gray-50"
          >
            <div className="h-9 w-9 overflow-hidden rounded-full">
              <img
                src={
                  user?.avatar ||
                  "/avatar.svg"
                }
                alt={
                  user?.name ||
                  "User"
                }
                className="h-full w-full object-cover"
              />
            </div>

            <span className="hidden text-sm font-semibold text-[#303030] sm:inline">
              {user?.name ||
                "Teacher"}
            </span>

            <ChevronDown
              className={`h-4 w-4 text-[#9A9A9A] transition ${
                open
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-[58px] z-50 w-[220px] overflow-hidden rounded-2xl border border-[#EFEFEF] bg-white shadow-xl">
              
              {/* User Info */}
              <div className="border-b border-[#F3F3F3] px-4 py-4">
                <p className="truncate text-sm font-semibold text-[#1F1F1F]">
                  {user?.name ||
                    "Teacher"}
                </p>

                <p className="truncate text-xs text-[#8B8B8B]">
                  {user?.email}
                </p>
              </div>

              {/* Links */}
              <div className="p-2">
                
                <Link
                  href="/settings"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#303030] transition hover:bg-[#F7F7F7]"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <button
                  onClick={() => {
                    logout();

                    window.location.href =
                      "/login";
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
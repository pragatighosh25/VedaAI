"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

import {
  LayoutGrid,
  FileText,
  Bookmark,
  Compass,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: LayoutGrid,
  },

  {
    href: "/assignments",
    label: "Assignments",
    icon: FileText,
  },

  {
    href: "/resource-discovery",
    label: "Discovery",
    icon: Compass,
  },

  {
    href: "/library",
    label: "Library",
    icon: Bookmark,
  },
];

export function MobileNavbar() {
  const pathname =
    usePathname();
  const {user}=useAuthStore();
  const hydrated = useAuthStore((state) => state.hydrated);
  if
    (!hydrated) {
      return null;
    }
    

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[94%] max-w-sm -translate-x-1/2">
      
      <nav className="flex items-center justify-between rounded-[28px] bg-[#111111] px-5 py-2 shadow-[0px_32px_48px_rgba(0,0,0,0.20)]">
        
        {navItems.map((item) => {
          const Icon =
            item.icon;

          const active =
            item.href === "/library"
              ? pathname.startsWith("/library") || pathname.startsWith("/collections")
              : item.href === "/resource-discovery"
                ? pathname.startsWith("/resource-discovery")
                : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-[68px] flex-col items-center justify-center gap-1"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                  active
                    ? "bg-white/10"
                    : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active
                      ? "text-white"
                      : "text-white/30"
                  }`}
                />
              </div>

              <span
                className={`text-[11px] font-semibold ${
                  active
                    ? "text-white"
                    : "text-white/30"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
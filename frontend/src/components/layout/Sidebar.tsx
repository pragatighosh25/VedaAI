"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "../../store/authStore";
import { fetchAssignments } from "../../lib/api";
import type { Assignment } from "../../lib/types";

import {
  LayoutGrid,
  Users,
  FileText,
  Tablet,
  Clock,
  Settings,
  Sparkles,
  Compass,
  Bookmark,
} from "lucide-react";

import { Logo } from "./Logo";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hydrated = useAuthStore((state) => state.hydrated);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!user) return;

    async function loadAssignments() {
      try {
        const data = await fetchAssignments();

        setAssignments(data);
      } catch (error) {
        console.error("Failed to fetch assignments", error);
      }
    }

    loadAssignments();
  }, [user]);
  if (!hydrated) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: LayoutGrid },

    { href: "/groups", label: "My Groups", icon: Users },

    {
      href: "/assignments",
      label: "Assignments",
      icon: FileText,
      badge: assignments.length,
    },

    { href: "/resource-discovery", label: "Resource Discovery", icon: Compass },

    { href: "/library", label: "My Library", icon: Bookmark },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col rounded-2xl bg-white p-5 shadow-card">
      <Logo />

      <Link
        href="/assignments/create"
        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-veda-dark px-4 py-3 text-sm font-medium text-white shadow-glow transition hover:bg-black"
      >
        <Sparkles className="h-4 w-4 text-veda-orange" />
        Create Assignment
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/assignments"
              ? pathname.startsWith("/assignments")
              : item.href === "/library"
                ? pathname.startsWith("/library") || pathname.startsWith("/collections")
                : pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gray-100 text-veda-dark"
                  : "text-gray-600 hover:bg-gray-50 hover:text-veda-dark"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />

              <span className="flex-1">{item.label}</span>

              {Number(item.badge) > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active
                      ? "bg-veda-orange text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-gray-100 pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>

        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <Image
            src={user?.avatar || "/avatar.svg"}
            alt={user?.name || "User"}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-veda-dark">
              {user?.schoolName || "Your School"}
            </p>

            <p className="truncate text-xs text-gray-500">
              {user?.subject || "Add Subject"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

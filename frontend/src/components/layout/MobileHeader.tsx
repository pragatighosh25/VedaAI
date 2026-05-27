"use client";

import Image from "next/image";
import { Bell, Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({
  onMenuClick,
}: MobileHeaderProps) {
  const user =
    useAuthStore(
      (state) => state.user
    );
  const hydrated = useAuthStore((state) => state.hydrated);

   if (!hydrated) {
    return null; 
  }

  return (
    <header className="flex items-center justify-between rounded-[22px] bg-white px-4 py-3 shadow-sm">
      
      {/* Left */}
      <div className="flex items-center gap-2">
        
        <div className="flex h-8 w-8 items-center justify-center rounded-lg">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
          />
        </div>

        <h1 className="text-[28px] font-bold tracking-tight text-[#2C2C2C]">
          VedaAI
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        
        {/* Notification */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]"
        >
          <Bell className="h-5 w-5 text-[#2C2C2C]" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF6B3D]" />
        </button>

        {/* Avatar */}
        <Link href="/settings">
  <Image
    src={
      user?.avatar ||
      "/avatar.svg"
    }
    alt="User"
    width={34}
    height={34}
    className="cursor-pointer rounded-full object-cover transition hover:opacity-80"
  />
</Link>

        {/* Menu */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center"
        >
          <Menu className="h-6 w-6 text-[#2C2C2C]" />
        </button>
      </div>
    </header>
  );
}
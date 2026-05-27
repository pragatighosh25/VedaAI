"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface MobileCreateButtonProps {
  href?: string;
}

export function MobileCreateButton({
  href = "/assignments/create",
}: MobileCreateButtonProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-[96px] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0px_12px_32px_rgba(0,0,0,0.16)] transition hover:scale-105 active:scale-95 lg:hidden"
    >
      <Plus className="h-7 w-7 text-[#FF6B3D]" />
    </Link>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();

  const { token, hydrated } =
    useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    if (token) {
      router.replace("/assignments");
    } else {
      router.replace("/login");
    }
  }, [token, hydrated, router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedResourcesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/library");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">Redirecting to My Library...</p>
      </div>
    </div>
  );
}

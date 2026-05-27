import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-8">
        <Image
          src="/empty-state.png"
          alt="Empty assignments"
          width={260}
          height={220}
          className="mx-auto object-contain"
          priority
        />
      </div>

      <h2 className="text-2xl font-bold text-veda-dark">No assignments yet</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>

      <Link
        href="/assignments/create"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-veda-dark px-6 py-3.5 text-sm font-medium text-white transition hover:bg-black"
      >
        <Plus className="h-4 w-4" />
        Create Your First Assignment
      </Link>
    </div>
  );
}

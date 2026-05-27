"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/assignments/EmptyState";
import { AssignmentCard } from "@/components/assignments/AssignmentCard";
import { fetchAssignments, deleteAssignment } from "@/lib/api";
import type { Assignment } from "@/lib/types";
import { MobileCreateButton } from "@/components/ui/MobileCreateButton";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAssignments();
      setAssignments(data);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;

    await deleteAssignment(deleteId);

    setAssignments((prev) => prev.filter((a) => a._id !== deleteId));

    setDeleteId(null);
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout headerTitle="Assignment">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-veda-accent" />
            <h1 className="text-2xl font-bold text-veda-dark sm:text-3xl">
              Assignments
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage and create assignments for your classes.
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
            >
              <Filter className="h-4 w-4" />
              Filter By
            </button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm focus:border-veda-orange focus:outline-none sm:w-72"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-white shadow-card"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 pb-24 sm:grid-cols-2">
          {filtered.map((a) => (
            <AssignmentCard key={a._id} assignment={a} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {assignments.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:left-[calc(50%+140px)]">
          <Link
            href="/assignments/create"
            className="inline-flex items-center gap-2 rounded-full bg-veda-dark px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Link>
        </div>
      )}
      {/* Mobile Floating Add Button */}
      {assignments.length > 0 && (
        <div className="lg:hidden">
          <MobileCreateButton />
        </div>
      )}
      <DeleteConfirmModal
  open={!!deleteId}
  title="Delete Assignment?"
  description="This assignment and its generated question paper will be permanently removed."
  onCancel={() =>
    setDeleteId(null)
  }
  onConfirm={handleDelete}
/>
    </DashboardLayout>
  );
}

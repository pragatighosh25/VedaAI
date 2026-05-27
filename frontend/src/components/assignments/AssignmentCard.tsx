"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoreVertical } from "lucide-react";
import type { Assignment } from "@/lib/types";

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

export function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const assignedDate = format(new Date(assignment.createdAt), "dd-MM-yyyy");
  const dueDate = format(new Date(assignment.dueDate), "dd-MM-yyyy");

  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-card transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-veda-dark">{assignment.title}</h3>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              <Link
                href={`/assignments/${assignment._id}/output`}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                View Assignment
              </Link>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(assignment._id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between text-xs text-gray-500">
        <span>Assigned on : {assignedDate}</span>
        <span>Due : {dueDate}</span>
      </div>

      {assignment.status === "processing" && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-veda-orange transition-all duration-500"
              style={{ width: `${assignment.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Generating… {assignment.progress}%
          </p>
        </div>
      )}
    </div>
  );
}

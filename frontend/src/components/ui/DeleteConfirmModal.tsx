"use client";

interface DeleteConfirmModalProps {
  open: boolean;

  loading?: boolean;

  title?: string;

  description?: string;

  onCancel: () => void;

  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  loading = false,
  title = "Delete Assignment?",
  description = "This action cannot be undone.",
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

        <h2 className="text-xl font-bold text-[#202020]">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#E8E8E8] px-5 py-2.5 text-sm font-medium text-[#4B4B4B] transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {loading
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
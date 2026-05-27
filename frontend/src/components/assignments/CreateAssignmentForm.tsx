"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  Calendar,
  Mic,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCreateFormStore } from "@/store/assignmentStore";
import { QUESTION_TYPE_OPTIONS } from "@/lib/types";
import { StepperInput } from "@/components/ui/StepperInput";
import { createAssignment } from "@/lib/api";

export function CreateAssignmentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    step,
    dueDate,
    file,
    questionTypes,
    additionalInstructions,
    title,
    setStep,
    setDueDate,
    setFile,
    setAdditionalInstructions,
    setTitle,
    addQuestionType,
    removeQuestionType,
    updateQuestionType,
    getTotals,
    validate,
  } = useCreateFormStore();

  const { totalQuestions, totalMarks } = getTotals();

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        setFile(null);
        return;
      }
      const allowed = [
        "application/pdf",
        "text/plain",
        "image/jpeg",
        "image/png",
      ];
      if (!allowed.includes(f.type) && !f.type.startsWith("text/")) {
        setError("Only PDF, text, JPEG, PNG allowed (max 10MB)");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        return;
      }
      setFile(f);
      setError(null);
    },
    [setFile],
  );

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("dueDate", dueDate);
      formData.append(
        "questionTypes",
        JSON.stringify(
          questionTypes.map(({ type, count, marksPerQuestion }) => ({
            type,
            count,
            marksPerQuestion,
          })),
        ),
      );
      if (additionalInstructions) {
        formData.append("additionalInstructions", additionalInstructions);
      }
      if (file) formData.append("file", file);

      const assignment = await createAssignment(formData);
      router.push(`/assignments/${assignment._id}/output`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-veda-accent" />
        <div>
          <h1 className="text-2xl font-bold text-veda-dark">
            Create Assignment
          </h1>
          <p className="text-sm text-gray-500">
            Set up a new assignment for your students.
          </p>
        </div>
      </div>

      <div className="mb-6 h-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-veda-dark transition-all"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-veda-dark">
            Assignment Details
          </h2>
          <p className="text-sm text-gray-500">
            Basic information about your assignment.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          className={`mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
            dragOver ? "border-veda-orange bg-orange-50/50" : "border-gray-200"
          }`}
        >
          <CloudUpload className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-center text-sm text-gray-600">
            Choose a file or drag & drop it here
          </p>
          <p className="mt-1 text-center text-xs text-gray-400">
            (JPEG, PNG, PDF, Text — up to 10MB) — Optional
          </p>
          {file && (
            <p className="mt-2 text-sm font-medium text-veda-orange">
              {file.name}
            </p>
          )}
          <label className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Assignment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-veda-orange focus:outline-none focus:ring-1 focus:ring-veda-orange"
            placeholder="Quiz on Electricity"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-veda-orange focus:outline-none focus:ring-1 focus:ring-veda-orange"
              required
            />
          </div>
        </div>

        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="pb-3 font-medium">Question Type</th>
                <th className="pb-3 font-medium">No. of Questions</th>
                <th className="pb-3 font-medium">Marks</th>
                <th className="w-8 pb-3" />
              </tr>
            </thead>
            <tbody>
              {questionTypes.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-3 pr-2">
                    <select
                      value={row.type}
                      onChange={(e) =>
                        updateQuestionType(row.id, { type: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-veda-orange focus:outline-none"
                    >
                      {QUESTION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <StepperInput
                      value={row.count}
                      onChange={(count) =>
                        updateQuestionType(row.id, { count })
                      }
                    />
                  </td>
                  <td className="py-3">
                    <StepperInput
                      value={row.marksPerQuestion}
                      onChange={(marksPerQuestion) =>
                        updateQuestionType(row.id, { marksPerQuestion })
                      }
                    />
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => removeQuestionType(row.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove row"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addQuestionType}
          className="group flex items-center gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B2B2B] transition group-hover:bg-black">
            <Plus className="h-5 w-5 text-white" />
          </div>

          <span className="text-[15px] font-semibold text-[#303030]">
            Add Question Type
          </span>
        </button>

        <div className="mb-6 flex justify-end gap-6 text-sm">
          <span className="text-gray-600">
            Total Questions:{" "}
            <strong className="text-veda-dark">{totalQuestions}</strong>
          </span>
          <span className="text-gray-600">
            Total Marks:{" "}
            <strong className="text-veda-dark">{totalMarks}</strong>
          </span>
        </div>

        <div className="mt-10">
          <label className="mb-3 block text-[15px] font-semibold text-[#303030]">
            Additional Information
            <span className="font-medium text-[#5F5F5F]">
              {" "}
              (For better output)
            </span>
          </label>

          <div className="relative">
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={5}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              className="w-full resize-none rounded-[24px] border-2 bg-white/25 px-6 py-5 pr-16 text-sm text-[#303030] outline-none backdrop-blur-sm transition placeholder:text-gray-400 focus:border-[#BDBDBD] border-dashed focus:border-dashed border-gray-200"
              
            />

            <button
              type="button"
              className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <Mic className="h-5 w-5 text-[#303030]" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(1) : router.back())}
          className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-[#303030] shadow-sm transition hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-full bg-[#111111] px-8 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

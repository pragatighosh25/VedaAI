"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuestionPaperView } from "@/components/output/QuestionPaperView";
import { GenerationProgress } from "@/components/output/GenerationProgress";
import { OutputSkeleton } from "@/components/output/OutputSkeleton";
import { useAssignmentWebSocket } from "@/hooks/useWebSocket";
import { useGenerationStore } from "@/store/assignmentStore";
import {
  fetchQuestionPaper,
  fetchAssignment,
  regenerateAssignment,
  downloadPdf,
} from "@/lib/api";
import type { QuestionPaper, Assignment } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function OutputPage() {
  const user= useAuthStore((state) => state.user);
  const params = useParams();
  const id = params.id as string;

  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [answerKey, setAnswerKey] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const { progress, status, setProgress, reset } = useGenerationStore();

  const loadPaper = useCallback(async () => {
    try {
      const [paperRes, assignRes] = await Promise.all([
        fetchQuestionPaper(id),
        fetchAssignment(id),
      ]);
      setAssignment(assignRes);
      setProgress(paperRes.progress, paperRes.status);

      if (paperRes.paper) {
        setPaper(paperRes.paper);
        setAnswerKey(paperRes.answerKey ?? []);
      }
    } catch {
      /* retry on poll */
    } finally {
      setLoading(false);
    }
  }, [id, setProgress]);

  useEffect(() => {
    loadPaper();
    const interval = setInterval(loadPaper, 3000);
    return () => clearInterval(interval);
  }, [loadPaper]);

  useAssignmentWebSocket(id, (event) => {
    if (event.type === "job:progress" && event.progress !== undefined) {
      setProgress(event.progress, event.status ?? "processing");
    }
    if (event.type === "job:completed" || event.type === "job:failed") {
      loadPaper();
    }
  });

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenerateError(null);
    reset();
    setPaper(null);
    try {
      await regenerateAssignment(id);
      await loadPaper();
    } catch (error) {
      setRegenerateError(
        error instanceof Error ? error.message : "Failed to regenerate question paper",
      );
    } finally {
      setRegenerating(false);
    }
  };

  const isReady = paper !== null && (status === "completed" || assignment?.status === "completed");
  const isFailed = status === "failed" || assignment?.status === "failed";
  const isGenerating = !isReady && !isFailed;

  return (
    <DashboardLayout headerTitle="Create New" backHref="/assignments">
      <div className="rounded-2xl bg-[#2d2d2d] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 text-white">
          <p className="text-sm leading-relaxed text-white/90 sm:text-base">
  Certainly,{" "}
  
  <span className="font-semibold text-white">
    {user?.name || "Teacher"}
  </span>
  ! Here is your customized{" "}
  
  <span className="font-semibold text-white">
    {user?.subject || "Subject"}
  </span>{" "}
  question paper for{" "}
  
  <span className="font-semibold text-white">
    Class {user?.className || "Class"}
  </span>{" "}
  on the topic{" "}
  
  <span className="font-semibold text-white">
    {assignment?.title || "Assignment"}
  </span>
  .
</p>

          {isReady && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
              type="button"
                onClick={() => downloadPdf(id)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-veda-dark transition hover:bg-gray-100"
              >
                <Download className="h-4 w-4" />
                Download as PDF
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
                />
                Regenerate
              </button>
            </div>
          )}
        </div>

        {isFailed && (
          <div className="mb-6 rounded-xl bg-red-500/20 p-4 text-center text-red-200">
            <p>Generation failed. Please try again.</p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600"
            >
              Retry Generation
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="mb-8">
            <GenerationProgress progress={progress} status={status} />
          </div>
        )}

        {regenerateError && (
          <div className="mb-6 rounded-xl bg-red-500/20 p-4 text-center text-red-200">
            <p>{regenerateError}</p>
          </div>
        )}

        {loading && !paper && <OutputSkeleton />}

        {isReady && paper && (
  <QuestionPaperView
    paper={paper}
    answerKey={answerKey}
    schoolName={
      user?.schoolName ||
      "Your School"
    }
    subject={
      user?.subject ||
      "Subject"
    }
    className={
      user?.className ||
      "Class"
    }
    timeAllowed="60 minutes"
    maxMarks={
      assignment?.totalMarks ??
      20
    }
  />
)}

        {!loading && !isReady && !isGenerating && !isFailed && (
          <div className="py-12 text-center text-gray-400">
            <Link href="/assignments" className="underline">
              Back to assignments
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";

export interface JobProgressEvent {
  type: "job:progress" | "job:completed" | "job:failed" | "connected";
  assignmentId?: string;
  progress?: number;
  status?: string;
  error?: string;
}

export function useAssignmentWebSocket(
  assignmentId: string | null,
  onEvent: (event: JobProgressEvent) => void
) {
  const token = useAuthStore(
    (state) => state.token
  );
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const stableHandler = useCallback((event: JobProgressEvent) => {
    onEventRef.current(event);
  }, []);

  useEffect(() => {
    if (!assignmentId || !token) return;

    const url = `${WS_URL}/ws?assignmentId=${encodeURIComponent(assignmentId)}&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as JobProgressEvent;
        stableHandler(data);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      ws.close();
    };
  }, [assignmentId, token, stableHandler]);
}

import type { WebSocket } from "ws";

export type SocketEvent =
  | { type: "job:progress"; assignmentId: string; progress: number; status: string }
  | { type: "job:completed"; assignmentId: string }
  | { type: "job:failed"; assignmentId: string; error: string };

const clients = new Map<string, Set<WebSocket>>();

export function subscribe(assignmentId: string, ws: WebSocket) {
  if (!clients.has(assignmentId)) {
    clients.set(assignmentId, new Set());
  }
  clients.get(assignmentId)!.add(ws);

  ws.on("close", () => {
    clients.get(assignmentId)?.delete(ws);
    if (clients.get(assignmentId)?.size === 0) {
      clients.delete(assignmentId);
    }
  });
}

export function broadcast(assignmentId: string, event: SocketEvent) {
  const subs = clients.get(assignmentId);
  if (!subs) return;
  const payload = JSON.stringify(event);
  for (const ws of subs) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

export function broadcastAll(event: SocketEvent) {
  const payload = JSON.stringify(event);
  for (const [, subs] of clients) {
    for (const ws of subs) {
      if (ws.readyState === 1) ws.send(payload);
    }
  }
}

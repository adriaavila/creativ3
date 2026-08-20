"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { WaConversation, WaMessage } from "@/lib/whatsapp-inbox-db";
import { REALTIME_PROTOCOL, type RealtimeServerEvent } from "@/lib/realtime-protocol";

export type OpsRealtimeStatus = "connecting" | "connected" | "reconnecting" | "polling" | "offline";
export type OpsRealtimeEvent = RealtimeServerEvent;

export type OnlineOperator = { operatorId: string; connections: number };

export type OpsRealtimeValue = {
  status: OpsRealtimeStatus;
  onlineOperators: OnlineOperator[];
  typingByConversation: Record<number, string[]>;
  subscribe: (conversationId: number) => void;
  unsubscribe: (conversationId: number) => void;
  sendTyping: (conversationId: number, active: boolean) => void;
  addEventListener: (listener: (event: OpsRealtimeEvent) => void) => () => void;
  addReconnectListener: (listener: () => void) => () => void;
};

export const OpsRealtimeContext = createContext<OpsRealtimeValue | null>(null);

const PROTOCOL = REALTIME_PROTOCOL;
const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 15_000;
const POLL_INTERVAL_MS = 60_000;
const TYPING_TTL_MS = 4_000;

function realtimeEndpoint() {
  const configured = process.env.NEXT_PUBLIC_REALTIME_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol === "http:") url.protocol = "ws:";
    if (url.protocol === "https:") url.protocol = "wss:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEvent(value: unknown): OpsRealtimeEvent | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  return value as unknown as OpsRealtimeEvent;
}

function eventData(event: OpsRealtimeEvent): Record<string, unknown> | null {
  if (event.type === "conversation.updated" || event.type === "message.created" || event.type === "message.updated") return event.data;
  return null;
}

function eventConversation(event: OpsRealtimeEvent) {
  const value = eventData(event)?.conversation;
  return isRecord(value) ? value as unknown as WaConversation : null;
}

function eventMessage(event: OpsRealtimeEvent) {
  if (event.type !== "message.created" && event.type !== "message.updated") return null;
  const value = eventData(event)?.message;
  return isRecord(value) ? value as unknown as WaMessage : null;
}

function removeTypingOperator(
  previous: Record<number, string[]>,
  conversationId: number,
  operatorId: string,
) {
  const operators = (previous[conversationId] ?? []).filter((id) => id !== operatorId);
  const next = { ...previous };
  if (operators.length > 0) next[conversationId] = operators;
  else delete next[conversationId];
  return next;
}

export function useOpsRealtimeController(): OpsRealtimeValue {
  const [status, setStatus] = useState<OpsRealtimeStatus>(() => realtimeEndpoint() ? "offline" : "polling");
  const [onlineOperators, setOnlineOperators] = useState<OnlineOperator[]>([]);
  const [typingByConversation, setTypingByConversation] = useState<Record<number, string[]>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef(new Set<number>());
  const eventListenersRef = useRef(new Set<(event: OpsRealtimeEvent) => void>());
  const reconnectListenersRef = useRef(new Set<() => void>());
  const typingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const hasConnectedRef = useRef(false);

  const sendCommand = useCallback((command: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(command));
  }, []);

  const subscribe = useCallback((conversationId: number) => {
    if (!Number.isInteger(conversationId)) return;
    subscriptionsRef.current.add(conversationId);
    sendCommand({ type: "subscribe", conversationId });
  }, [sendCommand]);

  const unsubscribe = useCallback((conversationId: number) => {
    subscriptionsRef.current.delete(conversationId);
    sendCommand({ type: "unsubscribe", conversationId });
  }, [sendCommand]);

  const sendTyping = useCallback((conversationId: number, active: boolean) => {
    if (Number.isInteger(conversationId)) sendCommand({ type: "typing", conversationId, active });
  }, [sendCommand]);

  const emit = useCallback((event: OpsRealtimeEvent) => {
    eventListenersRef.current.forEach((listener) => listener(event));
  }, []);

  const clearTyping = useCallback((conversationId: number, operatorId: string) => {
    const key = `${conversationId}:${operatorId}`;
    const timer = typingTimersRef.current.get(key);
    if (timer) clearTimeout(timer);
    typingTimersRef.current.delete(key);
    setTypingByConversation((previous) => removeTypingOperator(previous, conversationId, operatorId));
  }, []);

  const handleTyping = useCallback((event: Extract<OpsRealtimeEvent, { type: "typing.updated" }>) => {
    const conversationId = event.conversationId;
    const operatorId = event.operatorId;
    if (!Number.isInteger(conversationId) || !operatorId) return;
    if (!event.active) {
      clearTyping(conversationId as number, operatorId);
      return;
    }

    setTypingByConversation((previous) => {
      const operators = new Set(previous[conversationId as number] ?? []);
      operators.add(operatorId);
      return { ...previous, [conversationId as number]: [...operators] };
    });

    const key = `${conversationId}:${operatorId}`;
    const currentTimer = typingTimersRef.current.get(key);
    if (currentTimer) clearTimeout(currentTimer);
    const expiresAt = event.expiresAt ? Date.parse(event.expiresAt) : NaN;
    const delay = Number.isFinite(expiresAt) ? Math.max(100, expiresAt - Date.now()) : TYPING_TTL_MS;
    typingTimersRef.current.set(key, setTimeout(() => clearTyping(conversationId as number, operatorId), delay));
  }, [clearTyping]);

  const handleEvent = useCallback((event: OpsRealtimeEvent) => {
    if (event.type === "presence.snapshot" && Array.isArray(event.operators)) {
      setOnlineOperators(event.operators.filter((operator) => operator?.operatorId));
    } else if (event.type === "presence.updated" && event.operatorId) {
      setOnlineOperators((previous) => {
        const current = previous.filter((operator) => operator.operatorId !== event.operatorId);
        if (!event.online) return current;
        return [...current, { operatorId: event.operatorId as string, connections: Math.max(1, event.connections ?? 1) }];
      });
    } else if (event.type === "typing.updated") {
      handleTyping(event);
    }
    emit(event);
  }, [emit, handleTyping]);

  useEffect(() => {
    const endpoint = realtimeEndpoint();
    if (!endpoint) {
      // ponytail: sin servicio realtime desplegado sondeamos, pero sólo con la
      // pestaña visible. Una pestaña de /ops olvidada en segundo plano refrescaba
      // cada 15s para siempre, y eso sola mantenía la base despierta día y noche.
      const tick = () => {
        if (document.visibilityState !== "visible") return;
        reconnectListenersRef.current.forEach((listener) => listener());
      };
      const timer = setInterval(tick, POLL_INTERVAL_MS);
      // Al volver a la pestaña refresca en el acto: la espera no se paga al mirar.
      document.addEventListener("visibilitychange", tick);
      return () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", tick);
      };
    }

    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return;
      const base = Math.min(MAX_RECONNECT_MS, INITIAL_RECONNECT_MS * 2 ** Math.min(reconnectAttempt, 5));
      const delay = Math.round(base * (0.75 + Math.random() * 0.5));
      reconnectAttempt += 1;
      setStatus("reconnecting");
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (disposed || socketRef.current) return;
      setStatus(reconnectAttempt > 0 ? "reconnecting" : "connecting");
      try {
        const response = await fetch("/api/ops/realtime-token", { cache: "no-store" });
        if (!response.ok) throw new Error("Realtime token unavailable");
        const data = (await response.json()) as { token?: string };
        if (!data.token || disposed) return;

        const socket = new WebSocket(endpoint, [PROTOCOL, `bearer.${data.token}`]);
        socketRef.current = socket;
        socket.addEventListener("open", () => {
          if (disposed) return;
          reconnectAttempt = 0;
          setStatus("connected");
          subscriptionsRef.current.forEach((conversationId) => sendCommand({ type: "subscribe", conversationId }));
          if (hasConnectedRef.current) reconnectListenersRef.current.forEach((listener) => listener());
          hasConnectedRef.current = true;
        });
        socket.addEventListener("message", (message) => {
          try {
            const event = parseEvent(JSON.parse(String(message.data)));
            if (event) handleEvent(event);
          } catch {
            // Ignore malformed server frames; the HTTP endpoints remain the recovery path.
          }
        });
        socket.addEventListener("close", () => {
          if (socketRef.current === socket) socketRef.current = null;
          if (!disposed) scheduleReconnect();
        });
        socket.addEventListener("error", () => {
          // close schedules the reconnect and avoids duplicate timers.
        });
      } catch {
        scheduleReconnect();
      }
    };

    void connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close(1000, "ops page closed");
      socketRef.current = null;
    };
  }, [emit, handleEvent, sendCommand]);

  const addEventListener = useCallback((listener: (event: OpsRealtimeEvent) => void) => {
    eventListenersRef.current.add(listener);
    return () => eventListenersRef.current.delete(listener);
  }, []);

  const addReconnectListener = useCallback((listener: () => void) => {
    reconnectListenersRef.current.add(listener);
    return () => reconnectListenersRef.current.delete(listener);
  }, []);

  return useMemo(() => ({
    status,
    onlineOperators,
    typingByConversation,
    subscribe,
    unsubscribe,
    sendTyping,
    addEventListener,
    addReconnectListener,
  }), [addEventListener, addReconnectListener, onlineOperators, sendTyping, status, subscribe, typingByConversation, unsubscribe]);
}

export function useOpsRealtime(options?: {
  onEvent?: (event: OpsRealtimeEvent) => void;
  onReconnect?: () => void;
}): OpsRealtimeValue {
  const context = useContext(OpsRealtimeContext);
  const onEvent = options?.onEvent;
  const onReconnect = options?.onReconnect;
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
  }, [onEvent, onReconnect]);

  const eventListener = useCallback((event: OpsRealtimeEvent) => onEventRef.current?.(event), []);
  const reconnectListener = useCallback(() => onReconnectRef.current?.(), []);

  useEffect(() => {
    if (!context || !onEvent) return;
    return context.addEventListener(eventListener);
  }, [context, eventListener, onEvent]);

  useEffect(() => {
    if (!context || !onReconnect) return;
    return context.addReconnectListener(reconnectListener);
  }, [context, onReconnect, reconnectListener]);

  const fallback = useMemo<OpsRealtimeValue>(() => ({
    status: "offline",
    onlineOperators: [],
    typingByConversation: {},
    subscribe: () => undefined,
    unsubscribe: () => undefined,
    sendTyping: () => undefined,
    addEventListener: () => () => undefined,
    addReconnectListener: () => () => undefined,
  }), []);

  return context ?? fallback;
}

export { eventConversation, eventMessage };

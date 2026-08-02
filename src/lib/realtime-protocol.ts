export const REALTIME_PROTOCOL = "allok.realtime.v1" as const;
export const REALTIME_EVENT_VERSION = 1 as const;

export type PersistedRealtimeEventType =
  | "conversation.updated"
  | "message.created"
  | "message.updated";

export type PersistedRealtimeEvent = {
  v: typeof REALTIME_EVENT_VERSION;
  eventId: string;
  type: PersistedRealtimeEventType;
  occurredAt: string;
  conversationId: number;
  data: Record<string, unknown>;
};

export type RealtimeClientCommand =
  | { type: "subscribe"; conversationId: number }
  | { type: "unsubscribe"; conversationId: number }
  | { type: "typing"; conversationId: number; active: boolean };

export type RealtimeServerEvent =
  | {
      v: typeof REALTIME_EVENT_VERSION;
      type: "server.hello";
      connectionId: string;
      operatorId: string;
      heartbeatMs: number;
    }
  | {
      v: typeof REALTIME_EVENT_VERSION;
      type: "presence.snapshot";
      operators: Array<{ operatorId: string; connections: number }>;
    }
  | {
      v: typeof REALTIME_EVENT_VERSION;
      type: "presence.updated";
      operatorId: string;
      online: boolean;
      connections: number;
    }
  | {
      v: typeof REALTIME_EVENT_VERSION;
      type: "typing.updated";
      conversationId: number;
      operatorId: string;
      active: boolean;
      expiresAt: string | null;
    }
  | PersistedRealtimeEvent;

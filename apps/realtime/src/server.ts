import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Duplex } from "node:stream";
import { resolve } from "node:path";
import { createClient } from "redis";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import type {
  PersistedRealtimeEvent,
  PersistedRealtimeEventType,
  RealtimeClientCommand,
  RealtimeServerEvent,
} from "../../../src/lib/realtime-protocol.js";

const REALTIME_EVENT_VERSION = 1 as const;
const REALTIME_PROTOCOL = "allok.realtime.v1" as const;
const DEFAULT_ORIGIN = "https://allok.fun";
const EVENT_CHANNEL = "realtime:events";
const PRESENCE_CHANNEL = "realtime:presence";
const TYPING_CHANNEL = "realtime:typing";
const PRESENCE_OPERATORS_KEY = "realtime:presence:operators";
const TYPING_EXPIRIES_KEY = "realtime:typing:expiries";
const MAX_EVENT_BODY = 256 * 1024;
const MAX_WS_PAYLOAD = 32 * 1024;
const EVENT_ID_TTL_SECONDS = 300;
const PRESENCE_TTL_MS = 35_000;
const TYPING_TTL_MS = 4_000;
const HEARTBEAT_MS = 25_000;

type RedisSetOptions = { NX?: boolean; EX?: number };

export interface RealtimeRedis {
  ping(): Promise<string>;
  set(key: string, value: string, options?: RedisSetOptions): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  sAdd(key: string, member: string): Promise<number>;
  sRem(key: string, member: string): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  zAdd(key: string, item: { score: number; value: string }): Promise<number>;
  zRem(key: string, member: string): Promise<number>;
  zCard(key: string): Promise<number>;
  zRangeByScore(key: string, min: number, max: number): Promise<string[]>;
  zRemRangeByScore(key: string, min: number, max: number): Promise<number>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, listener: (message: string) => void): Promise<void>;
  close?(): Promise<void>;
}

type TokenPayload = {
  v: 1;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
};

type RuntimeOptions = {
  redis: RealtimeRedis;
  tokenSecret: string;
  ingestSecret: string;
  allowedOrigins?: string[];
  now?: () => number;
  heartbeatMs?: number;
  presenceTtlMs?: number;
  typingTtlMs?: number;
};

type ConnectionState = {
  id: string;
  operatorId: string;
  socket: WebSocket;
  subscriptions: Set<number>;
  alive: boolean;
  closed: boolean;
};

const persistedTypes = new Set<PersistedRealtimeEventType>([
  "conversation.updated",
  "message.created",
  "message.updated",
]);

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function equalHex(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function issueRealtimeToken({
  secret,
  subject,
  ttlSeconds = 45,
  now = Math.floor(Date.now() / 1000),
  jti = randomUUID(),
}: {
  secret: string;
  subject: string;
  ttlSeconds?: number;
  now?: number;
  jti?: string;
}): string {
  if (!secret || !subject || !jti) throw new Error("Realtime token configuration is invalid.");
  const ttl = Math.min(60, Math.max(1, Math.floor(ttlSeconds)));
  const payload: TokenPayload = { v: 1, sub: subject, iat: now, exp: now + ttl, jti };
  const encoded = base64urlJson(payload);
  return `${encoded}.${hmac(secret, encoded)}`;
}

export function verifyRealtimeToken(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): TokenPayload | null {
  if (!secret) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  const expected = hmac(secret, encoded);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<TokenPayload>;
    const iat = payload.iat;
    const exp = payload.exp;
    if (typeof iat !== "number" || typeof exp !== "number" || !Number.isInteger(iat) || !Number.isInteger(exp)) return null;
    if (
      payload.v !== 1 ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      payload.sub.length > 256 ||
      typeof payload.jti !== "string" ||
      payload.jti.length === 0 ||
      exp <= now ||
      iat > now + 5 ||
      exp - iat > 60 ||
      now - iat > 60
    ) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function operatorKey(operatorId: string): string {
  return `realtime:presence:operator:${operatorId}`;
}

function connectionKey(connectionId: string): string {
  return `realtime:presence:connection:${connectionId}`;
}

function typingKey(conversationId: number, operatorId: string): string {
  return `realtime:typing:${conversationId}:${Buffer.from(operatorId).toString("base64url")}`;
}

function typingMember(conversationId: number, operatorId: string): string {
  return `${conversationId}:${Buffer.from(operatorId).toString("base64url")}`;
}

function decodeTypingMember(member: string): { conversationId: number; operatorId: string } | null {
  const separator = member.indexOf(":");
  if (separator < 1) return null;
  const conversationId = Number(member.slice(0, separator));
  try {
    const operatorId = Buffer.from(member.slice(separator + 1), "base64url").toString("utf8");
    return Number.isSafeInteger(conversationId) && operatorId ? { conversationId, operatorId } : null;
  } catch {
    return null;
  }
}

function jsonResponse(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  const payload = JSON.stringify(body);
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(payload);
}

function rejectUpgrade(socket: Duplex, status: number): void {
  socket.write(`HTTP/1.1 ${status} Unauthorized\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function protocolHeader(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value.join(",") : value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    request.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_EVENT_BODY) {
        tooLarge = true;
        return;
      }
      chunks.push(buffer);
    });
    request.on("end", () => (tooLarge ? reject(new Error("body-too-large")) : resolveBody(Buffer.concat(chunks))));
    request.on("error", reject);
  });
}

function validPersistedEvent(value: unknown): value is PersistedRealtimeEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<PersistedRealtimeEvent>;
  return (
    event.v === REALTIME_EVENT_VERSION &&
    typeof event.eventId === "string" &&
    event.eventId.length > 0 &&
    event.eventId.length <= 128 &&
    typeof event.type === "string" &&
    persistedTypes.has(event.type as PersistedRealtimeEventType) &&
    typeof event.occurredAt === "string" &&
    Number.isSafeInteger(event.conversationId) &&
    (event.conversationId as number) > 0 &&
    !!event.data &&
    typeof event.data === "object"
  );
}

function send(socket: WebSocket, event: RealtimeServerEvent | Record<string, unknown>): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
}

export function createRealtimeServer(options: RuntimeOptions): {
  server: Server;
  listen(port?: number): Promise<void>;
  close(): Promise<void>;
  publishEvent(event: PersistedRealtimeEvent): Promise<void>;
} {
  if (!options.tokenSecret || !options.ingestSecret) throw new Error("Realtime secrets are required.");

  const redis = options.redis;
  const now = options.now ?? (() => Date.now());
  const heartbeatMs = options.heartbeatMs ?? HEARTBEAT_MS;
  const presenceTtlMs = options.presenceTtlMs ?? PRESENCE_TTL_MS;
  const typingTtlMs = options.typingTtlMs ?? TYPING_TTL_MS;
  const allowedOrigins = new Set((options.allowedOrigins?.length ? options.allowedOrigins : [DEFAULT_ORIGIN]).filter(Boolean));
  const connections = new Map<WebSocket, ConnectionState>();
  const authBySocket = new WeakMap<WebSocket, TokenPayload>();
  let presenceTimer: NodeJS.Timeout | undefined;
  let typingTimer: NodeJS.Timeout | undefined;
  let heartbeatTimer: NodeJS.Timeout | undefined;
  let listening = false;

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_WS_PAYLOAD,
    handleProtocols: (protocols) => (protocols.has(REALTIME_PROTOCOL) ? REALTIME_PROTOCOL : ""),
  });

  async function publish(channel: string, event: Record<string, unknown>): Promise<void> {
    await redis.publish(channel, JSON.stringify(event));
  }

  async function presenceCount(operatorId: string): Promise<number> {
    return redis.zCard(operatorKey(operatorId));
  }

  async function refreshPresence(connection: ConnectionState): Promise<void> {
    const expiresAt = now() + presenceTtlMs;
    await Promise.all([
      redis.sAdd(PRESENCE_OPERATORS_KEY, connection.operatorId),
      redis.zAdd(operatorKey(connection.operatorId), { score: expiresAt, value: connection.id }),
      redis.set(connectionKey(connection.id), connection.operatorId, { EX: Math.ceil(presenceTtlMs / 1000) }),
    ]);
  }

  async function broadcastPresence(operatorId: string): Promise<void> {
    const connectionsForOperator = await presenceCount(operatorId);
    await publish(PRESENCE_CHANNEL, {
      v: REALTIME_EVENT_VERSION,
      type: "presence.updated",
      operatorId,
      online: connectionsForOperator > 0,
      connections: connectionsForOperator,
    });
  }

  async function presenceSnapshot(): Promise<Array<{ operatorId: string; connections: number }>> {
    const result: Array<{ operatorId: string; connections: number }> = [];
    const operators = await redis.sMembers(PRESENCE_OPERATORS_KEY);
    for (const operatorId of operators) {
      await redis.zRemRangeByScore(operatorKey(operatorId), 0, now());
      const count = await presenceCount(operatorId);
      if (count > 0) result.push({ operatorId, connections: count });
      else await redis.sRem(PRESENCE_OPERATORS_KEY, operatorId);
    }
    return result;
  }

  async function expirePresence(): Promise<void> {
    const operators = await redis.sMembers(PRESENCE_OPERATORS_KEY);
    for (const operatorId of operators) {
      const removed = await redis.zRemRangeByScore(operatorKey(operatorId), 0, now());
      const count = await presenceCount(operatorId);
      if (count === 0) {
        await redis.sRem(PRESENCE_OPERATORS_KEY, operatorId);
        if (removed > 0) await broadcastPresence(operatorId);
      }
    }
  }

  async function publishTyping(conversationId: number, operatorId: string, active: boolean, expiresAt: number | null): Promise<void> {
    await publish(TYPING_CHANNEL, {
      v: REALTIME_EVENT_VERSION,
      type: "typing.updated",
      conversationId,
      operatorId,
      active,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  }

  async function clearTyping(conversationId: number, operatorId: string): Promise<void> {
    const removed = await redis.zRem(TYPING_EXPIRIES_KEY, typingMember(conversationId, operatorId));
    await redis.del(typingKey(conversationId, operatorId));
    if (removed > 0) await publishTyping(conversationId, operatorId, false, null);
  }

  async function expireTyping(): Promise<void> {
    const expired = await redis.zRangeByScore(TYPING_EXPIRIES_KEY, 0, now());
    for (const member of expired) {
      const typing = decodeTypingMember(member);
      if (!typing) {
        await redis.zRem(TYPING_EXPIRIES_KEY, member);
        continue;
      }
      const removed = await redis.zRem(TYPING_EXPIRIES_KEY, member);
      if (removed > 0) {
        await redis.del(typingKey(typing.conversationId, typing.operatorId));
        await publishTyping(typing.conversationId, typing.operatorId, false, null);
      }
    }
  }

  async function handlePubSub(channel: string, message: string): Promise<void> {
    try {
      const event = JSON.parse(message) as RealtimeServerEvent | PersistedRealtimeEvent;
      if (channel === EVENT_CHANNEL && validPersistedEvent(event)) {
        for (const connection of connections.values()) {
          if (connection.subscriptions.has(event.conversationId)) send(connection.socket, event);
        }
      } else if (channel === PRESENCE_CHANNEL && event && event.type === "presence.updated") {
        for (const connection of connections.values()) send(connection.socket, event);
      } else if (channel === TYPING_CHANNEL && event && event.type === "typing.updated") {
        for (const connection of connections.values()) {
          if (connection.subscriptions.has(event.conversationId)) send(connection.socket, event);
        }
      }
    } catch {
      // Redis messages are untrusted input from another process; ignore malformed data.
    }
  }

  async function handleCommand(connection: ConnectionState, raw: RawData): Promise<void> {
    let command: RealtimeClientCommand;
    try {
      command = JSON.parse(raw.toString()) as RealtimeClientCommand;
    } catch {
      send(connection.socket, { v: 1, type: "error", code: "invalid_command" });
      return;
    }
    if (!command || !Number.isSafeInteger(command.conversationId) || command.conversationId <= 0) {
      send(connection.socket, { v: 1, type: "error", code: "invalid_command" });
      return;
    }
    if (command.type === "subscribe") connection.subscriptions.add(command.conversationId);
    else if (command.type === "unsubscribe") {
      connection.subscriptions.delete(command.conversationId);
      await clearTyping(command.conversationId, connection.operatorId);
    } else if (command.type === "typing" && typeof command.active === "boolean") {
      if (!connection.subscriptions.has(command.conversationId)) return;
      if (!command.active) return clearTyping(command.conversationId, connection.operatorId);
      const expiresAt = now() + typingTtlMs;
      await Promise.all([
        redis.set(typingKey(command.conversationId, connection.operatorId), "1", { EX: Math.max(1, Math.ceil(typingTtlMs / 1000)) }),
        redis.zAdd(TYPING_EXPIRIES_KEY, { score: expiresAt, value: typingMember(command.conversationId, connection.operatorId) }),
      ]);
      await publishTyping(command.conversationId, connection.operatorId, true, expiresAt);
    } else send(connection.socket, { v: 1, type: "error", code: "invalid_command" });
  }

  async function removeConnection(connection: ConnectionState): Promise<void> {
    if (connection.closed) return;
    connection.closed = true;
    connections.delete(connection.socket);
    await Promise.all([...connection.subscriptions].map((conversationId) => clearTyping(conversationId, connection.operatorId)));
    await Promise.all([redis.zRem(operatorKey(connection.operatorId), connection.id), redis.del(connectionKey(connection.id))]);
    const count = await presenceCount(connection.operatorId);
    if (count === 0) {
      await redis.sRem(PRESENCE_OPERATORS_KEY, connection.operatorId);
      await broadcastPresence(connection.operatorId);
    } else await broadcastPresence(connection.operatorId);
  }

  wss.on("connection", (socket) => {
    const token = authBySocket.get(socket);
    if (!token) return socket.close(1008, "unauthorized");
    const connection: ConnectionState = {
      id: randomUUID(),
      operatorId: token.sub,
      socket,
      subscriptions: new Set(),
      alive: true,
      closed: false,
    };
    connections.set(socket, connection);
    socket.on("pong", () => {
      connection.alive = true;
      void refreshPresence(connection).catch(() => undefined);
    });
    socket.on("message", (raw) => void handleCommand(connection, raw).catch(() => socket.close(1011)));
    socket.on("close", () => void removeConnection(connection).catch(() => undefined));
    socket.on("error", () => undefined);
    void refreshPresence(connection)
      .then(async () => {
        send(socket, {
          v: REALTIME_EVENT_VERSION,
          type: "server.hello",
          connectionId: connection.id,
          operatorId: connection.operatorId,
          heartbeatMs,
        });
        send(socket, { v: REALTIME_EVENT_VERSION, type: "presence.snapshot", operators: await presenceSnapshot() });
        await broadcastPresence(connection.operatorId);
      })
      .catch(() => socket.close(1011));
  });

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://realtime.local");
      if (request.method === "GET" && requestUrl.pathname === "/healthz") {
        await redis.ping();
        return jsonResponse(response, 200, { ok: true });
      }
      if (request.method !== "POST" || requestUrl.pathname !== "/internal/events") {
        return jsonResponse(response, 404, { error: "not_found" });
      }
      const timestamp = request.headers["x-realtime-timestamp"];
      const signature = request.headers["x-realtime-signature"];
      const headerEventId = request.headers["x-realtime-event-id"];
      if (typeof timestamp !== "string" || !/^\d{1,12}$/.test(timestamp) || Math.abs(Math.floor(now() / 1000) - Number(timestamp)) > 60) {
        return jsonResponse(response, 401, { error: "invalid_signature" });
      }
      const body = await readBody(request);
      const expected = createHmac("sha256", options.ingestSecret).update(`${timestamp}.${body.toString("utf8")}`).digest("hex");
      if (typeof signature !== "string" || !/^sha256=[a-f0-9]{64}$/.test(signature) || !equalHex(signature.slice(7), expected)) {
        return jsonResponse(response, 401, { error: "invalid_signature" });
      }
      const event = JSON.parse(body.toString("utf8")) as unknown;
      if (!validPersistedEvent(event) || typeof headerEventId !== "string" || headerEventId !== event.eventId) {
        return jsonResponse(response, 400, { error: "invalid_event" });
      }
      const accepted = await redis.set(`realtime:ingest:${event.eventId}`, "1", { NX: true, EX: EVENT_ID_TTL_SECONDS });
      if (!accepted) return jsonResponse(response, 200, { ok: true, duplicate: true });
      await publishEvent(event);
      return jsonResponse(response, 202, { ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "body-too-large") return jsonResponse(response, 413, { error: "body_too_large" });
      if (error instanceof SyntaxError) return jsonResponse(response, 400, { error: "invalid_json" });
      return jsonResponse(response, 503, { error: "temporarily_unavailable" });
    }
  });

  server.on("upgrade", (request, socket, head) => {
    const requestUrl = new URL(request.url ?? "/", "http://realtime.local");
    const origin = request.headers.origin;
    const protocols = protocolHeader(request.headers["sec-websocket-protocol"]);
    const bearer = protocols.find((protocol) => protocol.startsWith("bearer."))?.slice(7);
    if (
      requestUrl.pathname !== "/ws" ||
      requestUrl.search ||
      typeof origin !== "string" ||
      !allowedOrigins.has(origin) ||
      !protocols.includes(REALTIME_PROTOCOL) ||
      !bearer ||
      !verifyRealtimeToken(bearer, options.tokenSecret, Math.floor(now() / 1000))
    ) return rejectUpgrade(socket, 401);
    const payload = verifyRealtimeToken(bearer, options.tokenSecret, Math.floor(now() / 1000));
    if (!payload) return rejectUpgrade(socket, 401);
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      authBySocket.set(webSocket, payload);
      wss.emit("connection", webSocket, request);
    });
  });

  const subscriptionsReady = Promise.all([
    redis.subscribe(EVENT_CHANNEL, (message) => void handlePubSub(EVENT_CHANNEL, message)),
    redis.subscribe(PRESENCE_CHANNEL, (message) => void handlePubSub(PRESENCE_CHANNEL, message)),
    redis.subscribe(TYPING_CHANNEL, (message) => void handlePubSub(TYPING_CHANNEL, message)),
  ]);

  async function publishEvent(event: PersistedRealtimeEvent): Promise<void> {
    await redis.publish(EVENT_CHANNEL, JSON.stringify(event));
  }

  return {
    server,
    async listen(port = 3000): Promise<void> {
      await subscriptionsReady;
      await new Promise<void>((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(port, "0.0.0.0", () => {
          server.off("error", reject);
          listening = true;
          resolveListen();
        });
      });
      presenceTimer = setInterval(() => void expirePresence().catch(() => undefined), 1000);
      typingTimer = setInterval(() => void expireTyping().catch(() => undefined), 250);
      heartbeatTimer = setInterval(() => {
        for (const connection of connections.values()) {
          if (!connection.alive) {
            connection.socket.terminate();
            continue;
          }
          connection.alive = false;
          connection.socket.ping();
        }
      }, heartbeatMs);
    },
    async close(): Promise<void> {
      if (presenceTimer) clearInterval(presenceTimer);
      if (typingTimer) clearInterval(typingTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      for (const connection of connections.values()) connection.socket.close(1001);
      await new Promise<void>((resolveClose) => wss.close(() => resolveClose()));
      if (listening) await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
      await redis.close?.();
    },
    publishEvent,
  };
}

async function createRedisFromEnv(): Promise<RealtimeRedis> {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required.");
  const command = createClient({ url });
  const subscriber = command.duplicate();
  command.on("error", () => console.error("[realtime] redis command error"));
  subscriber.on("error", () => console.error("[realtime] redis subscriber error"));
  await Promise.all([command.connect(), subscriber.connect()]);
  return {
    ping: () => command.ping(),
    set: (key, value, options) => command.set(key, value, options),
    del: (key) => command.del(key),
    exists: (key) => command.exists(key),
    sAdd: (key, member) => command.sAdd(key, member),
    sRem: (key, member) => command.sRem(key, member),
    sMembers: (key) => command.sMembers(key),
    zAdd: (key, item) => command.zAdd(key, item),
    zRem: (key, member) => command.zRem(key, member),
    zCard: (key) => command.zCard(key),
    zRangeByScore: (key, min, max) => command.zRangeByScore(key, min, max),
    zRemRangeByScore: (key, min, max) => command.zRemRangeByScore(key, min, max),
    publish: (channel, message) => command.publish(channel, message),
    subscribe: (channel, listener) => subscriber.subscribe(channel, listener),
    close: async () => {
      await Promise.all([subscriber.quit(), command.quit()]);
    },
  };
}

async function main(): Promise<void> {
  const redis = await createRedisFromEnv();
  const runtime = createRealtimeServer({
    redis,
    tokenSecret: process.env.REALTIME_TOKEN_SECRET ?? "",
    ingestSecret: process.env.REALTIME_INGEST_SECRET ?? "",
    allowedOrigins: (process.env.REALTIME_ALLOWED_ORIGINS ?? DEFAULT_ORIGIN).split(",").map((origin) => origin.trim()),
  });
  await runtime.listen(Number(process.env.PORT ?? 3000));
  console.log("[realtime] listening");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(pathToFileURL(import.meta.url))) {
  void main().catch(() => {
    console.error("[realtime] startup failed");
    process.exitCode = 1;
  });
}

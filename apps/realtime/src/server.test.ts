import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test, afterEach } from "node:test";
import { WebSocket } from "ws";
import { REALTIME_PROTOCOL, type PersistedRealtimeEvent } from "../../../src/lib/realtime-protocol.js";
import { createRealtimeServer, issueRealtimeToken, verifyRealtimeToken, type RealtimeRedis } from "./server.js";

class MemoryRedis implements RealtimeRedis {
  private readonly values = new Map<string, { value: string; expiresAt?: number }>();
  private readonly sets = new Map<string, Set<string>>();
  private readonly sorted = new Map<string, Map<string, number>>();
  private readonly listeners = new Map<string, Set<(message: string) => void>>();

  private purge(key: string): void {
    const value = this.values.get(key);
    if (value?.expiresAt && value.expiresAt <= Date.now()) this.values.delete(key);
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async set(key: string, value: string, options: { NX?: boolean; EX?: number } = {}): Promise<string | null> {
    this.purge(key);
    if (options.NX && this.values.has(key)) return null;
    this.values.set(key, { value, expiresAt: options.EX ? Date.now() + options.EX * 1000 : undefined });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return Number(this.values.delete(key));
  }

  async exists(key: string): Promise<number> {
    this.purge(key);
    return Number(this.values.has(key));
  }

  async sAdd(key: string, member: string): Promise<number> {
    const set = this.sets.get(key) ?? new Set<string>();
    const added = Number(!set.has(member));
    set.add(member);
    this.sets.set(key, set);
    return added;
  }

  async sRem(key: string, member: string): Promise<number> {
    return Number(this.sets.get(key)?.delete(member) ?? false);
  }

  async sMembers(key: string): Promise<string[]> {
    return [...(this.sets.get(key) ?? [])];
  }

  async zAdd(key: string, item: { score: number; value: string }): Promise<number> {
    const sorted = this.sorted.get(key) ?? new Map<string, number>();
    const added = Number(!sorted.has(item.value));
    sorted.set(item.value, item.score);
    this.sorted.set(key, sorted);
    return added;
  }

  async zRem(key: string, member: string): Promise<number> {
    return Number(this.sorted.get(key)?.delete(member) ?? false);
  }

  async zCard(key: string): Promise<number> {
    return this.sorted.get(key)?.size ?? 0;
  }

  async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
    return [...(this.sorted.get(key) ?? new Map()).entries()]
      .filter(([, score]) => score >= min && score <= max)
      .map(([member]) => member);
  }

  async zRemRangeByScore(key: string, min: number, max: number): Promise<number> {
    let removed = 0;
    for (const [member, score] of this.sorted.get(key) ?? []) {
      if (score >= min && score <= max) {
        this.sorted.get(key)?.delete(member);
        removed += 1;
      }
    }
    return removed;
  }

  async publish(channel: string, message: string): Promise<number> {
    await Promise.all([...(this.listeners.get(channel) ?? [])].map((listener) => listener(message)));
    return this.listeners.get(channel)?.size ?? 0;
  }

  async subscribe(channel: string, listener: (message: string) => void): Promise<void> {
    const listeners = this.listeners.get(channel) ?? new Set();
    listeners.add(listener);
    this.listeners.set(channel, listeners);
  }
}

const runtimes: Array<ReturnType<typeof createRealtimeServer>> = [];

async function startTestRuntime(redis = new MemoryRedis()): Promise<{
  runtime: ReturnType<typeof createRealtimeServer>;
  url: string;
  http: string;
}> {
  const runtime = createRealtimeServer({
    redis,
    tokenSecret: "token-secret",
    ingestSecret: "ingest-secret",
    allowedOrigins: ["https://allok.fun"],
    heartbeatMs: 100,
    presenceTtlMs: 500,
    typingTtlMs: 80,
  });
  await runtime.listen(0);
  runtimes.push(runtime);
  const address = runtime.server.address();
  assert.ok(address && typeof address === "object");
  return { runtime, url: `ws://127.0.0.1:${address.port}/ws`, http: `http://127.0.0.1:${address.port}` };
}

afterEach(async () => {
  while (runtimes.length) await runtimes.pop()?.close();
});

function connect(url: string, token?: string): Promise<{ socket: WebSocket; messages: Array<Record<string, unknown>> }> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, token ? [REALTIME_PROTOCOL, `bearer.${token}`] : [REALTIME_PROTOCOL], {
      headers: { Origin: "https://allok.fun" },
    });
    const messages: Array<Record<string, unknown>> = [];
    socket.on("message", (raw) => messages.push(JSON.parse(raw.toString()) as Record<string, unknown>));
    socket.once("open", () => resolve({ socket, messages }));
    socket.once("error", reject);
  });
}

async function waitFor(messages: Array<Record<string, unknown>>, predicate: (message: Record<string, unknown>) => boolean): Promise<Record<string, unknown>> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    const found = messages.find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail("Timed out waiting for realtime event");
}

function closeSocket(socket: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    socket.once("close", () => resolve());
    socket.close();
  });
}

test("issues short HMAC tokens and rejects tampering/expiry", () => {
  const token = issueRealtimeToken({ secret: "secret", subject: "operator-1", now: 100, ttlSeconds: 999 });
  const payload = verifyRealtimeToken(token, "secret", 100);
  assert.equal(payload?.sub, "operator-1");
  assert.equal(payload && payload.exp - payload.iat, 60);
  assert.equal(verifyRealtimeToken(`${token}x`, "secret", 100), null);
  assert.equal(verifyRealtimeToken(token, "secret", 161), null);
});

test("authenticates two clients, keeps multip-tab presence, routes events and typing", async () => {
  const { url, http } = await startTestRuntime();
  const token = issueRealtimeToken({ secret: "token-secret", subject: "operator-1" });
  const first = await connect(url, token);
  const second = await connect(url, token);
  await waitFor(first.messages, (message) => message.type === "presence.updated" && message.connections === 2);
  first.socket.send(JSON.stringify({ type: "subscribe", conversationId: 42 }));
  second.socket.send(JSON.stringify({ type: "subscribe", conversationId: 99 }));
  first.socket.send(JSON.stringify({ type: "typing", conversationId: 42, active: true }));
  await waitFor(first.messages, (message) => message.type === "typing.updated" && message.active === true);
  await new Promise((resolve) => setTimeout(resolve, 120));
  await waitFor(first.messages, (message) => message.type === "typing.updated" && message.active === false);

  const event: PersistedRealtimeEvent = {
    v: 1,
    eventId: "evt-1",
    type: "message.created",
    occurredAt: new Date().toISOString(),
    conversationId: 42,
    data: { messageId: 7 },
  };
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify(event);
  const signature = createHmac("sha256", "ingest-secret").update(`${timestamp}.${body}`).digest("hex");
  const response = await fetch(`${http}/internal/events`, {
    method: "POST",
    headers: { "x-realtime-timestamp": timestamp, "x-realtime-signature": `sha256=${signature}`, "x-realtime-event-id": event.eventId },
    body,
  });
  assert.equal(response.status, 202);
  await waitFor(first.messages, (message) => message.type === "message.created");
  assert.equal(second.messages.some((message) => message.type === "message.created"), false);
  await closeSocket(first.socket);
  await waitFor(second.messages, (message) => message.type === "presence.updated" && message.connections === 1 && message.online === true);
  await closeSocket(second.socket);
});

test("rejects missing websocket auth and invalid ingest signatures", async () => {
  const { url, http } = await startTestRuntime();
  await assert.rejects(connect(url));
  const response = await fetch(`${http}/internal/events`, {
    method: "POST",
    headers: { "x-realtime-timestamp": String(Math.floor(Date.now() / 1000)), "x-realtime-signature": "sha256=" + "0".repeat(64) },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 401);
});

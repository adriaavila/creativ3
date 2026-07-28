"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Loader2, MessageCircle, Send, Smartphone, Sparkles, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { WaConversation, WaMessage } from "@/lib/whatsapp-inbox-db";

type InboxClientProps = {
  initialConversations: WaConversation[];
};

const POLL_MS = 5000;

// Apple-design spring defaults: critically damped (no overshoot) for ordinary
// UI, response ~0.3s. See skill apple-design §4 — bounce only for
// momentum-driven gestures, which nothing here has.
const TAP_SPRING = { type: "spring" as const, bounce: 0, duration: 0.3 };

function channelLabel(conversation: WaConversation) {
  return conversation.channelKind === "cloud_api" ? "Cloud API" : "WAHA";
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

export default function InboxClient({ initialConversations }: InboxClientProps) {
  const reduceMotion = useReducedMotion();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<number | null>(initialConversations[0]?.id ?? null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, WaMessage[]>>({});
  const messages = useMemo(
    () => (selectedId ? messagesByConversation[selectedId] ?? [] : []),
    [messagesByConversation, selectedId],
  );
  const [draftText, setDraftText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  // Poll conversation list.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/ops/inbox", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { conversations: WaConversation[] };
        if (!cancelled) setConversations(data.conversations);
      } catch {
        // silent — next tick retries
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Poll the open thread. No setState for the "nothing selected" case — the
  // derived `messages` above already reads as [] when selectedId is null.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/ops/inbox/${selectedId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: WaMessage[] };
        if (!cancelled) {
          setMessagesByConversation((prev) => ({ ...prev, [selectedId]: data.messages }));
        }
      } catch {
        // silent — next tick retries
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, reduceMotion]);

  async function requestSuggestion() {
    if (!selectedId) return;
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/inbox/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "suggest" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo sugerir una respuesta.");
      setDraftText(data.suggestion.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sugerir.");
    } finally {
      setSuggesting(false);
    }
  }

  async function sendMessage() {
    if (!selectedId || !draftText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/inbox/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "send", text: draftText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar.");
      setDraftText("");
      const refreshed = await fetch(`/api/ops/inbox/${selectedId}`, { cache: "no-store" });
      const refreshedData = await refreshed.json();
      setMessagesByConversation((prev) => ({ ...prev, [selectedId]: refreshedData.messages ?? [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar.");
    } finally {
      setSending(false);
    }
  }

  async function toggleAssignedMode() {
    if (!selected) return;
    const next = selected.assignedMode === "human" ? "ai" : "human";
    setTogglingMode(true);
    try {
      await fetch(`/api/ops/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedMode: next }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, assignedMode: next } : c)),
      );
    } finally {
      setTogglingMode(false);
    }
  }

  return (
    <main className="flex h-screen flex-col bg-[#0f1711] text-white">
      {/* Materialized header: translucent, blurred, content scrolls underneath — not an opaque strip. */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f1711]/70 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/ops"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
            aria-label="Volver a Ops"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">
              Inbox WhatsApp
            </div>
            <h1 className="mt-0.5 font-display text-2xl leading-none tracking-[-0.01em]">
              Conversaciones
            </h1>
          </div>
        </div>
        {error && (
          <p className="max-w-sm truncate rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
            {error}
          </p>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Conversation list */}
        <aside className="w-full max-w-xs shrink-0 overflow-y-auto border-r border-white/10 sm:max-w-sm">
          {conversations.length === 0 && (
            <p className="p-6 text-sm text-white/40">Sin conversaciones todavía.</p>
          )}
          <ul>
            {conversations.map((conversation) => {
              const active = conversation.id === selectedId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`flex w-full flex-col gap-1 border-b border-white/5 px-4 py-3 text-left transition ${
                      active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {conversation.contactName || conversation.contactWaId}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/40">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[#a9c989]">
                        {channelLabel(conversation)}
                      </span>
                      {conversation.assignedMode === "ai" && (
                        <span className="flex items-center gap-1 rounded-full bg-[#dbe9c3]/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#dbe9c3]">
                          <Bot className="size-2.5" /> IA
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Thread */}
        <section className="flex min-h-0 flex-1 flex-col">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-white/40">
              Elegí una conversación.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5 sm:px-6">
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="size-4 text-[#a9c989]" />
                  <span className="font-medium">{selected.contactName || selected.contactWaId}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50">{channelLabel(selected)}</span>
                </div>
                <motion.button
                  type="button"
                  onClick={toggleAssignedMode}
                  disabled={togglingMode}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  transition={TAP_SPRING}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {selected.assignedMode === "human" ? (
                    <>
                      <User className="size-3.5" /> Modo humano
                    </>
                  ) : (
                    <>
                      <Bot className="size-3.5" /> Modo IA (sugiere)
                    </>
                  )}
                </motion.button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {messages.map((message) => {
                  const mine = message.direction === "out";
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                          mine ? "bg-[#dbe9c3] text-[#172016]" : "bg-white/[0.06] text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <div
                          className={`mt-1 flex items-center gap-1 text-[10px] ${
                            mine ? "text-[#172016]/50" : "text-white/35"
                          }`}
                        >
                          {message.source === "phone" && <Smartphone className="size-2.5" />}
                          {message.source === "ai" && <Sparkles className="size-2.5" />}
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              <div className="border-t border-white/10 bg-white/[0.02] p-3 sm:p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    placeholder="Escribí una respuesta…"
                    rows={2}
                    className="min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#a9c989]/50 focus:outline-none"
                  />
                  <motion.button
                    type="button"
                    onClick={requestSuggestion}
                    disabled={suggesting}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={TAP_SPRING}
                    aria-label="Sugerir respuesta con IA"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a9c989] transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {suggesting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || !draftText.trim()}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={TAP_SPRING}
                    aria-label="Enviar"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dbe9c3] text-[#172016] transition hover:bg-white disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </motion.button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/35">
                  <Check className="size-3" /> Toda respuesta sale solo cuando vos apretás enviar.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}


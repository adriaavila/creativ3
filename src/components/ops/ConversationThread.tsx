"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Check, CheckCheck, ChevronLeft, Link2, Loader2, Phone, Send, Smartphone, Sparkles, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ConversationOutcome, WaConversation, WaMessage } from "@/lib/whatsapp-inbox-db";
import { formatWhatsAppPhone } from "@/lib/phone";
import { freeTextWindow } from "@/lib/whatsapp-window";
import { eventConversation, eventMessage, useOpsRealtime, type OpsRealtimeEvent } from "@/hooks/useOpsRealtime";
import TemplateComposer from "./TemplateComposer";

const OUTCOMES: { id: ConversationOutcome; label: string }[] = [
  { id: "cita", label: "Cita" },
  { id: "cotizacion", label: "Cotización" },
  { id: "descarte", label: "Descarte" },
];

type ConversationThreadProps = {
  conversation: WaConversation;
  leadId?: string | null;
  onConversationChange?: (conversation: WaConversation) => void;
  onBack?: () => void;
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  return date.toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
}

function sameDay(left: string, right: string) {
  return new Date(left).toDateString() === new Date(right).toDateString();
}

function channelLabel(conversation: WaConversation) {
  return conversation.channelKind === "cloud_api" ? "WhatsApp oficial" : "WAHA · no oficial";
}

function conversationInitials(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "WA";
}

function formatWindowCountdown(msRemaining: number) {
  const totalMinutes = Math.max(1, Math.floor(msRemaining / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes.toString().padStart(2, "0")}m` : `${minutes}m`;
}

function safeFailureReason(payload: Record<string, unknown>) {
  const candidates: unknown[] = [payload.reason, payload.details, payload.error_message, payload.title, payload.message];
  if (payload.error && typeof payload.error === "object") {
    const error = payload.error as Record<string, unknown>;
    candidates.push(error.message, error.details, error.title, error.reason);
  }
  const reason = candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return reason?.trim().slice(0, 180) ?? "No se pudo entregar el mensaje.";
}

function DeliveryStatus({ message }: { message: WaMessage }) {
  if (message.direction !== "out") return null;
  const status = message.status?.toLowerCase() ?? "sent";
  if (status === "failed") {
    const reason = safeFailureReason(message.payload);
    return <span className="inline-flex max-w-full items-center gap-1 text-[#f1a4a4]" title={reason} aria-label={`Falló: ${reason}`}><AlertTriangle className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{reason}</span></span>;
  }
  if (status === "pending" || status === "unknown") {
    return <span className="inline-flex items-center gap-1 text-[#f4cf79]" aria-label="Entrega no confirmada"><AlertTriangle className="size-3" aria-hidden="true" />Sin confirmar</span>;
  }
  if (status === "read") return <CheckCheck className="size-3 text-[#9bc9ff]" aria-label="Leído" role="img" />;
  if (status === "delivered") return <CheckCheck className="size-3 text-[#c4d49b]" aria-label="Entregado" role="img" />;
  return <Check className="size-3" aria-label="Enviado" role="img" />;
}

function realtimeLabel(status: string) {
  return status === "connected" ? "Conectado" : status === "reconnecting" ? "Reconectando" : status === "connecting" ? "Conectando" : "Offline";
}

export default function ConversationThread({ conversation, leadId, onConversationChange, onBack }: ConversationThreadProps) {
  const reduceMotion = useReducedMotion();
  const [conversationOverride, setConversationOverride] = useState<WaConversation | null>(null);
  const current = conversationOverride ?? conversation;
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [draftText, setDraftText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);
  const [markingOutcome, setMarkingOutcome] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryUnconfirmed, setDeliveryUnconfirmed] = useState(false);
  const [windowNow, setWindowNow] = useState(0);
  const [templateModeKey, setTemplateModeKey] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const actionIdRef = useRef<string | null>(null);
  const onConversationChangeRef = useRef(onConversationChange);
  const phone = formatWhatsAppPhone(current.contactPhone || current.contactWaId);
  const conversationId = current.id;
  const cloudApi = current.channelKind === "cloud_api";
  const freeTextState = cloudApi && windowNow > 0 ? freeTextWindow(current.lastInboundAt, windowNow) : null;
  const showTemplateComposer = cloudApi && (templateModeKey === `${conversationId}:${current.lastInboundAt ?? ""}` || freeTextState?.open === false);

  useEffect(() => {
    onConversationChangeRef.current = onConversationChange;
  }, [onConversationChange]);

  useEffect(() => {
    const initial = window.setTimeout(() => setWindowNow(Date.now()), 0);
    const timer = window.setInterval(() => setWindowNow(Date.now()), 30_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [conversationId, current.lastInboundAt]);

  const refreshThread = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/inbox/${conversationId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { conversation: WaConversation; messages: WaMessage[] };
      setMessages(data.messages ?? []);
      setConversationOverride(data.conversation);
      onConversationChangeRef.current?.(data.conversation);
    } catch {
      // HTTP recovery remains available after a realtime interruption.
    }
  }, [conversationId]);

  const updateConversation = useCallback((next: WaConversation) => {
    setConversationOverride(next);
    onConversationChangeRef.current?.(next);
  }, []);

  const handleRealtimeEvent = useCallback((event: OpsRealtimeEvent) => {
    if (event.type !== "conversation.updated" && event.type !== "message.created" && event.type !== "message.updated") return;
    const nextConversation = eventConversation(event);
    const nextMessage = eventMessage(event);
    const eventConversationId = event.conversationId ?? nextMessage?.conversationId ?? nextConversation?.id;
    if (eventConversationId !== conversationId) return;
    if (nextConversation) updateConversation(nextConversation);
    if (nextMessage) {
      setMessages((items) => {
        const index = items.findIndex((item) => item.id === nextMessage.id);
        if (index === -1) return [...items, nextMessage];
        return items.map((item) => (item.id === nextMessage.id ? nextMessage : item));
      });
    } else if (event.type !== "conversation.updated" || !nextConversation) {
      void refreshThread();
    }
  }, [conversationId, refreshThread, updateConversation]);

  const realtime = useOpsRealtime({ onEvent: handleRealtimeEvent, onReconnect: refreshThread });
  const { sendTyping, subscribe, typingByConversation, unsubscribe } = realtime;
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingLastSentRef = useRef(0);
  const typingActiveRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (typingActiveRef.current) sendTyping(conversationId, false);
    typingActiveRef.current = false;
  }, [conversationId, sendTyping]);

  const handleDraftChange = useCallback((value: string) => {
    actionIdRef.current = null;
    setDeliveryUnconfirmed(false);
    setDraftText(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    const now = Date.now();
    if (!typingActiveRef.current || now - typingLastSentRef.current >= 800) {
      sendTyping(conversationId, true);
      typingActiveRef.current = true;
      typingLastSentRef.current = now;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1_200);
  }, [conversationId, sendTyping, stopTyping]);

  useEffect(() => {
    const timer = setTimeout(() => void refreshThread(), 0);
    return () => clearTimeout(timer);
  }, [refreshThread]);

  useEffect(() => {
    subscribe(conversationId);
    return () => unsubscribe(conversationId);
  }, [conversationId, subscribe, unsubscribe]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, reduceMotion]);

  async function patchConversation(body: Record<string, unknown>) {
    const response = await fetch(`/api/ops/inbox/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error("No se pudo actualizar la conversación.");
    const refreshed = await fetch(`/api/ops/inbox/${current.id}`, { cache: "no-store" });
    const data = (await refreshed.json()) as { conversation: WaConversation };
    updateConversation(data.conversation);
  }

  async function requestSuggestion() {
    setSuggesting(true);
    setError(null);
    try {
      const response = await fetch(`/api/ops/inbox/${current.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "suggest" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo sugerir una respuesta.");
      actionIdRef.current = null;
      setDeliveryUnconfirmed(false);
      setDraftText(data.suggestion.text);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error al sugerir.");
    } finally {
      setSuggesting(false);
    }
  }

  async function sendMessage() {
    if (!draftText.trim()) {
      stopTyping();
      return;
    }
    if (showTemplateComposer) {
      stopTyping();
      setTemplateModeKey(`${conversationId}:${current.lastInboundAt ?? ""}`);
      return;
    }
    stopTyping();
    setSending(true);
    setError(null);
    const actionId = actionIdRef.current ?? crypto.randomUUID();
    actionIdRef.current = actionId;
    let responseReceived = false;
    try {
      const response = await fetch(`/api/ops/inbox/${current.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "send", actionId, text: draftText.trim() }) });
      responseReceived = true;
      const data = (await response.json()) as { error?: string; requiresTemplate?: boolean; status?: string };
      if (response.status === 202 || data.status === "pending" || data.status === "unknown") {
        setDeliveryUnconfirmed(true);
        setError(data.error ?? "Entrega no confirmada; no reintentes este mensaje.");
        return;
      }
      if (!response.ok) {
        if (response.status === 409 && data.requiresTemplate) setTemplateModeKey(`${conversationId}:${current.lastInboundAt ?? ""}`);
        throw new Error(data.error ?? "No se pudo enviar.");
      }
      actionIdRef.current = null;
      setDeliveryUnconfirmed(false);
      setDraftText("");
      await refreshThread();
    } catch (reason) {
      if (!responseReceived) setDeliveryUnconfirmed(true);
      setError(reason instanceof Error ? reason.message : "Error al enviar.");
    } finally {
      setSending(false);
    }
  }

  async function toggleAssignedMode() {
    const next = current.assignedMode === "human" ? "ai" : "human";
    setTogglingMode(true);
    setError(null);
    try { await patchConversation({ assignedMode: next }); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cambiar el modo."); } finally { setTogglingMode(false); }
  }

  async function markOutcome(outcome: ConversationOutcome) {
    const next = current.outcome === outcome ? null : outcome;
    setMarkingOutcome(true);
    setError(null);
    try { await patchConversation({ outcome: next }); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo marcar el resultado."); } finally { setMarkingOutcome(false); }
  }

  async function linkLead() {
    if (!leadId) return;
    setLinking(true);
    setError(null);
    try { await patchConversation({ leadId }); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo vincular el lead."); } finally { setLinking(false); }
  }

  const handleTemplateSent = useCallback(() => {
    setError(null);
    void refreshThread();
  }, [refreshThread]);
  const typingCount = typingByConversation[conversationId]?.length ?? 0;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f7f8fa]" aria-label="Conversación">
      <header className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && <button type="button" onClick={onBack} className="rounded-md p-1 text-[#7f8b9a] hover:bg-[#f1f4f7] hover:text-[#172238] lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b]" aria-label="Volver a conversaciones"><ChevronLeft className="size-4" /></button>}
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#73718d] text-[11px] font-semibold text-white">{conversationInitials(current.contactName)}</span>
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-semibold text-[#172238]">{current.contactName || "Contacto de WhatsApp"}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#7e8a98]">
                {phone ? <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-[#506176] hover:text-[#172238]" aria-label={`Llamar a ${phone}`}><Phone className="size-3" /> {phone}</a> : <span>Número no disponible</span>}
                <span>· {channelLabel(current)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#7e8a98]" role="status" aria-live="polite">
            <span className={`size-1.5 rounded-full ${realtime.status === "connected" ? "bg-[#a8d63d]" : "bg-[#aeb8c2]"}`} aria-hidden="true" />
            {realtimeLabel(realtime.status)} · {realtime.onlineOperators.length} online
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f3] pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {OUTCOMES.map((outcome) => {
              const active = current.outcome === outcome.id;
              return <button key={outcome.id} type="button" onClick={() => void markOutcome(outcome.id)} disabled={markingOutcome} aria-pressed={active} className={`min-h-7 rounded-full border px-2.5 text-[10px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50 ${active ? "border-[#3f5f7b] bg-[#eef3f7] text-[#3f5f7b]" : "border-[#e1e6ec] text-[#7c8998] hover:border-[#b9c5d2] hover:text-[#172238]"}`}>{outcome.label}</button>;
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => void toggleAssignedMode()} disabled={togglingMode} className="flex min-h-7 items-center gap-1.5 rounded-full border border-[#e1e6ec] px-2.5 text-[10px] text-[#536275] hover:border-[#b9c5d2] hover:text-[#172238] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50">{current.assignedMode === "human" ? <User className="size-3" /> : <Bot className="size-3" />}{current.assignedMode === "human" ? "Humano" : "IA"}</button>
            {leadId && current.leadId !== leadId && <button type="button" onClick={() => void linkLead()} disabled={linking} className="flex min-h-7 items-center gap-1.5 rounded-full border border-[#3f5f7b] px-2.5 text-[10px] text-[#3f5f7b] hover:bg-[#eef3f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50">{linking ? <Loader2 className="size-3 animate-spin" /> : <Link2 className="size-3" />} Vincular lead</button>}
          </div>
        </div>
        {error && <p className="mt-3 rounded-md border border-[#f0caca] bg-[#fff5f5] px-3 py-2 text-xs text-[#a33b3b]" role="alert">{error}</p>}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {messages.length === 0 && <p className="py-12 text-center text-sm text-[#7c8998]">Aún no hay mensajes.<br />Cuando llegue el primero, aparecerá aquí.</p>}
        {messages.map((message, index) => {
          const mine = message.direction === "out";
          const previous = messages[index - 1];
          const showDay = !previous || !sameDay(previous.createdAt, message.createdAt);
          return (
            <div key={message.id}>
              {showDay && <div className="my-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#9aa5b2]"><span className="h-px flex-1 bg-[#e1e6ec]" />{formatDay(message.createdAt)}<span className="h-px flex-1 bg-[#e1e6ec]" /></div>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-[10px] border px-3.5 py-2.5 text-[13px] leading-5 shadow-[0_1px_2px_rgba(23,34,56,0.03)] sm:max-w-[76%] ${mine ? "border-[#d7e2eb] bg-[#eef4f8] text-[#263b54]" : "border-[#e5e7eb] bg-white text-[#172238]"}`}>
                  <p className="whitespace-pre-wrap">{message.body || `[${message.msgType}]`}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-[#73879a]" : "text-[#98a3af]"}`}>
                    {message.source === "phone" && <Smartphone className="size-2.5" aria-label="Enviado desde teléfono" />}
                    {message.source === "ai" && <Sparkles className="size-2.5" aria-label="Enviado por IA" />}
                    {formatTime(message.createdAt)}<DeliveryStatus message={message} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      <footer className="shrink-0 border-t border-[#e5e7eb] bg-white p-3 sm:p-4">
        {cloudApi && freeTextState && <div className={`mb-3 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-[11px] ${freeTextState.open ? "border-[#d7e8b0] bg-[#f7fbe9] text-[#587126]" : "border-[#e5e7eb] bg-[#fafbfc] text-[#7c8998]"}`} role="status" aria-live="polite"><span className="font-medium">{freeTextState.open ? "Ventana de 24 horas abierta" : "Ventana libre cerrada"}</span><span>{freeTextState.open ? `Puedes enviar mensajes libres · quedan ${formatWindowCountdown(freeTextState.msRemaining)}` : "Usa una plantilla aprobada por Meta"}</span></div>}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`reply-${conversationId}`} className="sr-only">Respuesta para {current.contactName || phone || "contacto"}</label>
            <textarea id={`reply-${conversationId}`} value={draftText} onChange={(event) => handleDraftChange(event.target.value)} onBlur={stopTyping} disabled={showTemplateComposer} placeholder={showTemplateComposer ? "La ventana libre está cerrada; selecciona una plantilla." : "Escribe una respuesta…"} rows={2} className="min-h-11 w-full resize-none rounded-[9px] border border-[#dfe5eb] bg-white px-3 py-2.5 text-sm text-[#172238] outline-none placeholder:text-[#9aa5b2] focus:border-[#3f5f7b] disabled:cursor-not-allowed disabled:bg-[#fafbfc] disabled:text-[#9aa5b2]" />
          </div>
          <button type="button" onClick={() => void requestSuggestion()} disabled={suggesting || showTemplateComposer} aria-label="Sugerir respuesta con IA" className="flex size-11 shrink-0 items-center justify-center rounded-[9px] border border-[#dfe5eb] text-[#3f5f7b] transition hover:border-[#3f5f7b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50">{suggesting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}</button>
          <motion.button type="button" onClick={() => void sendMessage()} disabled={sending || deliveryUnconfirmed || showTemplateComposer || !draftText.trim()} whileTap={reduceMotion ? undefined : { scale: 0.94 }} aria-label="Enviar respuesta" className="flex size-11 shrink-0 items-center justify-center rounded-[9px] bg-[#3f5f7b] text-white transition hover:bg-[#2e4b65] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b] disabled:opacity-40">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</motion.button>
        </div>
        {showTemplateComposer && <div className="mt-3"><TemplateComposer conversationId={conversationId} channelKey={current.channelKey} onSent={handleTemplateSent} /></div>}
        {typingCount > 0 && <p className="mt-2 text-[11px] text-[#3f5f7b]" role="status" aria-live="polite">Alguien está escribiendo…</p>}
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#98a3af]"><Check className="size-3" /> El mensaje solo sale cuando presionas enviar.</p>
      </footer>
    </section>
  );
}

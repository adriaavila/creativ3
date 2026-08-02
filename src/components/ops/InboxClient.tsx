"use client";

import { useCallback, useMemo, useState } from "react";
import { Bot, CheckCircle2, Search } from "lucide-react";
import type { WaConversation } from "@/lib/whatsapp-inbox-db";
import { formatWhatsAppPhone } from "@/lib/phone";
import ConversationThread from "@/components/ops/ConversationThread";
import { eventConversation, useOpsRealtime, type OpsRealtimeEvent } from "@/hooks/useOpsRealtime";

type InboxFilter = "all" | "official" | "waiting" | "open";

type InboxClientProps = {
  initialConversations: WaConversation[];
};

function initials(name: string | null, fallback = "WA") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : fallback;
}

function formatListTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

function waitingForReply(conversation: WaConversation) {
  return Boolean(conversation.lastInboundAt && conversation.lastMessageAt === conversation.lastInboundAt);
}

function conversationTitle(conversation: WaConversation) {
  return conversation.contactName || formatWhatsAppPhone(conversation.contactPhone || conversation.contactWaId) || "Contacto de WhatsApp";
}

function statusLabel(status: WaConversation["status"]) {
  return status === "open" ? "Abierta" : status === "snoozed" ? "En pausa" : "Cerrada";
}

function outcomeLabel(outcome: WaConversation["outcome"]) {
  return outcome === "cita" ? "Cita" : outcome === "cotizacion" ? "Cotización" : outcome === "descarte" ? "Descarte" : "Sin resultado";
}

function DetailRail({ conversation, onConversationChange }: { conversation: WaConversation; onConversationChange: (conversation: WaConversation) => void }) {
  const [savingMode, setSavingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const official = conversation.channelKind === "cloud_api";
  const phone = formatWhatsAppPhone(conversation.contactPhone || conversation.contactWaId);

  async function toggleAssignedMode() {
    setSavingMode(true);
    setModeError(null);
    const assignedMode = conversation.assignedMode === "ai" ? "human" : "ai";
    try {
      const response = await fetch(`/api/ops/inbox/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedMode }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el modo.");
      const refreshed = await fetch(`/api/ops/inbox/${conversation.id}`, { cache: "no-store" });
      if (!refreshed.ok) throw new Error("No se pudo cargar el modo actualizado.");
      const data = (await refreshed.json()) as { conversation: WaConversation };
      onConversationChange(data.conversation);
    } catch (error) {
      setModeError(error instanceof Error ? error.message : "No se pudo actualizar el modo.");
    } finally {
      setSavingMode(false);
    }
  }

  return (
    <aside className="hidden min-h-0 w-[292px] shrink-0 flex-col border-l border-[#e5e7eb] bg-white xl:flex" aria-label="Detalles de la conversación">
      <div className="flex h-[57px] items-center justify-between border-b border-[#e5e7eb] px-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#506176]">Detalles</h2>
        <span className="text-[#a2acb8]" aria-hidden="true">›</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#73718d] text-sm font-semibold text-white">
            {initials(conversation.contactName)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-[#172238]">{conversationTitle(conversation)}</h3>
            <p className="mt-0.5 truncate text-[11px] text-[#7e8a98]">{phone || conversation.contactWaId}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[11px] border border-[#e5e7eb] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-[#506176]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[#172238]">IA en esta conversación</p>
                <p className="mt-0.5 text-[10px] text-[#8a96a5]">{conversation.assignedMode === "ai" ? "Respondiendo" : "Revisión humana"}</p>
              </div>
            </div>
            <button type="button" onClick={() => void toggleAssignedMode()} disabled={savingMode} className={`relative inline-flex h-5 w-9 rounded-full p-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50 ${conversation.assignedMode === "ai" ? "bg-[#3f5f7b]" : "bg-[#dce2e8]"}`} aria-pressed={conversation.assignedMode === "ai"} aria-label={`IA ${conversation.assignedMode === "ai" ? "activa" : "inactiva"}`}>
              <span className={`size-4 rounded-full bg-white shadow-sm transition-transform ${conversation.assignedMode === "ai" ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
          {modeError && <p className="mt-2 text-[10px] text-[#a33b3b]" role="alert">{modeError}</p>}
        </div>

        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a0ad]">Canal</dt>
            <dd className="mt-2 flex items-center gap-2 text-[12px] text-[#506176]">
              <span className={`size-2 rounded-full ${official ? "bg-[#a8d63d]" : "bg-[#aeb8c2]"}`} aria-hidden="true" />
              {official ? "WhatsApp oficial" : "WAHA · no oficial"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a0ad]">Estado</dt>
            <dd className="mt-2 text-[12px] text-[#506176]">{statusLabel(conversation.status)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a0ad]">Resultado</dt>
            <dd className="mt-2 text-[12px] text-[#506176]">{outcomeLabel(conversation.outcome)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a0ad]">Lead vinculado</dt>
            <dd className="mt-2 truncate text-[12px] text-[#506176]">{conversation.leadId || "Sin vincular"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

export default function InboxClient({ initialConversations }: InboxClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<number | null>(initialConversations[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/inbox", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { conversations: WaConversation[] };
      setConversations(data.conversations);
    } catch {
      // HTTP remains the recovery path when realtime is unavailable.
    }
  }, []);

  const handleRealtimeEvent = useCallback((event: OpsRealtimeEvent) => {
    if (event.type !== "conversation.updated" && event.type !== "message.created" && event.type !== "message.updated") return;
    const next = eventConversation(event);
    if (!next) {
      void refreshConversations();
      return;
    }
    setConversations((items) => {
      const merged = items.some((item) => item.id === next.id)
        ? items.map((item) => (item.id === next.id ? next : item))
        : [next, ...items];
      return merged.sort((left, right) => String(right.lastMessageAt).localeCompare(String(left.lastMessageAt)));
    });
  }, [refreshConversations]);

  useOpsRealtime({ onEvent: handleRealtimeEvent, onReconnect: refreshConversations });

  const counts = useMemo(() => ({
    all: conversations.length,
    official: conversations.filter((conversation) => conversation.channelKind === "cloud_api").length,
    waiting: conversations.filter(waitingForReply).length,
    open: conversations.filter((conversation) => conversation.status === "open").length,
  }), [conversations]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesQuery = !normalized || [conversation.contactName, conversation.contactPhone, conversation.contactWaId, conversation.channelKind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      const matchesFilter = filter === "all"
        || (filter === "official" && conversation.channelKind === "cloud_api")
        || (filter === "waiting" && waitingForReply(conversation))
        || (filter === "open" && conversation.status === "open");
      return matchesQuery && matchesFilter;
    });
  }, [conversations, filter, query]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  function updateConversation(next: WaConversation) {
    setConversations((items) => items.map((item) => (item.id === next.id ? next : item)));
  }

  return (
    <main className="min-h-[calc(100dvh-68px)] bg-[#f7f8fa] pb-[calc(68px+env(safe-area-inset-bottom))] text-[#172238] md:pb-0">
      <div className="h-[calc(100dvh-68px)] min-h-[620px] overflow-hidden border-y border-[#e5e7eb] bg-white">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_292px]">
          <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-[#e5e7eb] bg-white`} aria-label="Lista de conversaciones">
            <header className="border-b border-[#e5e7eb] px-4 pb-4 pt-5">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Bandeja</h1>
                <span className="text-xs text-[#8a96a5]">{counts.all}</span>
              </div>
              <label className="mt-4 flex min-h-10 items-center gap-2 rounded-[10px] border border-[#e1e6ec] bg-[#fafbfc] px-3 text-sm">
                <Search className="size-4 text-[#8a96a5]" aria-hidden="true" />
                <span className="sr-only">Buscar conversación</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar conversación…"
                  className="w-full bg-transparent text-sm text-[#172238] outline-none placeholder:text-[#9aa5b2]"
                />
              </label>
            </header>

            <nav className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] px-4 py-3" aria-label="Filtros de conversaciones">
              {([
                ["all", "Todas"],
                ["official", "Oficiales"],
                ["waiting", "Esperan respuesta"],
                ["open", "Abiertas"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={filter === id}
                  className={`min-h-8 shrink-0 rounded-full px-3 text-[11px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3f5f7b] ${filter === id ? "bg-[#3f5f7b] text-white" : "border border-[#e1e6ec] bg-white text-[#536275] hover:border-[#b9c5d2]"}`}
                >
                  {label} <span className={filter === id ? "text-white/70" : "text-[#9aa5b2]"}>{counts[id]}</span>
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto" role="list" aria-label="Conversaciones de WhatsApp">
              {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm leading-6 text-[#7c8998]">No hay conversaciones que coincidan con la búsqueda.</p>}
              {filtered.map((conversation) => {
                const active = conversation.id === selectedId;
                const waiting = waitingForReply(conversation);
                const official = conversation.channelKind === "cloud_api";
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    role="listitem"
                    onClick={() => setSelectedId(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-[82px] w-full items-center gap-3 border-b border-[#edf0f3] px-4 py-3 text-left transition focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#3f5f7b] ${active ? "border-l-[3px] border-l-[#3f5f7b] bg-[#f1f5f9] pl-[13px]" : "hover:bg-[#fafbfd]"}`}
                  >
                    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[#73718d] text-[13px] font-semibold text-white">
                      {initials(conversation.contactName)}
                      <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${official ? "bg-[#a8d63d]" : "bg-[#aeb8c2]"}`} aria-label={official ? "Canal oficial" : "Canal alternativo"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <strong className="truncate text-[13px] font-semibold text-[#172238]">{conversationTitle(conversation)}</strong>
                        <span className="shrink-0 text-[10px] text-[#8a96a5]">{formatListTime(conversation.lastMessageAt)}</span>
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-[#758396]">{phoneLabel(conversation)}</span>
                      <span className="mt-2 flex items-center gap-2 text-[10px]">
                        <span className={official ? "text-[#47704d]" : "text-[#7c8793]"}>{official ? "WhatsApp oficial" : "WAHA · no oficial"}</span>
                        {waiting && <span className="rounded-full bg-[#fff5df] px-2 py-0.5 text-[#8d6a26]">Nuevo</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 bg-[#f7f8fa]`} aria-label="Conversación seleccionada">
            {selected ? (
              <ConversationThread
                key={selected.id}
                conversation={selected}
                onBack={() => setSelectedId(null)}
                onConversationChange={updateConversation}
              />
            ) : (
              <div className="flex min-h-full flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#edf2f6] text-[#3f5f7b]"><CheckCircle2 className="size-5" /></div>
                  <h2 className="mt-4 text-sm font-semibold text-[#172238]">Selecciona una conversación</h2>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-[#7c8998]">Las conversaciones oficiales de WhatsApp aparecerán aquí.</p>
                </div>
              </div>
            )}
          </section>

          {selected && <DetailRail conversation={selected} onConversationChange={updateConversation} />}
        </div>
      </div>
    </main>
  );
}

function phoneLabel(conversation: WaConversation) {
  return formatWhatsAppPhone(conversation.contactPhone || conversation.contactWaId) || conversation.contactWaId;
}

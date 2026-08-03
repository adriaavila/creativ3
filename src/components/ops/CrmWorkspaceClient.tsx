"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  Network,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import type { GrowthLead } from "@/lib/growth-types";
import type { WaConversation } from "@/lib/whatsapp-inbox-db";
import { normalizeWhatsAppId } from "@/lib/phone";
import type { CrmChannel } from "@/lib/crm-types";
import {
  crmChannelStatusLabel,
  crmNameStatusLabel,
  crmQualityLabel,
  isCrmChannelActive,
} from "@/lib/crm-channels";
import ConversationThread from "@/components/ops/ConversationThread";
import OnboardingLinkGenerator from "@/components/ops/OnboardingLinkGenerator";
import { TapButton } from "@/components/ops/apple";
import { eventConversation, useOpsRealtime, type OpsRealtimeEvent } from "@/hooks/useOpsRealtime";

const STATUS_LABELS: Record<GrowthLead["status"], string> = {
  new: "Nuevo",
  researched: "Investigado",
  drafted: "Borrador",
  approved: "Aprobado",
  contacted: "Contactado",
  replied: "Respondió",
  meeting_booked: "Cita",
  won: "Ganado",
  lost: "Perdido",
};

const STAGES = [
  { id: "new", label: "Nuevo", statuses: ["new", "researched", "drafted"] as GrowthLead["status"][] },
  { id: "conversation", label: "En conversación", statuses: ["approved", "contacted"] as GrowthLead["status"][] },
  { id: "interested", label: "Interesado", statuses: ["replied", "meeting_booked"] as GrowthLead["status"][] },
  { id: "won", label: "Cliente", statuses: ["won"] as GrowthLead["status"][] },
  { id: "lost", label: "Perdido", statuses: ["lost"] as GrowthLead["status"][] },
] as const;

type CrmWorkspaceClientProps = {
  initialLeads: GrowthLead[];
  initialConversations: WaConversation[];
  channels: CrmChannel[];
  initialView?: "workspace" | "connections";
  initialLeadId?: string | null;
  cloudApiOnboardingAvailable: boolean;
};

type ApprovedTemplate = {
  name: string;
  language: string;
  bodyText: string;
  variableCount: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "Sin actividad";
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

function formatCurrency(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function initials(name: string | null, fallback = "WA") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() : fallback;
}

function statusLabel(status: GrowthLead["status"]) {
  return STATUS_LABELS[status] ?? status;
}

function defaultChannel(channels: CrmChannel[]) {
  return channels.find((channel) => channel.official && isCrmChannelActive(channel))?.id
    ?? channels.find(isCrmChannelActive)?.id
    ?? "";
}

function conversationForLead(lead: GrowthLead | null, conversations: WaConversation[]) {
  if (!lead) return null;
  const phone = normalizeWhatsAppId(lead.businessPhone ?? "");
  return conversations
    .filter((conversation) => conversation.leadId === lead.id || (phone && normalizeWhatsAppId(conversation.contactPhone ?? conversation.contactWaId) === phone))
    .sort((left, right) => String(right.lastMessageAt).localeCompare(String(left.lastMessageAt)))[0] ?? null;
}

export default function CrmWorkspaceClient({
  initialLeads,
  initialConversations,
  channels: initialChannels,
  initialView = "workspace",
  initialLeadId = null,
  cloudApiOnboardingAvailable,
}: CrmWorkspaceClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [conversations, setConversations] = useState(initialConversations);
  const [channels, setChannels] = useState(initialChannels);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId);
  const [query, setQuery] = useState("");
  const [view, setView] = useState(initialView);

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

  const realtime = useOpsRealtime({ onEvent: handleRealtimeEvent, onReconnect: refreshConversations });
  const selectedLead = useMemo(() => leads.find((lead) => lead.id === selectedLeadId) ?? null, [leads, selectedLeadId]);
  const selectedConversation = useMemo(() => conversationForLead(selectedLead, conversations), [conversations, selectedLead]);
  const officialChannel = channels.find((channel) => channel.official && isCrmChannelActive(channel))
    ?? channels.find((channel) => channel.official)
    ?? null;
  const realtimeLabel = realtime.status === "connected" ? "Realtime conectado" : realtime.status === "reconnecting" ? "Reconectando" : realtime.status === "connecting" ? "Conectando" : "Realtime offline";
  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter((lead) => [lead.businessName, lead.businessPhone, lead.vertical, lead.location, lead.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [leads, query]);

  function updateConversation(next: WaConversation) {
    setConversations((items) => items.some((item) => item.id === next.id)
      ? items.map((item) => (item.id === next.id ? next : item))
      : [next, ...items]);
  }

  function updateLead(next: GrowthLead) {
    setLeads((items) => items.map((item) => (item.id === next.id ? next : item)));
  }

  return (
    <main className="min-h-dvh bg-[#f7f8fa] pb-8 text-[#142b4b] lg:pb-5">
      <div className="mx-auto max-w-[1660px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Pipeline</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Oportunidades</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68778a]">Organiza leads reales y conversaciones de WhatsApp en cada etapa.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex min-h-10 items-center gap-2 px-2 text-[11px] text-[#7a8797]" role="status" aria-live="polite"><span className={`size-2 rounded-full ${realtime.status === "connected" ? "bg-[#c5f04a]" : "bg-[#aeb8c2]"}`} aria-hidden="true" />{realtimeLabel}</span>
            <Link href="/ops/contacts" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dce3ea] bg-white px-3 text-xs font-medium text-[#526174] transition hover:border-[#b9c5d2] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b]">
              <Users className="size-4" aria-hidden="true" /> Contactos
            </Link>
            <Link href="/embedded-whatsapp" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#c5f04a] px-3 text-xs font-semibold text-[#142b4b] transition hover:bg-[#b7e63b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]">
              <CheckCircle2 className="size-4" aria-hidden="true" /> {officialChannel && isCrmChannelActive(officialChannel) ? "Gestionar WhatsApp oficial" : "Conectar WhatsApp oficial"}
            </Link>
            <button type="button" onClick={() => setView(view === "connections" ? "workspace" : "connections")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dce3ea] bg-white px-3 text-xs font-medium text-[#526174] transition hover:border-[#b9c5d2] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b]">
              <Network className="size-4" aria-hidden="true" /> {view === "connections" ? "Volver al pipeline" : "Conexiones"}
            </button>
          </div>
        </header>

        {view === "connections" ? (
          <section className="mt-7" aria-labelledby="connections-heading">
            <ConnectionsPanel initialChannels={channels} onChannelsChange={setChannels} />
            <div className="mt-5 rounded-xl bg-[#08090a] p-4 text-white sm:p-6">
              <OnboardingLinkGenerator cloudApiAvailable={cloudApiOnboardingAvailable} />
            </div>
          </section>
        ) : (
          <>
            <section className="mt-7 grid overflow-hidden rounded-xl border border-[#e2e7ed] bg-white sm:grid-cols-3" aria-label="Resumen del pipeline">
              <Metric label="Leads" value={leads.length} detail="en el pipeline" icon={Users} />
              <Metric label="Conversaciones" value={conversations.length} detail={`${conversations.filter((item) => item.status === "open").length} abiertas`} icon={MessageCircle} />
              <Metric label="WhatsApp" value={conversations.filter((item) => item.channelKind === "cloud_api").length} detail="con canal oficial" icon={CheckCircle2} />
            </section>

            <section className="mt-7" aria-labelledby="pipeline-heading">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="pipeline-heading" className="text-lg font-semibold tracking-[-0.02em]">Pipeline comercial</h2>
                  <p className="mt-1 text-xs text-[#7a8797]">Las etapas se calculan desde el estado persistido de cada lead.</p>
                </div>
                <label className="flex min-h-10 w-full max-w-[280px] items-center gap-2 rounded-lg border border-[#dce3ea] bg-white px-3 text-sm shadow-[0_1px_2px_rgba(20,43,75,0.03)]">
                  <Search className="size-4 text-[#8a96a5]" aria-hidden="true" />
                  <span className="sr-only">Buscar lead</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead…" className="w-full bg-transparent text-[#142b4b] outline-none placeholder:text-[#9aa5b2]" />
                </label>
              </div>

              <div className="-mx-1 overflow-x-auto px-1 pb-2">
                <div className="grid min-w-[1480px] grid-cols-5 gap-3">
                  {STAGES.map((stage) => (
                    <StageColumn
                      key={stage.id}
                      label={stage.label}
                      statuses={stage.statuses}
                      leads={filteredLeads.filter((lead) => stage.statuses.includes(lead.status))}
                      conversations={conversations}
                      selectedId={selectedLeadId}
                      onSelect={setSelectedLeadId}
                    />
                  ))}
                </div>
              </div>
            </section>

            {selectedLead && (
              <section className="mt-5 overflow-hidden rounded-xl border border-[#dce3ea] bg-white shadow-[0_8px_24px_rgba(20,43,75,0.06)]" aria-label={`Detalle de ${selectedLead.businessName}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ebf0] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#e9eef3] text-xs font-semibold text-[#526d87]">{initials(selectedLead.businessName)}</span>
                    <div><h2 className="text-sm font-semibold text-[#172238]">{selectedLead.businessName}</h2><p className="mt-0.5 text-[11px] text-[#7a8797]">{statusLabel(selectedLead.status)} · {selectedConversation ? "Conversación vinculada" : "Sin conversación vinculada"}</p></div>
                  </div>
                  <button type="button" onClick={() => setSelectedLeadId(null)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#dce3ea] px-3 text-xs font-medium text-[#526174] hover:border-[#b9c5d2] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b]"><ChevronDown className="size-4" /> Cerrar detalle</button>
                </div>
                <div className="min-h-[420px]">
                  {selectedConversation ? (
                    <ConversationThread key={selectedConversation.id} conversation={selectedConversation} leadId={selectedLead.id} onConversationChange={updateConversation} />
                  ) : (
                    <LeadOutreachForm key={selectedLead.id} lead={selectedLead} channels={channels} onLeadUpdate={updateLead} onRefreshConversations={refreshConversations} />
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Users }) {
  return (
    <div className="border-b border-[#e7ebf0] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0">
      <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a8797]">{label}</span><Icon className="size-4 text-[#526d87]" aria-hidden="true" /></div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-[#172238]">{value}</div>
      <p className="mt-1 text-xs text-[#7a8797]">{detail}</p>
    </div>
  );
}

function StageColumn({ label, statuses, leads, conversations, selectedId, onSelect }: { label: string; statuses: GrowthLead["status"][]; leads: GrowthLead[]; conversations: WaConversation[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section className="flex min-h-[540px] flex-col rounded-xl border border-[#e1e6ec] bg-white" aria-labelledby={`stage-${label}`}>
      <header className="flex items-center justify-between border-b border-[#e7ebf0] px-3.5 py-3">
        <h3 id={`stage-${label}`} className="text-sm font-semibold text-[#172238]">{label}</h3>
        <span className="rounded-full bg-[#f1f4f7] px-2 py-0.5 text-[11px] font-medium text-[#7a8797]">{leads.length}</span>
      </header>
      <div className="flex-1 space-y-2.5 p-2.5">
        {leads.length === 0 && <p className="rounded-lg border border-dashed border-[#dfe5eb] px-3 py-8 text-center text-xs leading-5 text-[#8a96a5]">No hay leads en esta etapa.</p>}
        {leads.map((lead) => <LeadCard key={lead.id} lead={lead} conversation={conversationForLead(lead, conversations)} active={lead.id === selectedId} onSelect={() => onSelect(lead.id)} />)}
      </div>
      <p className="border-t border-[#edf0f3] px-3 py-2.5 text-[10px] text-[#8a96a5]">{statuses.length} estados · datos persistidos</p>
    </section>
  );
}

function LeadCard({ lead, conversation, active, onSelect }: { lead: GrowthLead; conversation: WaConversation | null; active: boolean; onSelect: () => void }) {
  const value = formatCurrency(lead.potentialValue);
  return (
    <button type="button" onClick={onSelect} aria-pressed={active} className={`w-full rounded-lg border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3f5f7b] ${active ? "border-[#3f5f7b] bg-[#f1f5f9] shadow-[0_4px_12px_rgba(63,95,123,0.12)]" : "border-[#e5e9ee] bg-white hover:border-[#b9c5d2] hover:shadow-[0_4px_12px_rgba(20,43,75,0.06)]"}`}>
      <span className="flex items-start gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9eef3] text-[11px] font-semibold text-[#526d87]">{initials(lead.businessName)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[13px] font-semibold text-[#172238]">{lead.businessName}</strong><span className="mt-0.5 block truncate text-[11px] text-[#7a8797]">{lead.vertical || "Sin categoría"}</span></span></span>
      <span className="mt-3 flex items-center justify-between gap-2 text-[10px]"><span className="rounded-full bg-[#f1f4f7] px-2 py-0.5 text-[#526174]">{statusLabel(lead.status)}</span><span className="font-medium text-[#7a8797]">Score {lead.leadScore}</span></span>
      <span className="mt-3 flex items-center justify-between gap-2 border-t border-[#edf0f3] pt-2.5 text-[10px] text-[#8a96a5]"><span>{conversation ? (conversation.channelKind === "cloud_api" ? "WhatsApp oficial" : "WAHA") : "Sin conversación"}</span><span>{formatDate(lead.lastContactedAt || lead.createdAt)}</span></span>
      {value && <span className="mt-1 block text-right text-[11px] font-medium text-[#526174]">{value} potencial</span>}
    </button>
  );
}

function LeadOutreachForm({ lead, channels, onLeadUpdate, onRefreshConversations }: { lead: GrowthLead; channels: CrmChannel[]; onLeadUpdate: (lead: GrowthLead) => void; onRefreshConversations: () => Promise<void> }) {
  const [phone, setPhone] = useState(lead.businessPhone ?? "");
  const [sourceUrl, setSourceUrl] = useState(lead.contactSourceUrl ?? "");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deliveryUnconfirmed, setDeliveryUnconfirmed] = useState(false);
  const actionIdRef = useRef<string | null>(null);
  const [channelId, setChannelId] = useState(defaultChannel(channels));
  const [templates, setTemplates] = useState<ApprovedTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("");
  const [templatesLoadedFor, setTemplatesLoadedFor] = useState<string | null>(null);
  const channel = channels.find((item) => item.id === channelId);

  function resetAction() {
    actionIdRef.current = null;
    setDeliveryUnconfirmed(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (!channel?.official) return;
    const workspaceParam = channel.workspace ? `&workspace=${encodeURIComponent(channel.workspace)}` : "";
    void fetch(`/api/ops/whatsapp/templates?connectionId=${encodeURIComponent(channel.id)}${workspaceParam}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { templates: [] }))
      .then((data: { templates?: ApprovedTemplate[] }) => {
        if (cancelled) return;
        const next = data.templates ?? [];
        setTemplates(next);
        setTemplateName(next[0]?.name ?? "");
        setTemplateLanguage(next[0]?.language ?? "");
        setTemplatesLoadedFor(channel.id);
      })
      .catch(() => {
        if (!cancelled) {
          setTemplates([]);
          setTemplateName("");
          setTemplateLanguage("");
          setTemplatesLoadedFor(channel.id);
        }
      });
    return () => { cancelled = true; };
  }, [channel]);

  async function send() {
    if (!channel || !confirmed || (channel.official && (templatesLoadedFor !== channel.id || !templateName || !templateLanguage))) return;
    setSending(true);
    setNotice(null);
    const actionId = actionIdRef.current ?? crypto.randomUUID();
    actionIdRef.current = actionId;
    let responseReceived = false;
    try {
      const response = await fetch("/api/ops/growth/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId, leadId: lead.id, connectionId: channel.id, channel: channel.channel, ...(channel.workspace ? { workspace: channel.workspace } : {}), phone, message, ...(channel.official ? { templateName, templateLanguage } : {}), contactSourceUrl: sourceUrl || null, confirmed: true }) });
      responseReceived = true;
      const data = (await response.json().catch(() => ({}))) as { error?: string; status?: string };
      if (response.status === 202 || data.status === "pending" || data.status === "unknown") {
        setDeliveryUnconfirmed(true);
        setNotice(data.error ?? "Entrega no confirmada; no reintentes este mensaje.");
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "No se pudo enviar el mensaje.");
      resetAction();
      onLeadUpdate({ ...lead, status: "contacted", businessPhone: phone, contactSourceUrl: sourceUrl || null, lastContactedAt: new Date().toISOString() });
      await onRefreshConversations();
      setMessage("");
      setConfirmed(false);
      setNotice("Mensaje enviado y registrado en el CRM.");
    } catch (error) {
      if (!responseReceived) setDeliveryUnconfirmed(true);
      setNotice(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col bg-white p-5 sm:p-7">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#172238]"><Sparkles className="size-4 text-[#526d87]" aria-hidden="true" /> Primer contacto</div>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#68778a]">Prepara el mensaje para {lead.businessName}. No se enviará hasta que confirmes el número y el texto.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-[#526174]">WhatsApp público<input value={phone} onChange={(event) => { resetAction(); setPhone(event.target.value); }} placeholder="+58412…" className="mt-2 min-h-11 w-full rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm text-[#172238] outline-none focus:border-[#3f5f7b]" /></label>
        <label className="text-xs text-[#526174]">Fuente del contacto<input value={sourceUrl} onChange={(event) => { resetAction(); setSourceUrl(event.target.value); }} placeholder="https://…" className="mt-2 min-h-11 w-full rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm text-[#172238] outline-none focus:border-[#3f5f7b]" /></label>
      </div>
      <label className="mt-4 text-xs text-[#526174]">Canal de envío<select value={channelId} onChange={(event) => { resetAction(); setChannelId(event.target.value); }} className="mt-2 min-h-11 w-full rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm text-[#172238] outline-none focus:border-[#3f5f7b]" disabled={!channels.length}><option value="">Conecta un canal activo</option>{channels.map((item) => <option key={item.id} value={item.id} disabled={!isCrmChannelActive(item)}>{item.label} · {item.detail} · {crmChannelStatusLabel(item)}{!isCrmChannelActive(item) ? " · no disponible" : ""}</option>)}</select></label>
      {channel?.official && <label className="mt-4 text-xs text-[#526174]">Plantilla aprobada por Meta<select value={`${templateName}|${templateLanguage}`} onChange={(event) => { resetAction(); const [name, language] = event.target.value.split("|"); setTemplateName(name ?? ""); setTemplateLanguage(language ?? ""); }} disabled={templatesLoadedFor !== channel.id || !templates.length} className="mt-2 min-h-11 w-full rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm text-[#172238] outline-none focus:border-[#3f5f7b] disabled:opacity-50"><option value="">{templatesLoadedFor !== channel.id ? "Cargando catálogo…" : templates.length ? "Selecciona una plantilla" : "No hay plantillas aprobadas"}</option>{templates.map((template) => <option key={`${template.name}|${template.language}`} value={`${template.name}|${template.language}`}>{template.name} · {template.language}</option>)}</select></label>}
      <label className="mt-4 text-xs text-[#526174]">Mensaje revisado<textarea value={message} onChange={(event) => { resetAction(); setMessage(event.target.value); }} rows={5} placeholder="Escribe una observación concreta sobre su negocio…" className="mt-2 w-full resize-y rounded-lg border border-[#dce3ea] bg-[#fafbfc] p-3 text-sm leading-6 text-[#172238] outline-none focus:border-[#3f5f7b]" /></label>
      <p className="mt-2 text-[11px] leading-5 text-[#7a8797]">Meta valida el nombre e idioma contra el catálogo aprobado. WAHA envía texto libre y es un canal no oficial.</p>
      <label className="mt-4 flex items-start gap-3 rounded-lg border border-[#e3e8ed] bg-[#fafbfc] p-3 text-xs leading-5 text-[#68778a]"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-[#3f5f7b]" /> Confirmo que revisé el mensaje y que el número pertenece públicamente a este negocio.</label>
      {notice && <p className="mt-4 rounded-lg border border-[#dce3ea] bg-[#f1f5f9] px-3 py-2.5 text-sm text-[#526174]" role="status">{notice}</p>}
      <div className="mt-auto pt-6"><TapButton type="button" onClick={() => void send()} disabled={sending || deliveryUnconfirmed || !channel || !confirmed || !phone || message.trim().length < 10 || (channel.official && (templatesLoadedFor !== channel.id || !templateName || !templateLanguage))} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c5f04a] px-4 text-sm font-semibold text-[#142b4b] transition hover:bg-[#b7e63b] disabled:opacity-40">{sending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Enviar mensaje</TapButton></div>
    </div>
  );
}

function ConnectionsPanel({ initialChannels, onChannelsChange }: { initialChannels: CrmChannel[]; onChannelsChange: (channels: CrmChannel[]) => void }) {
  const [channels, setChannels] = useState(initialChannels);
  const [session, setSession] = useState("allok-main");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<{ mimetype: string; data: string } | null>(null);
  const [pairingSession, setPairingSession] = useState<string | null>(null);

  useEffect(() => {
    if (!pairingSession) return;
    let cancelled = false;
    const poll = async () => {
      const response = await fetch(`/api/ops/waha/sessions/${encodeURIComponent(pairingSession)}`, { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const data = await response.json() as { connection?: { status: string; phoneDisplay?: string | null }; qr?: { mimetype: string; data: string } | null };
      if (data.qr) setQr(data.qr);
      if (data.connection) {
        const connection: CrmChannel = { id: pairingSession, channel: "waha", official: false, label: data.connection.phoneDisplay ?? pairingSession, phone: data.connection.phoneDisplay ?? null, status: data.connection.status, detail: "WAHA · no oficial" };
        setChannels((current) => {
          const merged = [...current.filter((channel) => channel.id !== pairingSession), connection];
          onChannelsChange(merged);
          return merged;
        });
        if (data.connection.status === "connected") setPairingSession(null);
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [onChannelsChange, pairingSession]);

  async function createWahaSession() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/waha/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: session, client: "allok" }) });
      const data = await response.json() as { error?: string; session?: string; qr?: { mimetype: string; data: string } | null };
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar WAHA.");
      setPairingSession(data.session ?? session);
      setQr(data.qr ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar WAHA.");
    } finally {
      setCreating(false);
    }
  }

  const orderedChannels = [...channels].sort((left, right) => Number(right.official) - Number(left.official));

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e7ed] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7ebf0] p-5 sm:p-7">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Conexiones</p><h2 id="connections-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#172238]">WhatsApp oficial primero</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68778a]">Conecta el número del negocio mediante Meta. WAHA permanece disponible únicamente como canal secundario.</p></div>
        <Link href="/embedded-whatsapp" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#c5f04a] px-4 text-xs font-semibold text-[#142b4b] transition hover:bg-[#b7e63b]"><CheckCircle2 className="size-4" aria-hidden="true" /> Conectar oficial</Link>
      </div>
      <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
        <div>
          {orderedChannels.length === 0 && <div className="rounded-lg border border-dashed border-[#dfe5eb] p-6 text-sm text-[#7a8797]">Todavía no hay un canal conectado.</div>}
          {orderedChannels.map((channel) => <div key={channel.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf0f3] py-4 first:pt-0"><div className="flex min-w-0 items-start gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${isCrmChannelActive(channel) ? "bg-[#c5f04a]" : "bg-[#aeb8c2]"}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#172238]">{channel.label}</p><p className="mt-1 text-xs text-[#7a8797]">{channel.detail} · {crmChannelStatusLabel(channel)}</p>{channel.official && <p className="mt-2 text-[11px] text-[#68778a]">Nombre: {crmNameStatusLabel(channel.nameStatus ?? null)} · Calidad: {crmQualityLabel(channel.qualityRating ?? null)}</p>}<p className="mt-1 text-[11px] text-[#8a96a5]">Última sincronización: {channel.lastSyncedAt ? formatDate(channel.lastSyncedAt) : "No disponible"}</p></div></div><span className="font-mono text-[10px] text-[#526174]">{channel.phone || "sin número"}</span></div>)}
          {error && <p className="mt-4 rounded-lg border border-[#f2caca] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#9f4141]" role="alert">{error}</p>}
        </div>
        <div className="rounded-lg border border-[#e5dfc8] bg-[#fffdf5] p-4"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#8b6b28]" aria-hidden="true" /><div><h3 className="text-sm font-semibold text-[#57451e]">WAHA · canal secundario</h3><p className="mt-1 text-xs leading-5 text-[#806b3b]">No oficial. Puede implicar riesgo de bloqueo del número.</p></div></div><label className="mt-5 block text-xs text-[#68778a]">Nombre de sesión<input value={session} onChange={(event) => setSession(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="mt-2 min-h-11 w-full rounded-lg border border-[#ddd6bc] bg-white px-3 text-sm text-[#172238] outline-none focus:border-[#3f5f7b]" /></label><TapButton type="button" onClick={() => void createWahaSession()} disabled={creating || session.length < 2} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#b9c5d2] bg-white text-sm font-medium text-[#526174] transition hover:border-[#3f5f7b] hover:text-[#142b4b] disabled:opacity-50">{creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {pairingSession ? "Reiniciar sesión" : "Crear sesión WAHA"}</TapButton>{pairingSession && <p className="mt-3 text-xs text-[#68778a]">Sesión <span className="font-medium text-[#172238]">{pairingSession}</span> · espera el QR.</p>}{qr && <div className="mt-4 rounded-lg border border-[#e5e9ee] bg-white p-3"><Image src={`data:${qr.mimetype};base64,${qr.data}`} alt="Código QR para conectar WhatsApp a WAHA" width={260} height={260} unoptimized className="mx-auto h-auto w-full max-w-[220px]" /></div>}</div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Loader2,
  Network,
  Plus,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Users,
  Webhook,
} from "lucide-react";
import type { GrowthLead } from "@/lib/growth-types";
import type { CrmChannel } from "@/lib/crm-types";
import {
  crmChannelNextStep,
  crmChannelStatusLabel,
  crmQualityLabel,
  isCrmChannelActive,
} from "@/lib/crm-channels";
import OnboardingLinkGenerator from "@/components/ops/OnboardingLinkGenerator";
import { TapButton } from "@/components/ops/apple";

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
  channels: CrmChannel[];
  initialView?: "workspace" | "connections";
  initialLeadId?: string | null;
  cloudApiOnboardingAvailable: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "Sin actividad";
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

function formatConnectionDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function initials(name: string | null, fallback = "WA") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase() : fallback;
}

function statusLabel(status: GrowthLead["status"]) {
  return STATUS_LABELS[status] ?? status;
}

export default function CrmWorkspaceClient({
  initialLeads,
  channels: initialChannels,
  initialView = "workspace",
  initialLeadId = null,
  cloudApiOnboardingAvailable,
}: CrmWorkspaceClientProps) {
  const leads = initialLeads;
  const [channels, setChannels] = useState(initialChannels);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId);
  const [query, setQuery] = useState("");
  const [view, setView] = useState(initialView);

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === selectedLeadId) ?? null, [leads, selectedLeadId]);
  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter((lead) => [lead.businessName, lead.businessPhone, lead.vertical, lead.location, lead.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [leads, query]);

  return (
    <main className="min-h-dvh bg-[var(--ground-2)] pb-8 text-[var(--ink)] lg:pb-5">
      <div className="mx-auto max-w-[1660px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-60)]">{view === "connections" ? "WhatsApp" : "Pipeline"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{view === "connections" ? "Conexiones de WhatsApp" : "Oportunidades"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-60)]">{view === "connections" ? "Conecta, entrega y supervisa cada número desde un solo lugar." : "Organiza oportunidades, próximos pasos y resultados comerciales."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {view === "workspace" && <Link href="/ops/growth?tab=leads" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--assist)] px-3 text-xs font-semibold text-[var(--on-assist)] transition hover:bg-[var(--assist-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]"><Sparkles className="size-4" aria-hidden="true" /> Gestionar en Growth</Link>}
            <button type="button" onClick={() => setView(view === "connections" ? "workspace" : "connections")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--rule)] bg-white px-3 text-xs font-medium text-[var(--ink-60)] transition hover:border-[var(--rule)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]">
              <Network className="size-4" aria-hidden="true" /> {view === "connections" ? "Volver al pipeline" : "Conexiones"}
            </button>
          </div>
        </header>

        {view === "connections" ? (
          <section className="mt-7" aria-labelledby="connections-heading">
            <ConnectionsPanel initialChannels={channels} onChannelsChange={setChannels} />
            <div className="mt-5">
              <OnboardingLinkGenerator cloudApiAvailable={cloudApiOnboardingAvailable} />
            </div>
          </section>
        ) : (
          <>
            <section className="mt-7 grid overflow-hidden rounded-xl border border-[var(--rule)] bg-white sm:grid-cols-3" aria-label="Resumen del pipeline">
              <Metric label="Oportunidades" value={leads.length} detail="en el pipeline" icon={Users} />
              <Metric label="En seguimiento" value={leads.filter((item) => !["won", "lost"].includes(item.status)).length} detail="con próximo paso" icon={Sparkles} />
              <Metric label="Clientes" value={leads.filter((item) => item.status === "won").length} detail="oportunidades ganadas" icon={CheckCircle2} />
            </section>

            <section className="mt-7" aria-labelledby="pipeline-heading">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="pipeline-heading" className="text-lg font-semibold tracking-[-0.02em]">Pipeline comercial</h2>
                  <p className="mt-1 text-xs text-[var(--ink-60)]">Las etapas se calculan desde el estado persistido de cada lead.</p>
                </div>
                <label className="flex min-h-10 w-full max-w-[280px] items-center gap-2 rounded-lg border border-[var(--rule)] bg-white px-3 text-sm shadow-[var(--shadow-sm)]">
                  <Search className="size-4 text-[var(--ink-40)]" aria-hidden="true" />
                  <span className="sr-only">Buscar lead</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead…" className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-40)]" />
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
                      selectedId={selectedLeadId}
                      onSelect={setSelectedLeadId}
                    />
                  ))}
                </div>
              </div>
            </section>

            {selectedLead && (
              <section className="mt-5 overflow-hidden rounded-xl border border-[var(--rule)] bg-white shadow-[var(--shadow-md)]" aria-label={`Detalle de ${selectedLead.businessName}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[var(--ground-4)] text-xs font-semibold text-[var(--ink-60)]">{initials(selectedLead.businessName)}</span>
                    <div><h2 className="text-sm font-semibold text-[var(--ink)]">{selectedLead.businessName}</h2><p className="mt-0.5 text-[11px] text-[var(--ink-60)]">{statusLabel(selectedLead.status)} · oportunidad comercial</p></div>
                  </div>
                  <button type="button" onClick={() => setSelectedLeadId(null)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--rule)] px-3 text-xs font-medium text-[var(--ink-60)] hover:border-[var(--rule)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]"><ChevronDown className="size-4" /> Cerrar detalle</button>
                </div>
                <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
                  <DataPoint label="Estado" value={statusLabel(selectedLead.status)} />
                  <DataPoint label="Score" value={String(selectedLead.leadScore)} />
                  <DataPoint label="Próxima acción" value={selectedLead.nextAction ?? "Definir en Growth"} />
                  <div className="sm:col-span-3"><Link href="/ops/growth?tab=leads" className="on-ink inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--ink-fill)]">Abrir oportunidad en Growth <ArrowRight className="size-4" /></Link></div>
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
    <div className="border-b border-[var(--hairline)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0">
      <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-60)]">{label}</span><Icon className="size-4 text-[var(--ink-60)]" aria-hidden="true" /></div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-[var(--ink)]">{value}</div>
      <p className="mt-1 text-xs text-[var(--ink-60)]">{detail}</p>
    </div>
  );
}

function StageColumn({ label, statuses, leads, selectedId, onSelect }: { label: string; statuses: GrowthLead["status"][]; leads: GrowthLead[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section className="flex min-h-[540px] flex-col rounded-xl border border-[var(--rule)] bg-white" aria-labelledby={`stage-${label}`}>
      <header className="flex items-center justify-between border-b border-[var(--hairline)] px-3.5 py-3">
        <h3 id={`stage-${label}`} className="text-sm font-semibold text-[var(--ink)]">{label}</h3>
        <span className="rounded-full bg-[var(--ground-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-60)]">{leads.length}</span>
      </header>
      <div className="flex-1 space-y-2.5 p-2.5">
        {leads.length === 0 && <p className="rounded-lg border border-dashed border-[var(--rule)] px-3 py-8 text-center text-xs leading-5 text-[var(--ink-40)]">No hay leads en esta etapa.</p>}
        {leads.map((lead) => <LeadCard key={lead.id} lead={lead} active={lead.id === selectedId} onSelect={() => onSelect(lead.id)} />)}
      </div>
      <p className="border-t border-[var(--hairline)] px-3 py-2.5 text-[10px] text-[var(--ink-40)]">{statuses.length} estados · datos persistidos</p>
    </section>
  );
}

function LeadCard({ lead, active, onSelect }: { lead: GrowthLead; active: boolean; onSelect: () => void }) {
  const value = formatCurrency(lead.potentialValue);
  return (
    <button type="button" onClick={onSelect} aria-pressed={active} className={`w-full rounded-lg border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--rule)] ${active ? "border-[var(--rule)] bg-[var(--ground-3)] shadow-[var(--shadow-md)]" : "border-[var(--hairline)] bg-white hover:border-[var(--rule)] hover:shadow-[var(--shadow-md)]"}`}>
      <span className="flex items-start gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ground-4)] text-[11px] font-semibold text-[var(--ink-60)]">{initials(lead.businessName)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[13px] font-semibold text-[var(--ink)]">{lead.businessName}</strong><span className="mt-0.5 block truncate text-[11px] text-[var(--ink-60)]">{lead.vertical || "Sin categoría"}</span></span></span>
      <span className="mt-3 flex items-center justify-between gap-2 text-[10px]"><span className="rounded-full bg-[var(--ground-3)] px-2 py-0.5 text-[var(--ink-60)]">{statusLabel(lead.status)}</span><span className="font-medium text-[var(--ink-60)]">Score {lead.leadScore}</span></span>
      <span className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--hairline)] pt-2.5 text-[10px] text-[var(--ink-40)]"><span>{lead.nextAction ?? "Sin próximo paso"}</span><span>{formatDate(lead.lastContactedAt || lead.createdAt)}</span></span>
      {value && <span className="mt-1 block text-right text-[11px] font-medium text-[var(--ink-60)]">{value} potencial</span>}
    </button>
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

  function updateChannel(next: CrmChannel) {
    setChannels((current) => {
      const updated = current.map((channel) => channel.id === next.id ? next : channel);
      onChannelsChange(updated);
      return updated;
    });
  }

  const orderedChannels = [...channels].sort((left, right) => Number(right.official) - Number(left.official));
  const officialChannels = orderedChannels.filter((channel) => channel.official);
  const coexistenceChannels = orderedChannels.filter((channel) => channel.connectionMode === "META_COEXISTENCE");
  const otherChannels = orderedChannels.filter((channel) => channel.connectionMode !== "META_COEXISTENCE");
  const operationalCount = officialChannels.filter(isCrmChannelActive).length;
  const crmCount = officialChannels.filter((channel) => channel.crmConnectedAt).length;
  const attentionCount = officialChannels.length - operationalCount;

  return (
    <div className="space-y-5">
      <section className="on-ink relative overflow-hidden rounded-2xl bg-[var(--ink-fill)] text-white shadow-[var(--shadow-pop)]" aria-labelledby="connections-heading">
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)] lg:p-9">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--assist-ink)]"><span className="size-1.5 rounded-full bg-[var(--st-activo)]" /> Control operativo</span>
            <h2 id="connections-heading" className="mt-5 max-w-xl text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-balance sm:text-4xl">Cada número, listo para su próximo paso.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ink-40)]">Conecta en Allok, decide dónde responderá y valida la entrega sin perder de vista credenciales ni estado.</p>
            <Link href="/embedded-whatsapp" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--assist)] px-4 text-sm font-semibold text-[var(--on-assist)] transition duration-200 hover:bg-[var(--assist-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"><Plus className="size-4" aria-hidden="true" /> Conectar otro número</Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-5 shadow-inner shadow-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-medium text-[var(--ink-40)]">Salud del inventario</p><p className="mt-2 text-4xl font-semibold tracking-[-0.05em] tabular-nums">{operationalCount}<span className="ml-1 text-lg font-medium text-white/40">/{officialChannels.length}</span></p></div>
              <span className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${attentionCount ? "bg-[var(--warn-soft)] text-[var(--status-warn)]" : "bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]"}`}><span className={`size-1.5 rounded-full ${attentionCount ? "bg-[var(--warn-mid)]" : "bg-[var(--st-activo)]"}`} />{attentionCount ? `${attentionCount} por revisar` : "Todo operativo"}</span>
            </div>
            <dl className="mt-6 grid grid-cols-3 border-t border-white/10 pt-5">
              <div><dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">Oficiales</dt><dd className="mt-1.5 text-lg font-semibold tabular-nums">{officialChannels.length}</dd></div>
              <div className="border-l border-white/10 pl-4"><dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">En CRM</dt><dd className="mt-1.5 text-lg font-semibold tabular-nums">{crmCount}</dd></div>
              <div className="border-l border-white/10 pl-4"><dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">Allok</dt><dd className="mt-1.5 text-lg font-semibold tabular-nums">{Math.max(officialChannels.length - crmCount, 0)}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-white" aria-label="Proceso de onboarding">
        <div className="border-b border-[var(--hairline)] px-5 py-4 sm:px-7"><h3 className="text-sm font-semibold text-[var(--ink)]">Proceso de onboarding</h3><p className="mt-1 text-xs text-[var(--ink-60)]">El mismo recorrido para cada cliente, sin saltos ni secretos sueltos.</p></div>
        <ol className="grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["01", "Conectar", "Meta autoriza el número"],
            ["02", "Asignar", "Confirma cliente y token"],
            ["03", "Entregar", "Allok o CRM externo"],
            ["04", "Probar", "Valida un mensaje real"],
          ].map(([number, title, detail], index) => <li key={number} className="group relative border-b border-[var(--hairline)] px-5 py-4 last:border-b-0 sm:px-7 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-start gap-3"><span className="font-mono text-[10px] font-semibold text-[var(--assist-ink)]">{number}</span><div><p className="text-sm font-semibold text-[var(--ink)]">{title}</p><p className="mt-1 text-xs text-[var(--ink-60)]">{detail}</p></div></div>{index < 3 && <ArrowRight className="absolute right-3 top-1/2 hidden size-3.5 -translate-y-1/2 text-[var(--ink-40)] xl:block" />}</li>)}
        </ol>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-white p-5 sm:p-7" aria-labelledby="inventory-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-40)]">Inventario oficial</p><h3 id="inventory-heading" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Números y próximos pasos</h3><p className="mt-1.5 text-sm text-[var(--ink-60)]">Primero lo operativo; los IDs y credenciales quedan dentro de cada conexión.</p></div>
          <span className="inline-flex items-center gap-2 rounded-md bg-[var(--ground-3)] px-3 py-2 text-xs font-semibold text-[var(--ink-60)]"><Smartphone className="size-3.5" /> {coexistenceChannels.length} {coexistenceChannels.length === 1 ? "número" : "números"}</span>
        </div>

        {coexistenceChannels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--rule)] bg-[var(--ground-2)] px-5 py-12 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[var(--ground-3)]"><Smartphone className="size-5 text-[var(--ink-60)]" /></span><p className="mt-4 text-sm font-semibold text-[var(--ink)]">Todavía no hay números conectados.</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--ink-60)]">Conecta el primero y aquí verás su progreso, destino y siguiente acción.</p><Link href="/embedded-whatsapp" className="on-ink mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-xs font-semibold text-white"><Plus className="size-4" /> Conectar número</Link></div>
        ) : (
          <div className="space-y-4">{coexistenceChannels.map((channel) => <CoexistenceNumberCard key={channel.id} channel={channel} onChange={updateChannel} />)}</div>
        )}

        {otherChannels.length > 0 && <div className="mt-8 border-t border-[var(--hairline)] pt-6"><div className="mb-3"><h3 className="text-sm font-semibold text-[var(--ink)]">Otros canales</h3><p className="mt-1 text-xs text-[var(--ink-60)]">Cloud API puro y sesiones secundarias.</p></div>{otherChannels.map((channel) => <ChannelConnectionRow key={channel.id} channel={channel} onChange={updateChannel} />)}</div>}
      </section>

      <details className="rounded-xl border border-[var(--warn-line)] bg-[var(--warn-soft)]">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-[var(--status-warn)]"><span className="flex items-center gap-3"><ShieldAlert className="size-4 text-[var(--status-warn)]" aria-hidden="true" /> Canal no oficial · WAHA</span><span className="text-[11px] font-medium text-[var(--status-warn)]">Configuración avanzada</span></summary>
        <div className="border-t border-[var(--warn-line)] p-4"><p className="text-xs leading-5 text-[var(--status-warn)]">Úsalo sólo como canal secundario: puede implicar riesgo de bloqueo del número.</p><label className="mt-4 block text-xs text-[var(--ink-60)]">Nombre de sesión<input value={session} onChange={(event) => setSession(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--warn-line)] bg-white px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--rule)]" /></label><TapButton type="button" onClick={() => void createWahaSession()} disabled={creating || session.length < 2} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--rule)] bg-white text-sm font-medium text-[var(--ink-60)] transition hover:border-[var(--rule)] hover:text-[var(--ink)] disabled:opacity-50">{creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {pairingSession ? "Reiniciar sesión" : "Crear sesión WAHA"}</TapButton>{pairingSession && <p className="mt-3 text-xs text-[var(--ink-60)]">Sesión <span className="font-medium text-[var(--ink)]">{pairingSession}</span> · espera el QR.</p>}{qr && <div className="mt-4 rounded-lg border border-[var(--hairline)] bg-white p-3"><Image src={`data:${qr.mimetype};base64,${qr.data}`} alt="Código QR para conectar WhatsApp a WAHA" width={260} height={260} unoptimized className="mx-auto h-auto w-full max-w-[220px]" /></div>}{error && <p className="mt-4 rounded-lg border border-[var(--risk-line)] bg-[var(--risk-soft)] px-3 py-2.5 text-sm text-[var(--status-risk)]" role="alert">{error}</p>}</div>
      </details>
    </div>
  );
}

function CoexistenceNumberCard({ channel, onChange }: { channel: CrmChannel; onChange: (channel: CrmChannel) => void }) {
  const active = isCrmChannelActive(channel);
  const automationActive = channel.automationEnabled && channel.operatingMode !== "off";
  const automationLabel = channel.operatingMode === "automatic" ? "Automática" : channel.operatingMode === "approval" ? "Aprobación humana" : "Desactivada";
  const nextStep = crmChannelNextStep(channel);
  const hasDestination = Boolean(channel.crmConnectedAt) || automationActive;
  const ready = active && Boolean(channel.businessTokenStored) && hasDestination;
  const journey = [
    ["Conexión", active],
    ["Token", Boolean(channel.businessTokenStored)],
    ["Destino", hasDestination],
    ["Listo", ready],
  ] as const;

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--rule)] bg-white shadow-[var(--shadow-md)] transition duration-200 hover:border-[var(--rule)] hover:shadow-[var(--shadow-md)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="on-ink relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--ink-fill)] text-white shadow-[var(--shadow-md)]"><Smartphone className="size-5" /><span className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white ${active ? "bg-[var(--st-activo)]" : "bg-[var(--warn-mid)]"}`} /></span>
            <div className="min-w-0"><p className="truncate font-mono text-lg font-semibold tracking-[-0.02em] tabular-nums text-[var(--ink)]">{channel.phone ?? "Número no disponible"}</p><p className="mt-1 truncate text-xs text-[var(--ink-60)]">{channel.verifiedName ?? "Nombre comercial no disponible"} · {channel.workspace ?? "Sin cliente asignado"}</p></div>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${ready ? "bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]" : active ? "bg-[var(--ground-3)] text-[var(--ink-60)]" : "bg-[var(--warn-soft)] text-[var(--status-warn)]"}`}><span className={`size-1.5 rounded-full ${ready ? "bg-[var(--st-activo)]" : active ? "bg-[var(--ink-40)]" : "bg-[var(--warn-mid)]"}`} />{crmChannelStatusLabel(channel)}</span>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(200px,.7fr)] lg:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-40)]">Estado actual</p><p className="mt-2 text-base font-semibold text-[var(--ink)]">{nextStep.label}</p><p className="mt-1 max-w-lg text-xs leading-5 text-[var(--ink-60)]">{nextStep.detail}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-40)]">Responde desde</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{channel.crmConnectedAt ? channel.crmOrganizationName ?? "CRM externo" : "Sin entregar"}</p><p className="mt-1 text-xs text-[var(--ink-40)]">{channel.crmConnectedAt ? "Webhook verificado" : "Elegí a qué CRM entregarlo"}</p></div>
        </div>

        <ol className="mt-6 grid grid-cols-4 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--info-soft)]" aria-label="Progreso de la conexión">
          {journey.map(([label, complete], index) => <li key={label} className="relative flex min-w-0 items-center gap-2 border-r border-[var(--hairline)] px-2.5 py-3 last:border-r-0 sm:px-3.5"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${complete ? "bg-[var(--assist)] text-[var(--on-assist)]" : "border border-[var(--rule)] bg-white text-[var(--ink-40)]"}`}>{complete ? <CheckCircle2 className="size-3.5" /> : index + 1}</span><span className={`truncate text-[10px] font-semibold sm:text-[11px] ${complete ? "text-[var(--ink)]" : "text-[var(--ink-60)]"}`}>{label}</span></li>)}
        </ol>
      </div>

      <details className="group border-t border-[var(--hairline)] bg-[var(--ground-2)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 text-xs font-semibold text-[var(--ink-60)] sm:px-6"><span>Detalles técnicos</span><span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-40)]">IDs, calidad y sincronización <ChevronDown className="size-3.5 transition group-open:rotate-180" /></span></summary>
        <div className="grid gap-4 border-t border-[var(--hairline)] px-5 py-4 text-xs sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <DataPoint label="Onboarding" value={channel.connectedAt ? formatConnectionDate(channel.connectedAt) : "No disponible"} />
          <DataPoint label="Calidad" value={crmQualityLabel(channel.qualityRating ?? null)} />
          <DataPoint label="Sincronización" value={channel.lastSyncedAt ? formatConnectionDate(channel.lastSyncedAt) : "No disponible"} />
          <DataPoint label="Automatización" value={`${automationLabel}${channel.modelTier ? ` · ${channel.modelTier === "fast" ? "Rápida" : "Equilibrada"}` : ""}`} />
        </div>
      </details>
      <CrmHandoverForm channel={channel} onChange={onChange} />
    </article>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-40)]">{label}</p><p className="mt-1.5 truncate text-sm font-semibold text-[var(--ink)]">{value}</p></div>;
}

function ChannelConnectionRow({ channel, onChange }: { channel: CrmChannel; onChange: (channel: CrmChannel) => void }) {
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isCrmChannelActive(channel) ? "bg-[var(--st-activo)]" : "bg-[var(--ink-40)]"}`} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{channel.label}</p>
            {channel.official && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${channel.botConfigured ? "bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]" : "bg-[var(--ground-3)] text-[var(--ink-60)]"}`}><Bot className="size-3" /> {channel.botConfigured ? "Bot configurado" : "Bot pendiente"}</span>}
          </div>
          <p className="mt-1 text-xs text-[var(--ink-60)]">{channel.detail} · {crmChannelStatusLabel(channel)}</p>
          {channel.official && <p className="mt-2 text-[11px] text-[var(--ink-60)]">Cliente: {channel.workspace ?? "Sin asignar"} · Calidad: {crmQualityLabel(channel.qualityRating ?? null)}</p>}
          {channel.official && <p className="mt-1 text-[11px] text-[var(--ink-60)]">Automatización: {channel.operatingMode === "automatic" ? "Automática" : channel.operatingMode === "approval" ? "Aprobación humana" : "Desactivada"}</p>}
          <p className="mt-1 text-[11px] text-[var(--ink-40)]">Última sincronización: {channel.lastSyncedAt ? formatDate(channel.lastSyncedAt) : "No disponible"}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3"><span className="font-mono text-[10px] text-[var(--ink-60)]">{channel.phone || "sin número"}</span>{channel.official && <ArrowRight className="size-4 text-[var(--ink-40)]" />}</div>
    </>
  );

  return (
    <div className="border-b border-[var(--hairline)] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg px-2">{content}</div>
      {channel.official && <CrmHandoverForm channel={channel} onChange={onChange} compact />}
    </div>
  );
}

type CrmHandoverResponse = {
  ok?: boolean;
  error?: string;
  /** true cuando el destino es la bandeja de allok: el número vuelve, no se entrega. */
  restored?: boolean;
  crm?: {
    provider: string;
    organization_id: string | null;
    organization_name: string | null;
    webhook_url: string;
    connected_at: string | null;
    credentials_delivered: boolean;
  };
};

type DestinationView = {
  slug: string;
  label: string;
  webhookUrl: string;
  provisionUrl: string | null;
};

/**
 * Entrega un número a la app donde el cliente trabaja. El destino se elige de
 * la lista; darlo de alta es el formulario de abajo, no un deploy.
 */
function CrmHandoverForm({
  channel,
  onChange,
  compact = false,
}: {
  channel: CrmChannel;
  onChange: (channel: CrmChannel) => void;
  compact?: boolean;
}) {
  const [destinations, setDestinations] = useState<DestinationView[] | null>(null);
  const [slug, setSlug] = useState(channel.crmProvider ?? "");
  const [externalRef, setExternalRef] = useState(channel.crmOrganizationId ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [credentialsConfirmed, setCredentialsConfirmed] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const connected = Boolean(channel.crmConnectedAt && channel.webhookOverrideUri);
  const available = channel.businessTokenStored && channel.status !== "deauthorized";
  const selected = destinations?.find((destination) => destination.slug === slug) ?? null;
  const ready = Boolean(selected) && (selected?.provisionUrl
    ? true
    : selected?.slug === "allok" || credentialsConfirmed);

  const loadDestinations = useCallback(async () => {
    setDestinationError(null);
    try {
      const response = await fetch("/api/ops/destinations", { cache: "no-store" });
      const data = await response.json() as { destinations?: DestinationView[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudieron leer los destinos.");
      const list = data.destinations ?? [];
      setDestinations(list);
      // Nunca preseleccionar "allok": abrir el panel y apretar el botón no puede
      // ser lo mismo que devolver un número que estaba entregado.
      setSlug((current) => current || list.find((item) => item.slug !== "allok")?.slug || "");
      return list;
    } catch (error) {
      setDestinations([]);
      setDestinationError(error instanceof Error ? error.message : "No se pudieron leer los destinos.");
      return [];
    }
  }, []);

  async function connect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/ops/whatsapp-connections/${encodeURIComponent(channel.id)}/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: slug, external_ref: externalRef.trim() || null }),
      });
      const data = await response.json() as CrmHandoverResponse;
      if (!response.ok || !data.crm) throw new Error(data.error ?? "No se pudo entregar el número.");

      onChange({
        ...channel,
        crmOrganizationId: data.crm.organization_id,
        crmOrganizationName: data.crm.organization_name,
        crmProvider: data.restored ? null : data.crm.provider,
        crmConnectedAt: data.crm.connected_at,
        webhookOverrideUri: data.restored ? null : data.crm.webhook_url,
      });
      setNotice({
        kind: "success",
        text: data.restored
          ? "El número volvió a la bandeja de allok. Meta confirmó el callback."
          : data.crm.credentials_delivered
            ? `Entregado a ${data.crm.organization_name ?? slug}. Meta confirmó el callback y la app ya tiene el token.`
            : `Webhook movido a ${data.crm.organization_name ?? slug}. Meta confirmó el handshake; falta cargarle el token.`,
      });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo entregar el número." });
    } finally {
      setSaving(false);
    }
  }

  async function revealToken() {
    setLoadingToken(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/ops/whatsapp-connections/${encodeURIComponent(channel.id)}/token`, {
        method: "POST",
      });
      const data = await response.json() as { access_token?: string; error?: string };
      if (!response.ok || !data.access_token) throw new Error(data.error ?? "No se pudo leer el token.");
      setToken(data.access_token);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo leer el token." });
    } finally {
      setLoadingToken(false);
    }
  }

  return (
    <details
      className={`${compact ? "mt-3" : "border-t border-[var(--hairline)]"} group bg-[var(--assist-soft)]`}
      onToggle={(event) => { if (event.currentTarget.open && destinations === null) void loadDestinations(); }}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-sm font-semibold text-[var(--ink)] sm:px-5">
        <span className="flex items-center gap-2">
          <Webhook className="size-4 text-[var(--assist-ink)]" aria-hidden="true" />
          {connected ? `Entregado${channel.crmOrganizationName ? ` · ${channel.crmOrganizationName}` : ""}` : "Entregar este número a una app"}
        </span>
        <span className="text-[11px] font-medium text-[var(--ink-60)]">{connected ? "Revisar o reentregar" : "Configurar"}</span>
      </summary>

      <form onSubmit={(event) => void connect(event)} className="border-t border-[var(--assist-line)] px-4 py-5 sm:px-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-60)]"><Building2 className="size-3.5" /> Destino</div>

            <label className="mt-3 block text-xs font-medium text-[var(--ink-60)]" htmlFor={`dest-${channel.id}`}>App que recibe los mensajes</label>
            <select
              id={`dest-${channel.id}`}
              value={slug}
              onChange={(event) => { setSlug(event.target.value); setCredentialsConfirmed(false); setNotice(null); }}
              className="mt-2 min-h-11 w-full rounded-lg border border-[var(--assist-line)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25"
            >
              {destinations === null && <option value="">Cargando…</option>}
              {destinations?.length === 0 && <option value="">Todavía no hay destinos</option>}
              {destinations?.map((destination) => (
                <option key={destination.slug} value={destination.slug}>{destination.label}</option>
              ))}
            </select>

            {destinationError && <p className="mt-2 text-xs text-[var(--status-risk)]" role="alert">{destinationError}</p>}

            {selected && (
              <p className="mt-2 break-all font-mono text-[11px] text-[var(--ink-60)]">{selected.webhookUrl}</p>
            )}

            {selected?.provisionUrl && (
              <>
                <label className="mt-4 block text-xs font-medium text-[var(--ink-60)]" htmlFor={`ref-${channel.id}`}>
                  Referencia del cliente en {selected.label}
                </label>
                <input
                  id={`ref-${channel.id}`}
                  value={externalRef}
                  onChange={(event) => setExternalRef(event.target.value.trim())}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="organization_id (sólo SaaS)"
                  className="mt-2 min-h-11 w-full rounded-lg border border-[var(--assist-line)] bg-white px-3 font-mono text-sm text-[var(--ink)] outline-none transition focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25"
                />
                <p className="mt-2 text-[11px] leading-5 text-[var(--ink-60)]">Esta app recibe el token por HTTPS antes de que se mueva el webhook. En una instancia dedicada puede quedar vacío.</p>
              </>
            )}

            {selected && !selected.provisionUrl && (
              selected.slug === "allok" ? (
                <p className="mt-3 text-[11px] leading-5 text-[var(--ink-60)]">Devuelve la recepción de mensajes y la automatización a la bandeja de allok.</p>
              ) : (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-[var(--assist-soft)] px-3 py-3 text-xs text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={credentialsConfirmed}
                    onChange={(event) => setCredentialsConfirmed(event.target.checked)}
                    className="mt-0.5 size-4 accent-[var(--assist)]"
                  />
                  <span><strong className="block font-semibold">Ya guardé WABA ID, Phone Number ID y token en {selected.label}</strong><span className="mt-1 block text-[11px] leading-5 text-[var(--ink-60)]">Allok moverá el webhook sólo después de esta confirmación.</span></span>
                </label>
              )
            )}

            <DestinationEditor onSaved={() => { void loadDestinations(); }} />
          </div>

          <div className="rounded-lg border border-[var(--assist-line)] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--ink-60)]">Datos de este número</p>
            <dl className="mt-3 space-y-2.5 text-xs">
              <CrmPayloadFact label="client" value={channel.workspace ?? "Sin asignar"} />
              <CrmPayloadFact label="business_id" value={channel.businessId ?? "No disponible"} mono />
              <CrmPayloadFact label="waba_id" value={channel.wabaId ?? "No disponible"} mono />
              <CrmPayloadFact label="phone_number_id" value={channel.id} mono />
              <CrmPayloadFact label="business_token" value={channel.businessTokenStored ? "Cifrado · sólo servidor" : "No disponible"} icon={KeyRound} />
            </dl>

            <div className="mt-4 border-t border-[var(--assist-line)] pt-3">
              {token ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--ink-60)]">Access token</p>
                  <textarea
                    readOnly
                    value={token}
                    rows={3}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-2 w-full resize-none rounded-lg border border-[var(--assist-line)] bg-[var(--assist-soft)] p-2 font-mono text-[11px] break-all text-[var(--ink)]"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-[var(--status-risk)]">Trátalo como contraseña: no queda en pantalla al recargar.</p>
                </>
              ) : (
                <TapButton type="button" onClick={() => void revealToken()} disabled={loadingToken || !channel.businessTokenStored} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--assist-line)] px-3 text-xs font-semibold text-[var(--assist-ink)] disabled:opacity-40">
                  {loadingToken ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
                  {loadingToken ? "Leyendo…" : "Mostrar token para entregarlo"}
                </TapButton>
              )}
            </div>
          </div>
        </div>

        {!available && <p className="mt-4 rounded-lg border border-[var(--risk-line)] bg-[var(--risk-soft)] px-3 py-2.5 text-xs text-[var(--status-risk)]" role="alert">No se puede entregar: falta un token válido almacenado. Repite el onboarding.</p>}
        {notice && <p className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${notice.kind === "success" ? "border-[var(--st-activo-soft)] bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]" : "border-[var(--risk-line)] bg-[var(--risk-soft)] text-[var(--status-risk)]"}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--assist-line)] pt-4">
          <p className="max-w-2xl text-[11px] leading-5 text-[var(--ink-60)]">El cambio es reversible: puedes devolver el número a allok desde este mismo selector.</p>
          <button type="submit" disabled={saving || !available || !ready} className="on-ink inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--ink-fill)] disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Webhook className="size-4" />}
            {saving ? "Moviendo…" : slug === "allok" ? "Devolver a allok" : connected ? "Reentregar" : "Entregar número"}
          </button>
        </div>
      </form>
    </details>
  );
}

/** Alta y edición de destinos. Guardar el mismo slug rota su verify token. */
function DestinationEditor({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", label: "", webhook_url: "", verify_token: "", provision_url: "", provision_secret: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el destino.");
      setForm({ slug: "", label: "", webhook_url: "", verify_token: "", provision_url: "", provision_secret: "" });
      setOpen(false);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el destino.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <TapButton type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[var(--assist-ink)] underline underline-offset-4">
        <Plus className="size-3.5" /> Nuevo destino o rotar su verify token
      </TapButton>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-[var(--assist-line)] bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <DestinationField label="Identificador" value={form.slug} onChange={(value) => setForm({ ...form, slug: value.toLowerCase() })} placeholder="vocero" mono />
        <DestinationField label="Nombre" value={form.label} onChange={(value) => setForm({ ...form, label: value })} placeholder="Vocero CRM" />
      </div>
      <DestinationField label="URL del webhook" value={form.webhook_url} onChange={(value) => setForm({ ...form, webhook_url: value })} placeholder="https://vocero.app/api/whatsapp/webhook" mono />
      <DestinationField label="Verify token de esa app" value={form.verify_token} onChange={(value) => setForm({ ...form, verify_token: value })} placeholder="su WEBHOOK_VERIFY_TOKEN" mono />
      <DestinationField label="URL de provisión (opcional)" value={form.provision_url} onChange={(value) => setForm({ ...form, provision_url: value })} placeholder="https://vocero.app/api/whatsapp/provision" mono />
      {form.provision_url && (
        <DestinationField label="Secreto de provisión" value={form.provision_secret} onChange={(value) => setForm({ ...form, provision_secret: value })} placeholder="Bearer que espera esa app" mono />
      )}
      {error && <p className="mt-2 text-[11px] text-[var(--status-risk)]" role="alert">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <TapButton type="button" onClick={() => void save()} disabled={saving} className="on-ink inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-fill)] px-3 text-xs font-semibold text-white disabled:opacity-40">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : null} Guardar destino
        </TapButton>
        <TapButton type="button" onClick={() => setOpen(false)} className="min-h-9 px-2 text-xs font-semibold text-[var(--ink-60)]">Cancelar</TapButton>
      </div>
    </div>
  );
}

function DestinationField({ label, value, onChange, placeholder, mono = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; mono?: boolean }) {
  return (
    <label className="mt-2 block text-xs font-medium text-[var(--ink-60)]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        className={`mt-1 min-h-10 w-full rounded-lg border border-[var(--assist-line)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25 ${mono ? "font-mono text-xs" : ""}`}
      />
    </label>
  );
}

function CrmPayloadFact({ label, value, mono = false, icon: Icon }: { label: string; value: string; mono?: boolean; icon?: typeof KeyRound }) {
  return <div className="flex items-start justify-between gap-3"><dt className="font-mono text-[10px] text-[var(--ink-60)]">{label}</dt><dd className={`flex max-w-[210px] items-center gap-1.5 break-all text-right font-medium text-[var(--ink)] ${mono ? "font-mono text-[11px]" : ""}`}>{Icon && <Icon className="size-3.5 shrink-0 text-[var(--assist-ink)]" />}{value}</dd></div>;
}

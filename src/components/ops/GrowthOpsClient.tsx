"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  FileText,
  LoaderCircle,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type { DraftKind, GrowthLead, GrowthRun, OutreachDraft } from "@/lib/growth-types";
import type { MarketingSnapshot, PostizMetric, PostizPost } from "@/lib/postiz";
import type { WahaSnapshot } from "@/lib/waha";

type Tab = "hoy" | "marketing" | "runs" | "leads" | "drafts";

const RUN_LABELS = {
  queued: "En cola",
  running: "Investigando",
  completed: "Completado",
  failed: "Falló",
};

const KIND_LABELS: Record<DraftKind, string> = {
  dm: "DM",
  followup_1: "Follow-up 1",
  followup_2: "Follow-up 2",
  audio_script: "Audio",
  proposal: "Propuesta",
};
const KIND_ORDER: DraftKind[] = ["dm", "followup_1", "followup_2", "audio_script", "proposal"];

const DAY_MS = 86_400_000;
const isStale = (iso: string | null) => Boolean(iso) && Date.now() - new Date(iso as string).getTime() > 3 * DAY_MS;

export default function GrowthOpsClient({
  initialRuns,
  initialLeads,
  initialDrafts,
  marketing,
  waha,
}: {
  initialRuns: GrowthRun[];
  initialLeads: GrowthLead[];
  initialDrafts: OutreachDraft[];
  marketing: MarketingSnapshot;
  waha: WahaSnapshot;
}) {
  const [tab, setTab] = useState<Tab>("hoy");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [leads, setLeads] = useState(initialLeads);
  const [running, setRunning] = useState(false);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);

  // Drafts grouped by lead, kinds in a stable order.
  const draftsByLead = useMemo(() => {
    const groups = new Map<string, OutreachDraft[]>();
    for (const draft of drafts) {
      const list = groups.get(draft.leadId) ?? [];
      list.push(draft);
      groups.set(draft.leadId, list);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    }
    return [...groups.entries()];
  }, [drafts]);

  // Deterministic daily buckets (no LLM).
  const buckets = useMemo(() => {
    const contactarHoy: GrowthLead[] = [];
    const followUp: GrowthLead[] = [];
    const enviarPropuesta: GrowthLead[] = [];
    const today = new Date().toISOString().slice(0, 10);
    for (const lead of leads) {
      if (lead.status === "replied") enviarPropuesta.push(lead);
      else if (lead.status === "approved" && !lead.lastContactedAt) contactarHoy.push(lead);
      // Scheduled follow-up that's due (set by the agent's schedule_followup tool).
      else if (lead.nextActionAt != null && lead.nextActionAt.slice(0, 10) <= today) followUp.push(lead);
      else if (lead.status === "contacted" && isStale(lead.lastContactedAt)) followUp.push(lead);
    }
    return { contactarHoy, followUp, enviarPropuesta };
  }, [leads]);

  const startRun = async () => {
    setRunning(true);
    setNotice(null);
    const response = await fetch("/api/ops/growth/run", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(payload.error ?? "No se pudo iniciar el run.");
    else setNotice("Run enviado al Growth Agent. Actualiza en unos segundos para ver progreso.");
    setRunning(false);
  };

  const saveDraft = async (draft: OutreachDraft, status?: OutreachDraft["status"]) => {
    const response = await fetch(`/api/ops/growth/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: draft.content, status }),
    });
    if (!response.ok) {
      setNotice("No se pudo guardar el borrador.");
      return;
    }
    if (status) setDrafts((items) => items.map((item) => (item.id === draft.id ? { ...item, status } : item)));
    setNotice(status === "approved" ? "Borrador aprobado. Aún no se envió nada." : status === "rejected" ? "Borrador rechazado." : "Borrador guardado.");
  };

  const markContacted = async (lead: GrowthLead) => {
    const response = await fetch(`/api/ops/growth/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "contacted" }),
    });
    if (response.ok) {
      const now = new Date().toISOString();
      setLeads((items) => items.map((item) => (item.id === lead.id ? { ...item, status: "contacted", lastContactedAt: now } : item)));
      setNotice("Lead marcado como contactado manualmente.");
    }
  };

  const generateProposal = async (lead: GrowthLead) => {
    setBusyLead(lead.id);
    setNotice(null);
    const response = await fetch("/api/ops/growth/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusyLead(null);
    if (!response.ok) setNotice(payload.error ?? "No se pudo generar la propuesta.");
    else setNotice("Propuesta solicitada al agente. Aparecerá en Borradores en unos segundos.");
  };

  const saveLeadFields = async (lead: GrowthLead) => {
    const response = await fetch(`/api/ops/growth/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nextAction: lead.nextAction,
        nextActionAt: lead.nextActionAt?.slice(0, 10) ?? null,
        closeProbability: lead.closeProbability,
        potentialValue: lead.potentialValue,
      }),
    });
    setNotice(response.ok ? "Pipeline actualizado." : "No se pudo guardar el pipeline.");
  };

  const patchLead = (id: string, patch: Partial<GrowthLead>) =>
    setLeads((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <main className="min-h-screen bg-[#0f1711] px-4 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <Link id="lnk-back-to-ops" href="/ops" className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5" aria-label="Volver al sitio">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">Operación privada</div>
              <h1 className="mt-1 font-display text-3xl">Creativv Growth OS</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Actualizar datos"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => void startRun()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#dbe9c3] px-5 text-sm font-semibold text-[#172016] hover:bg-white disabled:opacity-50"
            >
              {running ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
              Ejecutar ahora
            </button>
            <form action="/api/ops/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-4">
          {[
            ["Hoy", buckets.contactarHoy.length + buckets.followUp.length + buckets.enviarPropuesta.length],
            ["Runs", initialRuns.length],
            ["Leads", leads.length],
            ["Pendientes", drafts.filter((draft) => draft.status === "pending").length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</div>
              <div className="mt-3 font-display text-4xl text-[#dbe9c3]">{value}</div>
            </div>
          ))}
        </section>

        {notice && (
          <div className="mt-5 rounded-xl border border-[#a9c989]/20 bg-[#a9c989]/8 px-4 py-3 text-sm text-[#dbe9c3]">
            {notice}
          </div>
        )}

        <div className="mt-7 flex gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1.5">
          {(["hoy", "marketing", "runs", "leads", "drafts"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === item ? "bg-white text-[#172016]" : "text-white/50 hover:text-white"}`}
            >
              {item === "hoy" ? "Hoy" : item === "marketing" ? "Marketing" : item === "runs" ? "Runs" : item === "leads" ? "Leads" : "Borradores"}
            </button>
          ))}
        </div>

        <section className="mt-5">
          {tab === "hoy" && (
            <div className="grid gap-5">
              <DayBucket
                title="Contactar hoy"
                hint="Aprobados, aún sin contactar"
                leads={buckets.contactarHoy}
                action={(lead) => (
                  <button type="button" onClick={() => void markContacted(lead)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#172016]">Marcar contactado</button>
                )}
              />
              <DayBucket
                title="Follow-up"
                hint="Contactados hace +3 días sin respuesta"
                leads={buckets.followUp}
                action={() => (
                  <button type="button" onClick={() => setTab("drafts")} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">Ver follow-ups</button>
                )}
              />
              <DayBucket
                title="Enviar propuesta"
                hint="Respondieron interesados"
                leads={buckets.enviarPropuesta}
                action={(lead) => (
                  <button type="button" disabled={busyLead === lead.id} onClick={() => void generateProposal(lead)} className="inline-flex items-center gap-1.5 rounded-full bg-[#dbe9c3] px-3 py-1.5 text-xs font-semibold text-[#172016] disabled:opacity-50">
                    {busyLead === lead.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Generar propuesta
                  </button>
                )}
              />
            </div>
          )}

          {tab === "marketing" && <MarketingPanel snapshot={marketing} waha={waha} />}

          {tab === "runs" && (
            <div className="grid gap-3">
              {initialRuns.length === 0 ? <Empty text="Todavía no hay runs. Ejecuta el agente cuando Neon y Eve estén conectados." /> : initialRuns.map((run) => (
                <article key={run.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:grid-cols-[150px_1fr_auto] md:items-center">
                  <div>
                    <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs text-[#cfe3b1]">{RUN_LABELS[run.status]}</span>
                    <div className="mt-3 font-mono text-[9px] text-white/35">{run.id.slice(0, 8)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{run.market} · {run.leadsRequested} leads máximo</div>
                    <p className="mt-2 text-sm leading-5 text-white/45">{run.summary ?? run.error ?? "Esperando actividad del agente."}</p>
                  </div>
                  <time className="font-mono text-[10px] text-white/35">{new Date(run.createdAt).toLocaleString("es-VE")}</time>
                </article>
              ))}
            </div>
          )}

          {tab === "leads" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {leads.length === 0 ? <Empty text="Los leads investigados aparecerán aquí con evidencia y fuentes." /> : leads.map((lead) => (
                <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c989]">{lead.vertical} · {lead.location}</div>
                      <h2 className="mt-2 font-display text-3xl">{lead.businessName}</h2>
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-full border border-[#a9c989]/25 font-display text-xl text-[#dbe9c3]">{lead.leadScore}</span>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-white/58">{lead.problemDetected}</p>
                  <div className="mt-4 rounded-xl bg-[#dbe9c3] p-4 text-sm leading-5 text-[#172016]">{lead.offerAngle}</div>
                  <p className="mt-4 text-xs leading-5 text-white/38">Evidencia: {lead.evidence}</p>

                  <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-white/35">
                      Prob. cierre %
                      <input
                        type="number" min={0} max={100}
                        value={lead.closeProbability ?? ""}
                        onChange={(e) => patchLead(lead.id, { closeProbability: e.target.value === "" ? null : Number(e.target.value) })}
                        className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white/80 outline-none focus:border-[#a9c989]/45"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-white/35">
                      Valor $
                      <input
                        type="number" min={0}
                        value={lead.potentialValue ?? ""}
                        onChange={(e) => patchLead(lead.id, { potentialValue: e.target.value === "" ? null : Number(e.target.value) })}
                        className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white/80 outline-none focus:border-[#a9c989]/45"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-white/35">
                      Próxima acción
                      <input
                        type="text"
                        value={lead.nextAction ?? ""}
                        onChange={(e) => patchLead(lead.id, { nextAction: e.target.value === "" ? null : e.target.value })}
                        className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white/80 outline-none focus:border-[#a9c989]/45"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-white/35">
                      Fecha
                      <input
                        type="date"
                        value={lead.nextActionAt?.slice(0, 10) ?? ""}
                        onChange={(e) => patchLead(lead.id, { nextActionAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })}
                        className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white/80 outline-none focus:border-[#a9c989]/45"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {lead.sourceUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white">
                        Fuente <ExternalLink className="size-3" />
                      </a>
                    ))}
                    <button type="button" onClick={() => void saveLeadFields(lead)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">Guardar pipeline</button>
                    <button type="button" disabled={busyLead === lead.id} onClick={() => void generateProposal(lead)} className="inline-flex items-center gap-1.5 rounded-full border border-[#a9c989]/30 px-3 py-1.5 text-xs font-semibold text-[#dbe9c3] disabled:opacity-50">
                      {busyLead === lead.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Propuesta
                    </button>
                    {lead.status !== "contacted" && (
                      <button type="button" onClick={() => void markContacted(lead)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#172016]">Marcar contacto manual</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === "drafts" && (
            <div className="grid gap-5">
              {drafts.length === 0 ? <Empty text="Los mensajes personalizados aparecerán aquí. Ninguno se enviará automáticamente." /> : draftsByLead.map(([leadId, leadDrafts]) => {
                const lead = leadById.get(leadId);
                return (
                  <div key={leadId} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className="font-display text-2xl">{lead?.businessName ?? "Lead"}</h2>
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c989]">{lead?.vertical}</span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {leadDrafts.map((draft) => (
                        <article key={draft.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[#dbe9c3]/15 px-2.5 py-1 text-[10px] font-semibold text-[#dbe9c3]">{KIND_LABELS[draft.kind]}</span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">{draft.channel}</span>
                            </div>
                            <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/55">{draft.status}</span>
                          </div>
                          <textarea
                            value={draft.content}
                            onChange={(event) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, content: event.target.value } : item))}
                            rows={draft.kind === "proposal" ? 12 : 6}
                            className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/75 outline-none focus:border-[#a9c989]/45"
                          />
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => void saveDraft(draft, "approved")} className="inline-flex items-center gap-2 rounded-full bg-[#dbe9c3] px-4 py-2 text-xs font-semibold text-[#172016]"><Check className="size-3.5" /> Aprobar</button>
                            <button type="button" onClick={() => void saveDraft(draft, "rejected")} className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/60"><X className="size-3.5" /> Rechazar</button>
                            <button type="button" onClick={() => navigator.clipboard.writeText(draft.content)} className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/60"><Copy className="size-3.5" /> Copiar</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-white/30">Aprobar cambia el estado. No envía el mensaje.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DayBucket({
  title,
  hint,
  leads,
  action,
}: {
  title: string;
  hint: string;
  leads: GrowthLead[];
  action: (lead: GrowthLead) => ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-[#dbe9c3]">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">{leads.length} · {hint}</span>
      </div>
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-white/35">Nada por ahora.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {leads.map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{lead.businessName}</div>
                <div className="truncate text-xs text-white/45">{lead.nextAction ?? lead.problemDetected}</div>
              </div>
              {action(lead)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 p-10 text-center text-sm text-white/38 lg:col-span-2">{text}</div>;
}

const compact = new Intl.NumberFormat("es-VE", { notation: "compact", maximumFractionDigits: 1 });

const POST_STATE_LABELS: Record<string, string> = {
  QUEUE: "Programado",
  PUBLISHED: "Publicado",
  DRAFT: "Borrador",
  ERROR: "Error",
};

function MetricChip({ metric }: { metric: PostizMetric }) {
  const up = metric.percentageChange >= 0;
  return (
    <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/38">{metric.label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-xl text-[#dbe9c3]">{compact.format(metric.value)}</span>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? "text-[#a9c989]" : "text-[#e0a394]"}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(metric.percentageChange).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function PostRow({ post }: { post: PostizPost }) {
  const [metrics, setMetrics] = useState<PostizMetric[] | "loading" | "missing" | "error" | null>(null);

  const loadMetrics = async () => {
    setMetrics("loading");
    try {
      const response = await fetch(`/api/ops/growth/marketing/posts/${post.id}`);
      if (!response.ok) return setMetrics("error");
      const payload = await response.json();
      setMetrics(payload.missing ? "missing" : payload.metrics);
    } catch {
      setMetrics("error");
    }
  };

  return (
    <li className="rounded-xl border border-white/8 bg-black/15 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c989]">{post.integration?.identifier ?? "canal"}</span>
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/55">{POST_STATE_LABELS[post.state] ?? post.state}</span>
            <time className="font-mono text-[10px] text-white/35">{post.publishDate ? new Date(post.publishDate).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : ""}</time>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/65">{post.content.replace(/<[^>]+>/g, "") || "(sin texto)"}</p>
        </div>
        <div className="flex items-center gap-2">
          {post.releaseURL && (
            <a href={post.releaseURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white">
              Ver <ExternalLink className="size-3" />
            </a>
          )}
          {post.state === "PUBLISHED" && metrics === null && (
            <button type="button" onClick={() => void loadMetrics()} className="inline-flex items-center gap-1.5 rounded-full border border-[#a9c989]/30 px-3 py-1.5 text-xs font-semibold text-[#dbe9c3]">
              <BarChart3 className="size-3.5" /> Métricas
            </button>
          )}
          {metrics === "loading" && <LoaderCircle className="size-4 animate-spin text-white/45" />}
        </div>
      </div>
      {metrics === "missing" && <p className="mt-3 text-xs text-white/40">La plataforma no devolvió el ID publicado. Conéctalo desde Postiz para ver métricas.</p>}
      {metrics === "error" && <p className="mt-3 text-xs text-[#e0a394]">No se pudieron cargar las métricas.</p>}
      {Array.isArray(metrics) && (
        metrics.length === 0
          ? <p className="mt-3 text-xs text-white/40">Sin métricas todavía.</p>
          : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{metrics.map((metric) => <MetricChip key={metric.label} metric={metric} />)}</div>
      )}
    </li>
  );
}

function MarketingPanel({ snapshot, waha }: { snapshot: MarketingSnapshot; waha: WahaSnapshot }) {
  if (!snapshot.configured) {
    return (
      <div className="grid gap-5">
        <ChannelRuntimePanel postizConfigured={false} waha={waha} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">Setup requerido</div>
          <h2 className="mt-3 font-display text-3xl">Conecta Postiz para medir marketing.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
            Agrega <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#dbe9c3]">POSTIZ_API_KEY</code> en las variables de entorno
            (Settings → API en tu cuenta de Postiz) y recarga. Verás canales conectados (IG, LinkedIn…),
            calendario de publicaciones y métricas por canal y por post.
          </p>
        </div>
      </div>
    );
  }

  if (snapshot.error) {
    return (
      <div className="grid gap-5">
        <ChannelRuntimePanel postizConfigured waha={waha} />
        <div className="rounded-2xl border border-[#e0a394]/25 bg-[#e0a394]/8 p-6 text-sm text-[#e0a394]">
          Postiz no pudo cargar sus métricas. Revisa la conexión y credenciales del servidor.
        </div>
      </div>
    );
  }

  const now = new Date(snapshot.fetchedAt).getTime();
  const published = snapshot.posts.filter((post) => post.state === "PUBLISHED");
  const upcoming = snapshot.posts
    .filter((post) => post.state !== "PUBLISHED" && post.state !== "ERROR" && new Date(post.publishDate).getTime() >= now)
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate));
  const impressions = snapshot.channels
    .flatMap((channel) => channel.metrics)
    .filter((metric) => /impression|impresion|view|vista|reach|alcance/i.test(metric.label))
    .reduce((sum, metric) => sum + metric.value, 0);

  return (
    <div className="grid gap-5">
      <ChannelRuntimePanel postizConfigured={snapshot.configured} waha={waha} />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Canales", snapshot.channels.length],
          ["Publicados 30d", published.length],
          ["Programados", upcoming.length],
          ["Impresiones 30d", compact.format(impressions)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</div>
            <div className="mt-3 font-display text-4xl text-[#dbe9c3]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {snapshot.channels.length === 0 ? (
          <Empty text="No hay canales conectados en Postiz. Conecta Instagram y LinkedIn desde la app de Postiz." />
        ) : (
          snapshot.channels.map((channel) => (
            <article key={channel.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-3">
                {channel.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar externo de Postiz
                  <img src={channel.picture} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full border border-[#a9c989]/25 font-display text-lg text-[#dbe9c3]">{channel.name.slice(0, 1)}</span>
                )}
                <div>
                  <h2 className="font-display text-2xl">{channel.name}</h2>
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c989]">
                    {channel.identifier}{channel.disabled ? " · desactivado" : ""}
                  </div>
                </div>
              </div>
              {channel.metrics.length === 0 ? (
                <p className="mt-4 text-xs text-white/38">Sin métricas disponibles para este canal.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {channel.metrics.map((metric) => <MetricChip key={metric.label} metric={metric} />)}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-[#dbe9c3]">Próximas publicaciones</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">{upcoming.length} programadas</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-white/35">Nada programado. Agenda desde Postiz o pide contenido al agente.</p>
        ) : (
          <ul className="mt-4 grid gap-2">{upcoming.map((post) => <PostRow key={post.id} post={post} />)}</ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-[#dbe9c3]">Publicado (últimos 30 días)</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">{published.length} posts</span>
        </div>
        {published.length === 0 ? (
          <p className="mt-4 text-sm text-white/35">Todavía no hay publicaciones en este período.</p>
        ) : (
          <ul className="mt-4 grid gap-2">{published.map((post) => <PostRow key={post.id} post={post} />)}</ul>
        )}
      </div>
    </div>
  );
}

function ChannelRuntimePanel({ postizConfigured, waha }: { postizConfigured: boolean; waha: WahaSnapshot }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">Redes sociales</div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Postiz</h2>
            <p className="mt-1 text-xs leading-5 text-white/40">LinkedIn, Instagram y otros canales con calendario y métricas.</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs ${postizConfigured ? "bg-[#a9c989]/15 text-[#dbe9c3]" : "bg-white/8 text-white/45"}`}>
            {postizConfigured ? "Conectado" : "Sin configurar"}
          </span>
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">WhatsApp publishing</div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">WAHA</h2>
            <p className="mt-1 text-xs leading-5 text-white/40">Status y Channels aprobados. Sin outreach masivo ni envío directo autónomo.</p>
            {waha.error && <p className="mt-2 text-xs text-[#e0a394]">{waha.error}</p>}
            {waha.sessions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {waha.sessions.map((session) => (
                  <span key={session.name} className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                    {session.name} · {session.status}{session.engine ? ` · ${session.engine}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${waha.configured && !waha.error ? "bg-[#a9c989]/15 text-[#dbe9c3]" : "bg-white/8 text-white/45"}`}>
            {!waha.configured ? "Sin configurar" : waha.error ? "Con error" : "Conectado"}
          </span>
        </div>
      </article>
    </div>
  );
}

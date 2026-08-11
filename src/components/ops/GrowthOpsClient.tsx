"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bot,
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
import { DISPLAY_TIGHT, TapButton } from "@/components/ops/apple";

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
  initialTab,
  initialDraftId,
  marketing,
}: {
  initialRuns: GrowthRun[];
  initialLeads: GrowthLead[];
  initialDrafts: OutreachDraft[];
  initialTab: Tab;
  initialDraftId: string | null;
  marketing: MarketingSnapshot;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [leads, setLeads] = useState(initialLeads);
  const [running, setRunning] = useState(false);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!initialDraftId || tab !== "drafts") return;
    const target = document.getElementById(`draft-${initialDraftId}`);
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [initialDraftId, tab]);

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
    <main className="min-h-dvh bg-[#f7f8fa] pb-24 text-[#142b4b] md:pb-8">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-7 sm:px-6 lg:px-10 lg:pt-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a8797]">Agencia · Growth</div>
            <h1 className={`mt-2 font-display text-4xl font-semibold text-[#142b4b] ${DISPLAY_TIGHT}`}>Growth</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68778a]">Investiga oportunidades, decide el próximo paso y revisa cada acción comercial antes de ejecutarla.</p>
          </div>
          <div className="flex items-center gap-2">
            <TapButton
              type="button"
              onClick={() => window.location.reload()}
              className="flex size-11 items-center justify-center rounded-lg border border-[#d8e0e7] bg-white text-[#526174] transition hover:bg-[#f0f4f7] hover:text-[#172238]"
              aria-label="Actualizar datos"
            >
              <RefreshCw className="size-4" />
            </TapButton>
            <TapButton
              type="button"
              disabled={running}
              onClick={() => void startRun()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c5f04a] px-4 text-sm font-semibold text-[#263710] transition hover:-translate-y-0.5 hover:bg-[#b7e63b] active:translate-y-0 disabled:opacity-50"
            >
              {running ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
              Ejecutar ahora
            </TapButton>
          </div>
        </header>

        <section className="relative mt-7 overflow-hidden rounded-2xl bg-[#111b2d] text-white shadow-[0_20px_50px_rgba(20,43,75,0.14)]">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-[#c5f04a]/10 blur-3xl" />
          <div className="relative grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Acciones de hoy", buckets.contactarHoy.length + buckets.followUp.length + buckets.enviarPropuesta.length],
            ["Investigaciones", initialRuns.length],
            ["Oportunidades", leads.length],
            ["Por revisar", drafts.filter((draft) => draft.status === "pending").length],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-white/10 p-5 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0 sm:p-6">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">{label}</div>
              <div className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] tabular-nums text-[#c5f04a]">{value}</div>
            </div>
          ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 lg:grid-cols-2" aria-label="Eve y observabilidad">
          <Link href="/ops/agents" className="group flex items-center gap-4 rounded-xl border border-[#dfe5eb] bg-white p-4 shadow-[0_5px_18px_rgba(20,43,75,0.035)] transition hover:-translate-y-0.5 hover:border-[#c4cfd9] hover:shadow-[0_10px_28px_rgba(20,43,75,0.07)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#172238] text-[#c5f04a]"><Bot className="size-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-[#263b54]">Eve Agents</strong><span className="mt-1 block text-xs text-[#7a8797]">Identidad, herramientas, modos y guardrails.</span></span><ExternalLink className="size-4 text-[#8a96a5] transition group-hover:text-[#526174]" /></Link>
          <Link href="/ops/lab" className="group flex items-center gap-4 rounded-xl border border-[#dfe5eb] bg-white p-4 shadow-[0_5px_18px_rgba(20,43,75,0.035)] transition hover:-translate-y-0.5 hover:border-[#c4cfd9] hover:shadow-[0_10px_28px_rgba(20,43,75,0.07)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#48637d]"><Activity className="size-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-[#263b54]">Observabilidad</strong><span className="mt-1 block text-xs text-[#7a8797]">Evaluaciones, controles y artefactos verificables.</span></span><ExternalLink className="size-4 text-[#8a96a5] transition group-hover:text-[#526174]" /></Link>
        </section>

        {notice && (
          <div className="mt-5 rounded-xl border border-[#d5e5c5] bg-[#f5faef] px-4 py-3 text-sm text-[#4d6f2b]" role="status">
            {notice}
          </div>
        )}

        <div className="mt-7 flex gap-1 overflow-x-auto rounded-xl border border-[#dfe5eb] bg-white p-1.5 shadow-[0_4px_14px_rgba(20,43,75,0.03)]" role="tablist" aria-label="Áreas de Growth">
          {(["hoy", "marketing", "runs", "leads", "drafts"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              role="tab"
              aria-selected={tab === item}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-[#172238] text-white shadow-sm" : "text-[#68778a] hover:bg-[#f1f4f7] hover:text-[#172238]"}`}
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
                  <TapButton type="button" onClick={() => void markContacted(lead)} className="rounded-lg bg-[#172238] px-3 py-2 text-xs font-semibold text-white">Marcar contactado</TapButton>
                )}
              />
              <DayBucket
                title="Follow-up"
                hint="Contactados hace +3 días sin respuesta"
                leads={buckets.followUp}
                action={() => (
                  <TapButton type="button" onClick={() => setTab("drafts")} className="rounded-lg border border-[#d5dde5] bg-white px-3 py-2 text-xs font-semibold text-[#526174]">Ver follow-ups</TapButton>
                )}
              />
              <DayBucket
                title="Enviar propuesta"
                hint="Respondieron interesados"
                leads={buckets.enviarPropuesta}
                action={(lead) => (
                  <button type="button" disabled={busyLead === lead.id} onClick={() => void generateProposal(lead)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c5f04a] px-3 py-2 text-xs font-semibold text-[#263710] disabled:opacity-50">
                    {busyLead === lead.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Generar propuesta
                  </button>
                )}
              />
            </div>
          )}

          {tab === "marketing" && <MarketingPanel snapshot={marketing} />}

          {tab === "runs" && (
            <div className="grid gap-3">
              {initialRuns.length === 0 ? <Empty text="Todavía no hay runs. Ejecuta el agente cuando Neon y Eve estén conectados." /> : initialRuns.map((run) => (
                <article key={run.id} className="grid gap-4 rounded-xl border border-[#dfe5eb] bg-white p-5 shadow-[0_5px_18px_rgba(20,43,75,0.04)] md:grid-cols-[150px_1fr_auto] md:items-center">
                  <div>
                    <span className="rounded-md bg-[#edf7df] px-3 py-1.5 text-xs font-semibold text-[#527526]">{RUN_LABELS[run.status]}</span>
                    <div className="mt-3 font-mono text-[9px] text-[#8a96a5]">{run.id.slice(0, 8)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#263b54]">{run.market} · {run.leadsRequested} leads máximo</div>
                    <p className="mt-2 text-sm leading-5 text-[#68778a]">{run.summary ?? run.error ?? "Esperando actividad del agente."}</p>
                  </div>
                  <time className="font-mono text-[10px] text-[#8a96a5]">{new Date(run.createdAt).toLocaleString("es-VE")}</time>
                </article>
              ))}
            </div>
          )}

          {tab === "leads" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {leads.length === 0 ? <Empty text="Los leads investigados aparecerán aquí con evidencia y fuentes." /> : leads.map((lead) => (
                <article key={lead.id} className="rounded-xl border border-[#dfe5eb] bg-white p-5 shadow-[0_8px_24px_rgba(20,43,75,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71842f]">{lead.vertical} · {lead.location}</div>
                      <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[#172238]">{lead.businessName}</h2>
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#edf7df] font-display text-xl font-semibold text-[#527526]">{lead.leadScore}</span>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[#526174]">{lead.problemDetected}</p>
                  <div className="mt-4 rounded-lg bg-[#eef7e4] p-4 text-sm leading-6 text-[#3f5525]">{lead.offerAngle}</div>
                  <p className="mt-4 text-xs leading-5 text-[#7a8797]">Evidencia: {lead.evidence}</p>

                  <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8797]">
                      Prob. cierre %
                      <input
                        type="number" min={0} max={100}
                        value={lead.closeProbability ?? ""}
                        onChange={(e) => patchLead(lead.id, { closeProbability: e.target.value === "" ? null : Number(e.target.value) })}
                        className="min-h-10 rounded-lg border border-[#d5dde5] bg-[#fafbfc] px-2.5 text-sm text-[#263b54] outline-none focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8797]">
                      Valor $
                      <input
                        type="number" min={0}
                        value={lead.potentialValue ?? ""}
                        onChange={(e) => patchLead(lead.id, { potentialValue: e.target.value === "" ? null : Number(e.target.value) })}
                        className="min-h-10 rounded-lg border border-[#d5dde5] bg-[#fafbfc] px-2.5 text-sm text-[#263b54] outline-none focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8797]">
                      Próxima acción
                      <input
                        type="text"
                        value={lead.nextAction ?? ""}
                        onChange={(e) => patchLead(lead.id, { nextAction: e.target.value === "" ? null : e.target.value })}
                        className="min-h-10 rounded-lg border border-[#d5dde5] bg-[#fafbfc] px-2.5 text-sm text-[#263b54] outline-none focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8797]">
                      Fecha
                      <input
                        type="date"
                        value={lead.nextActionAt?.slice(0, 10) ?? ""}
                        onChange={(e) => patchLead(lead.id, { nextActionAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })}
                        className="min-h-10 rounded-lg border border-[#d5dde5] bg-[#fafbfc] px-2.5 text-sm text-[#263b54] outline-none focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/20"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {lead.sourceUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5dde5] px-3 py-2 text-xs text-[#526174] hover:bg-[#f7f9fb] hover:text-[#172238]">
                        Fuente <ExternalLink className="size-3" />
                      </a>
                    ))}
                    <TapButton type="button" onClick={() => void saveLeadFields(lead)} className="rounded-lg border border-[#d5dde5] px-3 py-2 text-xs font-semibold text-[#526174]">Guardar pipeline</TapButton>
                    <button type="button" disabled={busyLead === lead.id} onClick={() => void generateProposal(lead)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#bdd78e] bg-[#f5faef] px-3 py-2 text-xs font-semibold text-[#527526] disabled:opacity-50">
                      {busyLead === lead.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Propuesta
                    </button>
                    {lead.status !== "contacted" && (
                      <TapButton type="button" onClick={() => void markContacted(lead)} className="rounded-lg bg-[#172238] px-3 py-2 text-xs font-semibold text-white">Marcar contacto manual</TapButton>
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
                  <div key={leadId} className="rounded-xl border border-[#dfe5eb] bg-white p-4 shadow-[0_8px_24px_rgba(20,43,75,0.04)]">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className="font-display text-2xl font-semibold text-[#172238]">{lead?.businessName ?? "Lead"}</h2>
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71842f]">{lead?.vertical}</span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {leadDrafts.map((draft) => (
                        <article id={`draft-${draft.id}`} tabIndex={-1} key={draft.id} className="scroll-mt-6 rounded-xl border border-[#e1e6ec] bg-[#fafbfc] p-5 outline-none focus:border-[#91ad4d] focus:ring-2 focus:ring-[#c5f04a]/20">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#edf7df] px-2.5 py-1 text-[10px] font-semibold text-[#527526]">{KIND_LABELS[draft.kind]}</span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7a8797]">{draft.channel}</span>
                            </div>
                            <span className="rounded-md bg-[#eef2f5] px-3 py-1.5 text-xs text-[#61748a]">{draft.status}</span>
                          </div>
                          <textarea
                            value={draft.content}
                            onChange={(event) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, content: event.target.value } : item))}
                            rows={draft.kind === "proposal" ? 12 : 6}
                            className="mt-4 w-full resize-y rounded-lg border border-[#d5dde5] bg-white p-4 text-sm leading-6 text-[#263b54] outline-none focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/20"
                          />
                          <div className="mt-4 flex flex-wrap gap-2">
                            <TapButton type="button" onClick={() => void saveDraft(draft, "approved")} className="inline-flex items-center gap-2 rounded-lg bg-[#c5f04a] px-4 py-2 text-xs font-semibold text-[#263710]"><Check className="size-3.5" /> Aprobar</TapButton>
                            <TapButton type="button" onClick={() => void saveDraft(draft, "rejected")} className="inline-flex items-center gap-2 rounded-lg border border-[#d5dde5] bg-white px-4 py-2 text-xs font-semibold text-[#526174]"><X className="size-3.5" /> Rechazar</TapButton>
                            <TapButton type="button" onClick={() => navigator.clipboard.writeText(draft.content)} className="inline-flex items-center gap-2 rounded-lg border border-[#d5dde5] bg-white px-4 py-2 text-xs font-semibold text-[#526174]"><Copy className="size-3.5" /> Copiar</TapButton>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-[#7a8797]">Aprobar cambia el estado. No envía el mensaje.</p>
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
    <div className="rounded-xl border border-[#dfe5eb] bg-white p-5 shadow-[0_6px_20px_rgba(20,43,75,0.04)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-[#172238]">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#7a8797]">{leads.length} · {hint}</span>
      </div>
      {leads.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#d7dfe6] bg-[#fafbfc] px-4 py-6 text-sm text-[#7a8797]">No hay acciones pendientes.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {leads.map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e3e8ed] bg-[#fafbfc] px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{lead.businessName}</div>
                <div className="truncate text-xs text-[#7a8797]">{lead.nextAction ?? lead.problemDetected}</div>
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
  return <div className="rounded-xl border border-dashed border-[#cfd8e1] bg-white p-10 text-center text-sm text-[#7a8797] lg:col-span-2">{text}</div>;
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
    <div className="rounded-lg border border-[#e3e8ed] bg-[#fafbfc] px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#7a8797]">{metric.label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-xl font-semibold text-[#263b54]">{compact.format(metric.value)}</span>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? "text-[#6f9632]" : "text-[#9a6360]"}`}>
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
    <li className="rounded-lg border border-[#e3e8ed] bg-[#fafbfc] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71842f]">{post.integration?.identifier ?? "canal"}</span>
            <span className="rounded-md bg-[#eef2f5] px-2 py-0.5 text-[10px] text-[#61748a]">{POST_STATE_LABELS[post.state] ?? post.state}</span>
            <time className="font-mono text-[10px] text-[#8a96a5]">{post.publishDate ? new Date(post.publishDate).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : ""}</time>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[#526174]">{post.content.replace(/<[^>]+>/g, "") || "(sin texto)"}</p>
        </div>
        <div className="flex items-center gap-2">
          {post.releaseURL && (
            <a href={post.releaseURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5dde5] bg-white px-3 py-1.5 text-xs text-[#526174] hover:text-[#172238]">
              Ver <ExternalLink className="size-3" />
            </a>
          )}
          {post.state === "PUBLISHED" && metrics === null && (
            <button type="button" onClick={() => void loadMetrics()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#bdd78e] bg-[#f5faef] px-3 py-1.5 text-xs font-semibold text-[#527526]">
              <BarChart3 className="size-3.5" /> Métricas
            </button>
          )}
          {metrics === "loading" && <LoaderCircle className="size-4 animate-spin text-[#7a8797]" />}
        </div>
      </div>
      {metrics === "missing" && <p className="mt-3 text-xs text-[#7a8797]">La plataforma no devolvió el ID publicado. Conéctalo desde Postiz para ver métricas.</p>}
      {metrics === "error" && <p className="mt-3 text-xs text-[#a1a1a3]">No se pudieron cargar las métricas.</p>}
      {Array.isArray(metrics) && (
        metrics.length === 0
          ? <p className="mt-3 text-xs text-[#7a8797]">Sin métricas todavía.</p>
          : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{metrics.map((metric) => <MetricChip key={metric.label} metric={metric} />)}</div>
      )}
    </li>
  );
}

function MarketingPanel({ snapshot }: { snapshot: MarketingSnapshot }) {
  if (!snapshot.configured) {
    return (
      <div className="grid gap-5">
        <ChannelRuntimePanel postizConfigured={false} />
        <div className="rounded-xl border border-[#dfe5eb] bg-white p-8">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#71842f]">Setup requerido</div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-[#172238]">Conecta Postiz para medir marketing.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#68778a]">
            Agrega <code className="rounded bg-[#eef2f5] px-1.5 py-0.5 text-[#526174]">POSTIZ_API_KEY</code> en las variables de entorno
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
        <ChannelRuntimePanel postizConfigured />
        <div className="rounded-none border border-[#a1a1a3]/25 bg-[#a1a1a3]/8 p-6 text-sm text-[#a1a1a3]">
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
      <ChannelRuntimePanel postizConfigured={snapshot.configured} />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Canales", snapshot.channels.length],
          ["Publicados 30d", published.length],
          ["Programados", upcoming.length],
          ["Impresiones 30d", compact.format(impressions)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#dfe5eb] bg-white p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7a8797]">{label}</div>
            <div className="mt-3 font-display text-4xl font-semibold text-[#172238]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {snapshot.channels.length === 0 ? (
          <Empty text="No hay canales conectados en Postiz. Conecta Instagram y LinkedIn desde la app de Postiz." />
        ) : (
          snapshot.channels.map((channel) => (
            <article key={channel.id} className="rounded-xl border border-[#dfe5eb] bg-white p-5">
              <div className="flex items-center gap-3">
                {channel.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar externo de Postiz
                  <img src={channel.picture} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf7df] font-display text-lg font-semibold text-[#527526]">{channel.name.slice(0, 1)}</span>
                )}
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#172238]">{channel.name}</h2>
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#71842f]">
                    {channel.identifier}{channel.disabled ? " · desactivado" : ""}
                  </div>
                </div>
              </div>
              {channel.metrics.length === 0 ? (
                <p className="mt-4 text-xs text-[#7a8797]">Sin métricas disponibles para este canal.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {channel.metrics.map((metric) => <MetricChip key={metric.label} metric={metric} />)}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="rounded-xl border border-[#dfe5eb] bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-[#172238]">Próximas publicaciones</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#7a8797]">{upcoming.length} programadas</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-[#7a8797]">Nada programado. Agenda desde Postiz o pide contenido al agente.</p>
        ) : (
          <ul className="mt-4 grid gap-2">{upcoming.map((post) => <PostRow key={post.id} post={post} />)}</ul>
        )}
      </div>

      <div className="rounded-xl border border-[#dfe5eb] bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-[#172238]">Publicado · últimos 30 días</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#7a8797]">{published.length} posts</span>
        </div>
        {published.length === 0 ? (
          <p className="mt-4 text-sm text-[#7a8797]">Todavía no hay publicaciones en este período.</p>
        ) : (
          <ul className="mt-4 grid gap-2">{published.map((post) => <PostRow key={post.id} post={post} />)}</ul>
        )}
      </div>
    </div>
  );
}

function ChannelRuntimePanel({ postizConfigured }: { postizConfigured: boolean }) {
  return (
    <div>
      <article className="rounded-xl border border-[#dfe5eb] bg-white p-5">
        <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#71842f]">Redes sociales</div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#172238]">Postiz</h2>
            <p className="mt-1 text-xs leading-5 text-[#7a8797]">LinkedIn, Instagram y otros canales con calendario y métricas.</p>
          </div>
          <span className={`rounded-md px-3 py-1.5 text-xs font-semibold ${postizConfigured ? "bg-[#edf7df] text-[#527526]" : "bg-[#eef2f5] text-[#7a8797]"}`}>
            {postizConfigured ? "Conectado" : "Sin configurar"}
          </span>
        </div>
      </article>
    </div>
  );
}

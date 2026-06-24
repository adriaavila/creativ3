"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileText,
  LoaderCircle,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import type { DraftKind, GrowthLead, GrowthRun, OutreachDraft } from "@/lib/growth-types";

type Tab = "hoy" | "runs" | "leads" | "drafts";

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
}: {
  initialRuns: GrowthRun[];
  initialLeads: GrowthLead[];
  initialDrafts: OutreachDraft[];
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
    for (const lead of leads) {
      if (lead.status === "replied") enviarPropuesta.push(lead);
      else if (lead.status === "approved" && !lead.lastContactedAt) contactarHoy.push(lead);
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
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && <UserButton />}
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
          {(["hoy", "runs", "leads", "drafts"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === item ? "bg-white text-[#172016]" : "text-white/50 hover:text-white"}`}
            >
              {item === "hoy" ? "Hoy" : item === "runs" ? "Runs" : item === "leads" ? "Leads" : "Borradores"}
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

                  <div className="mt-5 grid grid-cols-3 gap-2">
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

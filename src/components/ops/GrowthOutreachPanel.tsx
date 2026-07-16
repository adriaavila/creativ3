"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, ExternalLink, LoaderCircle, MessageCircle, Search } from "lucide-react";
import type { GrowthPromptInfo } from "@/lib/growth-prompts";
import type { GrowthLead } from "@/lib/growth-types";

export default function GrowthOutreachPanel({
  initialLeads,
  prompts,
}: {
  initialLeads: GrowthLead[];
  prompts: GrowthPromptInfo[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState(initialLeads[0]?.businessPhone ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialLeads[0]?.contactSourceUrl ?? "");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter((lead) =>
      [lead.businessName, lead.vertical, lead.location, lead.problemDetected]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [leads, query]);

  const selectLead = (lead: GrowthLead) => {
    setSelectedId(lead.id);
    setPhone(lead.businessPhone ?? "");
    setSourceUrl(lead.contactSourceUrl ?? "");
    setMessage("");
    setConfirmed(false);
    setNotice(null);
  };

  const sendMessage = async () => {
    if (!selected || !confirmed) return;
    setSending(true);
    setNotice(null);
    const response = await fetch("/api/ops/growth/outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leadId: selected.id,
        phone,
        message,
        contactSourceUrl: sourceUrl || null,
        confirmed: true,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!response.ok) {
      setNotice(payload.error ?? "No se pudo enviar el mensaje.");
      return;
    }
    setLeads((items) =>
      items.map((lead) =>
        lead.id === selected.id
          ? { ...lead, status: "contacted", businessPhone: phone, contactSourceUrl: sourceUrl || null, lastContactedAt: new Date().toISOString() }
          : lead,
      ),
    );
    setMessage("");
    setConfirmed(false);
    setNotice("Mensaje enviado y registrado en el historial del lead.");
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-[#a9c989]" />
            <h2 className="font-display text-2xl">Growth Agent Command Center</h2>
          </div>
          <p className="mt-2 text-sm text-white/50">
            Prompts activos, leads investigados y contacto manual auditado por WhatsApp.
          </p>
        </div>
        <span className="rounded-full bg-[#a9c989]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#bfe39b]">
          {leads.length} leads · {prompts.length} prompts
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(380px,1.2fr)]">
        <div className="rounded-xl border border-white/10 bg-black/10 p-3">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <Search className="size-4 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar lead…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </label>
          <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {filteredLeads.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/35">No hay leads que coincidan.</p>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => selectLead(lead)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    lead.id === selectedId
                      ? "border-[#a9c989]/40 bg-[#a9c989]/8"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{lead.businessName}</div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                        {lead.vertical} · score {lead.leadScore}
                      </div>
                    </div>
                    {lead.businessPhone && <MessageCircle className="size-4 text-[#a9c989]" />}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/45">{lead.problemDetected}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/10 p-5">
          {!selected ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-white/35">Selecciona un lead.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a9c989]">{selected.status}</div>
                  <h3 className="mt-2 font-display text-3xl">{selected.businessName}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{selected.offerAngle}</p>
                </div>
                <div className="flex gap-2">
                  {selected.sourceUrls.slice(0, 2).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white">
                      Fuente <ExternalLink className="size-3" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-white/45">
                  WhatsApp público del negocio
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+58412…" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#a9c989]/45" />
                </label>
                <label className="text-xs text-white/45">
                  URL donde se verificó el contacto
                  <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#a9c989]/45" />
                </label>
              </div>
              <label className="mt-4 block text-xs text-white/45">
                Mensaje personalizado de la plantilla
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} placeholder="Escribe un mensaje breve y personalizado basado en la evidencia…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none focus:border-[#a9c989]/45" />
              </label>
              <p className="mt-2 text-[11px] leading-5 text-white/35">
                El primer contacto usa la plantilla de marketing <code className="text-[#dbe9c3]">creativv_growth_intro</code>, requerida por Meta fuera de la ventana de 24 horas. Si sigue en revisión, no se marcará el lead como contactado.
              </p>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-white/55">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" />
                Confirmo que revisé el mensaje y que el número pertenece públicamente a este negocio. Este envío quedará auditado.
              </label>
              {notice && <div className="mt-4 rounded-xl border border-[#a9c989]/20 bg-[#a9c989]/8 px-4 py-3 text-sm text-[#dbe9c3]">{notice}</div>}
              <button type="button" onClick={() => void sendMessage()} disabled={sending || !confirmed || !phone || message.trim().length < 10} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#dbe9c3] px-5 text-sm font-semibold text-[#172016] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                Enviar plantilla por WhatsApp
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#a9c989]" />
          <h3 className="text-sm font-semibold">System prompts activos</h3>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {prompts.map((prompt) => (
            <details key={prompt.id} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{prompt.name}</div>
                    <p className="mt-1 text-xs text-white/40">{prompt.role}</p>
                  </div>
                  <span className="font-mono text-[9px] text-white/25 group-open:text-[#a9c989]">VER</span>
                </div>
              </summary>
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="font-mono text-[9px] text-white/30">{prompt.sourcePath}</div>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5 text-white/60">{prompt.content}</pre>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

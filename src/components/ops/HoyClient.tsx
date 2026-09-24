"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Check, LoaderCircle, MessageCircle, Plus } from "lucide-react";
import { DISPLAY_TIGHT, TapButton } from "@/components/ops/apple";
import type { GrowthLead } from "@/lib/growth-types";
import {
  localDate,
  messageFor,
  salesQueue,
  stageOf,
  upcomingCount,
  waDigits,
  waLink,
  weekStart,
  weekStats,
  type Outcome,
  type Stage,
} from "@/lib/sales-queue";

/** La meta de ACTIVE.md: 5 conversaciones por semana, cada una con un pedido. */
const WEEK_GOAL = 5;

const STAGE_UI: Record<Stage, { label: string; className: string }> = {
  asked: { label: "Pago pedido", className: "bg-[var(--st-atencion-soft)] text-[var(--st-atencion-ink)]" },
  interested: { label: "Interesado", className: "bg-[var(--st-atendiendo-soft)] text-[var(--st-atendiendo-ink)]" },
  first: { label: "Primer contacto", className: "bg-[var(--st-pausado-soft)] text-[var(--st-pausado-ink)]" },
};

const OUTCOMES: { id: Outcome; label: string; done: string }[] = [
  { id: "talked", label: "Hablamos", done: "Hablaron" },
  { id: "asked", label: "Pedí el pago", done: "Pago pedido" },
  { id: "paid", label: "Pagó", done: "Pagó" },
  { id: "not_now", label: "No por ahora", done: "No por ahora" },
];

const SOURCES = ["aliado", "referido", "reunión", "growth", "otro"] as const;
const OFFERS = [
  { id: "vocero", label: "Vocero" },
  { id: "rei", label: "REI" },
  { id: "agencia", label: "Agencia" },
] as const;

const FIELD =
  "min-h-11 w-full rounded-lg border border-[var(--rule)] bg-white px-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-40)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]";
const QUIET_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--rule)] bg-white px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ground-3)] disabled:opacity-50";

function dayLabel(ymd: string, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("es-VE", {
    weekday: style,
    day: "numeric",
    ...(style === "long" ? { month: "long" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${ymd}T12:00:00Z`));
}

function lastTouch(lead: GrowthLead, today: string) {
  if (!lead.lastContactedAt) return "Sin contacto todavía";
  const days = Math.round(
    (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${localDate(lead.lastContactedAt)}T12:00:00Z`)) / 86_400_000,
  );
  if (days <= 0) return "Hablaron hoy";
  if (days === 1) return "Hablaron ayer";
  return `Hablaron hace ${days} días`;
}

export default function HoyClient({ initialLeads, today }: { initialLeads: GrowthLead[]; today: string }) {
  const [leads, setLeads] = useState(initialLeads);
  // El orden se fija al cargar: una tarjeta resuelta se queda en su sitio hasta
  // recargar, en vez de saltar y mover el dedo a la tarjeta de al lado.
  const [queueIds, setQueueIds] = useState(() => salesQueue(initialLeads, today).map((lead) => lead.id));
  const [done, setDone] = useState<Record<string, { outcome: Outcome; nextActionAt: string | null }>>({});
  const [formOpen, setFormOpen] = useState(queueIds.length === 0);

  const byId = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const queue = queueIds.map((id) => byId.get(id)).filter((lead): lead is GrowthLead => Boolean(lead));
  const stats = weekStats(leads, today);
  const upcoming = upcomingCount(leads, today);
  const pending = queue.length - Object.keys(done).length;

  const patchLead = (id: string, patch: Partial<GrowthLead>) =>
    setLeads((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addLead = (lead: GrowthLead) => {
    setLeads((items) => [lead, ...items]);
    setQueueIds((ids) => [lead.id, ...ids]);
    setFormOpen(false);
  };

  return (
    <main className="min-h-dvh bg-[var(--ground-2)] pb-24 text-[var(--ink)] md:pb-10">
      <div className="mx-auto w-full max-w-[880px] px-4 pb-10 pt-7 sm:px-6 lg:pt-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-60)]">
              Ventas · {dayLabel(today, "long")}
            </p>
            <h1 className={`mt-2 font-display text-4xl font-semibold ${DISPLAY_TIGHT}`}>Hoy</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-60)]" aria-live="polite">
              {pending > 0
                ? `${pending} ${pending === 1 ? "persona" : "personas"} para hablar hoy.`
                : queue.length > 0
                  ? "Nadie más para hoy."
                  : "Nadie para hoy. Agrega a alguien con quien hablaste."}
            </p>
          </div>
          {!formOpen && (
            <TapButton
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--assist)] px-4 text-sm font-semibold text-[var(--on-assist)]"
            >
              <Plus className="size-4" aria-hidden="true" /> Agregar lead
            </TapButton>
          )}
        </header>

        <section
          aria-label="La semana"
          className="on-ink mt-6 grid grid-cols-2 overflow-hidden rounded-2xl bg-[var(--ink-fill)] text-white sm:grid-cols-3"
        >
          {[
            // En móvil la meta ocupa la fila entera: a 375 px «CONVERSACIONES» no cabe en un tercio.
            { label: "Conversaciones", value: `${stats.conversations}/${WEEK_GOAL}`, bar: stats.conversations / WEEK_GOAL, cell: "col-span-2 border-b sm:col-span-1 sm:border-b-0 sm:border-r" },
            { label: "Pagos pedidos", value: String(stats.asked), cell: "border-r" },
            { label: "Pagos", value: String(stats.paid), cell: "" },
          ].map((metric) => (
            <div key={metric.label} className={`min-w-0 border-white/10 p-4 sm:p-5 ${metric.cell}`}>
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">{metric.label}</div>
              <div className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--assist)] sm:text-4xl">
                {metric.value}
              </div>
              {metric.bar !== undefined && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className="h-full rounded-full bg-[var(--assist)]" style={{ width: `${Math.min(1, metric.bar) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
          <p className="col-span-2 border-t sm:col-span-3 border-white/10 px-4 py-2.5 text-xs text-white/60 sm:px-5">
            Semana desde el {dayLabel(weekStart(today))}. Cuenta personas con las que hablaste.
          </p>
        </section>

        {formOpen && <AddLeadForm today={today} onAdded={addLead} onCancel={() => setFormOpen(false)} canCancel={queue.length > 0} />}

        {queue.length > 0 ? (
          <ol className="mt-6 grid gap-3" aria-label="Para hablar hoy">
            {queue.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                today={today}
                done={done[lead.id]}
                onLogged={(outcome, patch) => {
                  patchLead(lead.id, patch);
                  setDone((d) => ({ ...d, [lead.id]: { outcome, nextActionAt: patch.nextActionAt ?? null } }));
                }}
                onReopen={() =>
                  setDone((d) => {
                    const rest = { ...d };
                    delete rest[lead.id];
                    return rest;
                  })
                }
                onPhone={(businessPhone) => patchLead(lead.id, { businessPhone })}
              />
            ))}
          </ol>
        ) : (
          !formOpen && (
            <div className="mt-6 rounded-xl border border-[var(--rule)] bg-white p-6 text-center">
              <p className="font-semibold">Nadie para hoy.</p>
              <p className="mt-1 text-sm text-[var(--ink-60)]">Agrega a alguien con quien hablaste o con quien vas a hablar.</p>
            </div>
          )
        )}

        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ink-60)]">
          {upcoming > 0 && <span>{upcoming} con fecha más adelante.</span>}
          <Link href="/ops/crm" className="inline-flex min-h-11 items-center font-semibold text-[var(--ink)] underline-offset-4 hover:underline">
            Ver el pipeline completo
          </Link>
        </p>
      </div>
    </main>
  );
}

function LeadCard({
  lead,
  today,
  done,
  onLogged,
  onReopen,
  onPhone,
}: {
  lead: GrowthLead;
  today: string;
  done?: { outcome: Outcome; nextActionAt: string | null };
  onLogged: (outcome: Outcome, patch: Partial<GrowthLead>) => void;
  onReopen: () => void;
  onPhone: (phone: string) => void;
}) {
  const [saving, setSaving] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState("");
  const stage = stageOf(lead) ?? "first";
  const link = waLink(lead.businessPhone, messageFor(stage, lead));
  const overdue = lead.nextActionAt && lead.nextActionAt.slice(0, 10) < today;

  const log = async (outcome: Outcome) => {
    setSaving(outcome);
    setError(null);
    const response = await fetch(`/api/ops/growth/leads/${lead.id}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, reason: outcome === "not_now" ? reason : undefined }),
    }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) : {};
    setSaving(null);
    if (!response?.ok) {
      setError(payload.error ?? "No se guardó. Revisa la conexión y toca otra vez.");
      return;
    }
    setAskReason(false);
    onLogged(outcome, { ...payload.patch, lastContactedAt: payload.lastContactedAt });
  };

  if (done) {
    const label = OUTCOMES.find((o) => o.id === done.outcome)!.done;
    return (
      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--rule)] bg-white/60 px-4 py-2 sm:px-5">
        <Check className="size-4 shrink-0 text-[var(--st-activo-ink)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm">
          <strong className="font-semibold">{lead.businessName}</strong>
          <span className="text-[var(--ink-60)]">
            {" "}· {label}
            {done.nextActionAt ? `. Vuelve el ${dayLabel(done.nextActionAt)}.` : "."}
          </span>
        </span>
        <button type="button" onClick={onReopen} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink)] underline-offset-4 hover:underline">
          Cambiar
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-[var(--rule)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="min-w-0 break-words text-[17px] font-semibold tracking-[-0.01em]">{lead.businessName}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_UI[stage].className}`}>{STAGE_UI[stage].label}</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-[var(--ink-60)]">
        {lastTouch(lead, today)}
        {lead.nextAction ? ` · ${lead.nextAction}` : ""}
        {overdue ? ` · tocaba el ${dayLabel(lead.nextActionAt!.slice(0, 10))}` : ""}
      </p>

      <div className="mt-4">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="on-ink inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-sm font-semibold text-white sm:w-auto"
          >
            <MessageCircle className="size-4" aria-hidden="true" /> Escribir por WhatsApp
          </a>
        ) : (
          <PhoneForm leadId={lead.id} onSaved={onPhone} />
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-semibold text-[var(--ink-60)]">Qué pasó</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OUTCOMES.map((outcome) => (
            <button
              key={outcome.id}
              type="button"
              disabled={saving !== null}
              aria-pressed={outcome.id === "not_now" ? askReason : undefined}
              onClick={() => (outcome.id === "not_now" ? setAskReason((open) => !open) : void log(outcome.id))}
              className={QUIET_BUTTON}
            >
              {saving === outcome.id && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {outcome.label}
            </button>
          ))}
        </div>
      </fieldset>

      {askReason && (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void log("not_now");
          }}
        >
          <label className="sr-only" htmlFor={`reason-${lead.id}`}>Por qué no, por ahora</label>
          <input
            id={`reason-${lead.id}`}
            className={FIELD}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Por qué no (caro, sin tiempo, ya tiene algo…)"
            maxLength={200}
            autoFocus
          />
          <button type="submit" disabled={saving !== null} className={`${QUIET_BUTTON} shrink-0`}>
            {saving === "not_now" && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Guardar
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-[var(--st-atencion-ink)]">
          {error}
        </p>
      )}
    </li>
  );
}

function PhoneForm({ leadId, onSaved }: { leadId: string; onSaved: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!waDigits(phone)) {
      setError("Ese número no alcanza. Escríbelo con el código de país: 58 412…");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/ops/growth/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessPhone: phone }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) setError("No se guardó el número. Toca otra vez.");
    else onSaved(phone);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={`phone-${leadId}`}>WhatsApp</label>
      <input
        id={`phone-${leadId}`}
        className={FIELD}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Sin WhatsApp. Agrega el número"
      />
      <button type="submit" disabled={saving} className={`${QUIET_BUTTON} shrink-0`}>
        {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Guardar número
      </button>
      {error && <p role="alert" className="text-sm font-medium text-[var(--st-atencion-ink)] sm:basis-full">{error}</p>}
    </form>
  );
}

function AddLeadForm({
  today,
  onAdded,
  onCancel,
  canCancel,
}: {
  today: string;
  onAdded: (lead: GrowthLead) => void;
  onCancel: () => void;
  canCancel: boolean;
}) {
  // El id nace con el formulario: si la red falla y se toca otra vez, el
  // servidor recibe el mismo id y no duplica la fila.
  const [id, setId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({ businessName: "", businessPhone: "", source: "referido", offer: "vocero", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.businessName.trim()) return setError("Falta el nombre.");
    if (form.businessPhone.trim() && !waDigits(form.businessPhone)) {
      return setError("Ese número no alcanza. Escríbelo con el código de país: 58 412…");
    }
    setSaving(true);
    setError(null);
    const response = await fetch("/api/ops/growth/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form, businessPhone: form.businessPhone.trim() || null }),
    }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) : {};
    setSaving(false);
    if (!response?.ok) return setError(payload.error ?? "No se guardó. Revisa la conexión y toca otra vez.");

    onAdded({
      id,
      businessName: form.businessName.trim(),
      vertical: "Manual",
      location: "Caracas, Venezuela",
      websiteUrl: null,
      instagramUrl: null,
      businessPhone: form.businessPhone.trim() || null,
      contactSourceUrl: null,
      evidence: `Fuente: ${form.source}`,
      sourceUrls: [],
      problemDetected: form.note.trim(),
      offerAngle: form.offer,
      leadScore: 5,
      status: "new",
      nextAction: "Primer contacto",
      nextActionAt: payload.today ?? today,
      closeProbability: null,
      potentialValue: null,
      lastContactedAt: null,
      createdAt: new Date().toISOString(),
    });
    setId(crypto.randomUUID());
    setForm({ businessName: "", businessPhone: "", source: form.source, offer: form.offer, note: "" });
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-[var(--rule)] bg-white p-4 sm:grid-cols-2 sm:p-5" aria-label="Agregar lead">
      <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
        Negocio o persona
        <input className={FIELD} value={form.businessName} onChange={set("businessName")} maxLength={120} autoFocus placeholder="Mística, Clínica Sur…" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        <span>WhatsApp <span className="font-normal text-[var(--ink-60)]">(opcional)</span></span>
        <input className={FIELD} type="tel" inputMode="tel" autoComplete="off" value={form.businessPhone} onChange={set("businessPhone")} placeholder="58 412 555 1234" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        De dónde viene
        <select className={FIELD} value={form.source} onChange={set("source")}>
          {SOURCES.map((source) => (
            <option key={source} value={source}>{source[0].toUpperCase() + source.slice(1)}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Qué le ofreces
        <select className={FIELD} value={form.offer} onChange={set("offer")}>
          {OFFERS.map((offer) => (
            <option key={offer.id} value={offer.id}>{offer.label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        <span>Nota <span className="font-normal text-[var(--ink-60)]">(opcional)</span></span>
        <input className={FIELD} value={form.note} onChange={set("note")} maxLength={400} placeholder="Qué dijo, qué necesita" />
      </label>
      {error && <p role="alert" className="text-sm font-medium text-[var(--st-atencion-ink)] sm:col-span-2">{error}</p>}
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
        <TapButton type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--assist)] px-4 text-sm font-semibold text-[var(--on-assist)] disabled:opacity-50">
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Agregar a hoy
        </TapButton>
        {canCancel && (
          <button type="button" onClick={onCancel} className={QUIET_BUTTON}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

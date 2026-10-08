"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, ExternalLink, Mail, Upload, X } from "lucide-react";
import { DISPLAY_TIGHT } from "@/components/ops/apple";
import type { OutreachOpsContact, OutreachOpsData } from "@/lib/outreach-ops";

const QUIET_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--rule)] bg-white px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ground-3)] disabled:cursor-not-allowed disabled:opacity-50";
const INK_BUTTON =
  "on-ink inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const CARD = "rounded-2xl border border-[var(--rule)] bg-white p-5 sm:p-6";
const EYEBROW = "font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-60)]";

const DEMO_PILL: Record<string, string> = {
  listo: "bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]",
  pendiente: "bg-[var(--st-atendiendo-soft)] text-[var(--st-atendiendo-ink)]",
  falló: "bg-[var(--st-atencion-soft)] text-[var(--st-atencion-ink)]",
};

function pct(n: number, d: number) {
  return d ? `${((n / d) * 100).toFixed(1)} %` : "—";
}

function when(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

type ImportResult = {
  contacts: number;
  inserted: number;
  existing: number;
  skipped: { row: number; name: string; email: string; reason: string }[];
  demos: { queued: number; ready: number; existing: number };
};

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

export default function OutreachClient({ data }: { data: OutreachOpsData }) {
  const router = useRouter();
  const live = data.mode === "live";
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<OutreachOpsContact | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmExclude, setConfirmExclude] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function setSwitch(enabled: boolean) {
    setBusy("switch");
    setError(null);
    const { ok, data: res } = await postJson("/api/ops/outreach/switch", { enabled });
    setBusy(null);
    setConfirmOpen(false);
    if (!ok) return setError(String(res.error ?? "No se pudo cambiar el interruptor."));
    router.refresh();
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) return setError("El CSV pesa más de 2 MB.");
    setBusy("upload");
    setError(null);
    setImportResult(null);
    const { ok, data: res } = await postJson("/api/ops/outreach/import", { csv: await file.text(), fileName: file.name });
    setBusy(null);
    if (!ok) return setError(String(res.error ?? "No se pudo importar."));
    setImportResult(res as unknown as ImportResult);
    router.refresh();
  }

  async function exclude(email: string) {
    setBusy(`exclude:${email}`);
    setError(null);
    const { ok, data: res } = await postJson("/api/ops/outreach/exclude", { email });
    setBusy(null);
    setConfirmExclude(null);
    if (!ok) return setError(String(res.error ?? "No se pudo excluir."));
    router.refresh();
  }

  const c = data.counters;
  const metrics = [
    { label: "Enviados hoy", value: c ? `${c.sentToday}/${data.dailyCap}` : "—" },
    { label: "Últimos 7 días", value: c ? String(c.sent7d) : "—" },
    { label: "Rebote", value: c ? pct(c.recent.bounced, c.recent.sent) : "—", alert: data.bounceStopped },
    { label: "Quejas", value: c ? pct(c.recent.complained, c.recent.sent) : "—" },
    { label: "Bajas", value: c ? String(c.unsubscribes) : "—" },
    { label: "Chats en demos", value: c ? String(c.demoChats) : "—" },
    { label: "Clics al CTA", value: c ? String(c.demoClicks) : "—" },
  ];
  const sw = data.switch;
  const lastRun = data.lastRun;

  return (
    <main className="min-h-dvh bg-[var(--ground-2)] pb-24 text-[var(--ink)] md:pb-10">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-7 sm:px-6 lg:pt-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={EYEBROW}>Prospección · hola.allok.fun</p>
            <h1 className={`mt-2 font-display text-4xl font-semibold ${DISPLAY_TIGHT}`}>Correo en frío</h1>
            <p className="mt-2 max-w-[640px] text-sm leading-6 text-[var(--ink-60)]">
              Sube los leads, el cron arma la demo de cada negocio y, con los envíos activos, manda la secuencia de tres correos: hasta{" "}
              {data.dailyCap} al día, de lunes a viernes en horario local.
            </p>
          </div>
        </header>

        {data.mode === "fixture" && (
          <p className="mt-5 rounded-xl border border-dashed border-[var(--rule)] bg-white/60 px-4 py-3 text-sm text-[var(--ink-60)]">
            Datos de ejemplo: <code>next dev</code> sin <code>DATABASE_URL</code>. Los botones no hacen nada aquí.
          </p>
        )}

        {(data.warnings.length > 0 || data.bounceStopped || error) && (
          <div role="alert" className="mt-5 grid gap-2">
            {error && <Warning text={error} />}
            {data.bounceStopped && c && (
              <Warning
                text={`Envío detenido solo: ${c.recent.bounced} de los últimos ${c.recent.sent} correos rebotaron (más de 3 %). Limpia la lista antes de seguir; el cron no enviará mientras tanto.`}
              />
            )}
            {data.warnings.map((w) => (
              <Warning key={w} text={w} />
            ))}
          </div>
        )}

        {data.mode === "no-db" ? (
          <section className={`${CARD} mt-6 text-center`}>
            <Mail className="mx-auto size-8 text-[var(--ink-60)]" strokeWidth={1.6} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold">Todavía no hay base conectada.</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[var(--ink-60)]">
              Configura <code>DATABASE_URL</code> en Vercel y vuelve a cargar. Las tablas se crean solas la primera vez; el envío empieza apagado.
            </p>
          </section>
        ) : (
          <>
            <section aria-label="Envíos activos" className={`${CARD} mt-6 flex flex-wrap items-center justify-between gap-4`}>
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold">Envíos activos</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-60)]">
                  {sw.effectiveOn
                    ? "Encendido: el cron envía lo que toca cada 30 minutos."
                    : sw.forcedOff
                      ? "Apagado por OUTREACH_ENABLED=false en Vercel: este interruptor no puede encenderlo."
                      : "Apagado: no sale ningún correo. Las demos y los rebotes siguen corriendo."}
                  {sw.changedAt && ` Último cambio: ${when(sw.changedAt)}.`}
                  {sw.effectiveOn && !data.resendConfigured && " Pero falta RESEND_API_KEY: nada sale hasta agregarla."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={sw.dbEnabled}
                aria-label="Envíos activos"
                disabled={!live || busy === "switch" || (sw.forcedOff && !sw.dbEnabled)}
                onClick={() => (sw.dbEnabled ? setSwitch(false) : setConfirmOpen(true))}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sw.dbEnabled ? "bg-[var(--st-activo)]" : "bg-[var(--ground-3)] ring-1 ring-inset ring-[var(--rule)]"}`}
              >
                <span className={`inline-block size-6 rounded-full bg-white shadow transition-transform ${sw.dbEnabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </section>

            <section aria-label="Cifras" className="on-ink mt-4 grid grid-cols-2 overflow-hidden rounded-2xl bg-[var(--ink-fill)] text-white sm:grid-cols-4 lg:grid-cols-7">
              {metrics.map((m) => (
                <div key={m.label} className="min-w-0 border-b border-r border-white/10 p-4">
                  <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">{m.label}</div>
                  <div className={`mt-2 font-display text-2xl font-semibold tabular-nums tracking-[-0.04em] ${m.alert ? "text-[var(--st-atencion)]" : "text-[var(--assist)]"}`}>{m.value}</div>
                </div>
              ))}
              <p className="col-span-2 px-4 py-2.5 text-xs text-white/60 sm:col-span-4 lg:col-span-7">
                Rebote y quejas sobre los últimos {c?.recent.sent ?? 0} envíos (ventana de 100). «Hoy» es el día de CDMX; el tope cuenta 24 h móviles.
              </p>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section aria-label="Subir leads" className={CARD}>
                <h2 className="text-[17px] font-semibold">Subir leads</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-60)]">
                  CSV con <code>empresa, vertical, ciudad, pais, web, email…</code> Solo entran correos publicados en la web del negocio (sin gmail ni casillas que nadie lee). Cada fila con web pone su demo en cola.
                </p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={upload} aria-label="Archivo CSV de leads" />
                <button type="button" className={`${INK_BUTTON} mt-4`} disabled={!live || busy === "upload"} onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" aria-hidden="true" /> {busy === "upload" ? "Importando…" : "Elegir CSV"}
                </button>
                {importResult && (
                  <div className="mt-4 rounded-xl bg-[var(--ground-2)] p-4 text-sm leading-6" aria-live="polite">
                    <p>
                      <strong>{importResult.inserted}</strong> contactos nuevos, {importResult.existing} ya estaban, {importResult.skipped.length} saltados.
                      Demos: {importResult.demos.queued} en cola, {importResult.demos.ready} ya existían.
                    </p>
                    {importResult.skipped.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-[var(--ink-60)]">
                        {Object.entries(
                          importResult.skipped.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.reason]: (acc[s.reason] ?? 0) + 1 }), {}),
                        ).map(([reason, n]) => (
                          <li key={reason}>
                            {n} · {reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              <section aria-label="Última corrida" className={CARD}>
                <h2 className="text-[17px] font-semibold">Última corrida del cron</h2>
                {lastRun ? <LastRun run={lastRun} /> : <p className="mt-1 text-sm leading-6 text-[var(--ink-60)]">Aún no corre. Vercel lo llama cada 30 minutos.</p>}
              </section>
            </div>

            <section aria-label="Contactos" className="mt-4 overflow-hidden rounded-2xl border border-[var(--rule)] bg-white">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
                <h2 className="text-[17px] font-semibold">Contactos</h2>
                <p className="text-sm text-[var(--ink-60)]">{data.contacts.length} en total</p>
              </div>
              {data.contacts.length === 0 ? (
                <p className="px-5 pb-6 pt-2 text-sm text-[var(--ink-60)]">Ninguno todavía. Sube el CSV de leads para empezar.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="border-y border-[var(--hairline)] bg-[var(--ground-2)] text-xs text-[var(--ink-60)]">
                      <tr>
                        {["Negocio", "Ciudad", "Correo", "Demo", "Estado demo", "Paso", "Estado", "Último envío", ""].map((h) => (
                          <th key={h} scope="col" className="px-3 py-2.5 font-semibold first:pl-5 last:pr-5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.contacts.map((row) => (
                        <tr key={row.email} className={`border-b border-[var(--hairline)] align-middle ${row.suppressed ? "text-[var(--ink-60)]" : ""}`}>
                          <td className="py-2.5 pl-5 pr-3 font-semibold">{row.businessName}</td>
                          <td className="px-3 py-2.5">{[row.city, row.country].filter(Boolean).join(", ")}</td>
                          <td className="px-3 py-2.5 font-mono text-[12.5px]">{row.email}</td>
                          <td className="px-3 py-2.5">
                            {row.demoPath ? (
                              <a href={row.demoPath} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline">
                                Abrir <ExternalLink className="size-3.5" aria-hidden="true" />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.demoStatus ? (
                              <span title={row.demoError ?? undefined} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEMO_PILL[row.demoStatus]}`}>
                                {row.demoStatus}
                              </span>
                            ) : (
                              <span className="text-[var(--ink-60)]">sin web</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">{row.step}/3</td>
                          <td className="px-3 py-2.5">
                            {row.statusLabel}
                            {row.waiting && <span className="block text-xs text-[var(--ink-60)]">{row.waiting}</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">{when(row.lastSentAt)}</td>
                          <td className="py-2.5 pl-3 pr-5">
                            <div className="flex justify-end gap-2">
                              <button type="button" className={QUIET_BUTTON} onClick={() => setPreview(row)}>
                                Ver correo
                              </button>
                              {!row.suppressed &&
                                (confirmExclude === row.email ? (
                                  <button type="button" className={`${QUIET_BUTTON} text-[var(--st-atencion-ink)]`} disabled={!live || busy !== null} onClick={() => exclude(row.email)}>
                                    ¿Seguro? Excluir
                                  </button>
                                ) : (
                                  <button type="button" className={QUIET_BUTTON} disabled={!live} onClick={() => setConfirmExclude(row.email)}>
                                    Excluir
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {confirmOpen && (
        <Modal title="¿Activar los envíos?" onClose={() => setConfirmOpen(false)}>
          <ul className="grid list-disc gap-2 pl-5 text-sm leading-6">
            <li>
              El cron enviará hasta <strong>{data.dailyCap} correos al día</strong>, de <strong>lunes a viernes entre 9:00 y 17:00</strong> en la hora local de cada negocio (CDMX o Bogotá), como mucho 3 cada 30 minutos.
            </li>
            <li>Cada negocio recibe hasta tres correos (días 0, 3 y 8) desde adrian@hola.allok.fun; las respuestas llegan a hi@allok.fun.</li>
            <li>El primer correo a un negocio con web espera a que su demo esté lista. Si falla dos veces, sale la versión sin demo.</li>
            <li>Todos llevan enlace de baja. Si el rebote pasa de 3 %, el envío se detiene solo.</li>
            {!data.resendConfigured && <li className="font-semibold text-[var(--st-atencion-ink)]">Falta RESEND_API_KEY: no saldrá nada hasta agregarla.</li>}
          </ul>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={QUIET_BUTTON} onClick={() => setConfirmOpen(false)}>
              Cancelar
            </button>
            <button type="button" className={INK_BUTTON} disabled={busy === "switch"} onClick={() => setSwitch(true)}>
              Sí, activar envíos
            </button>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title={`Paso 1 · ${preview.businessName}`} onClose={() => setPreview(null)}>
          {preview.preview.note && <p className="mb-3 rounded-lg bg-[var(--st-atendiendo-soft)] px-3 py-2 text-sm text-[var(--st-atendiendo-ink)]">{preview.preview.note}</p>}
          <p className="text-xs text-[var(--ink-60)]">Para: {preview.email}</p>
          <p className="mt-1 text-sm font-semibold">Asunto: {preview.preview.subject}</p>
          <pre className="mt-3 max-h-[55dvh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--ground-2)] p-4 font-sans text-sm leading-6">{preview.preview.text}</pre>
        </Modal>
      )}
    </main>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[var(--st-atencion-soft)] px-4 py-3 text-sm leading-6 text-[var(--st-atencion-ink)]">
      <AlertTriangle className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}

function LastRun({ run }: { run: Record<string, unknown> }) {
  const demos = run.demos as { built?: number; failed?: number; skipped?: string } | undefined;
  const bounces = run.bounces as { checked?: number; bounced?: number; complained?: number; skipped?: string } | undefined;
  const send = run.send as { sent?: number; skipped?: string; waitingDemo?: number; outsideWindow?: number; stopped?: string | null } | undefined;
  const lines = [
    run.skipped ? `Saltada: ${String(run.skipped)}` : null,
    demos && (demos.skipped ? `Demos: ${demos.skipped}` : `Demos: ${demos.built ?? 0} armadas, ${demos.failed ?? 0} fallidas.`),
    bounces && (bounces.skipped ? `Rebotes: ${bounces.skipped}` : `Rebotes: ${bounces.checked ?? 0} revisados, ${bounces.bounced ?? 0} rebotados, ${bounces.complained ?? 0} quejas.`),
    send &&
      (send.skipped
        ? `Envío: ${send.skipped}`
        : `Envío: ${send.sent ?? 0} enviados${send.waitingDemo ? `, ${send.waitingDemo} esperan demo` : ""}${send.outsideWindow ? `, ${send.outsideWindow} fuera de horario` : ""}${send.stopped ? ` (se detuvo: ${send.stopped})` : ""}.`),
    run.error ? `Error: ${String(run.error)}` : null,
  ].filter(Boolean) as string[];
  return (
    <div className="mt-1 text-sm leading-6">
      <p className="text-[var(--ink-60)]">{when(typeof run.at === "string" ? run.at : null)}</p>
      <ul className="mt-2 grid gap-1">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-[600px] overflow-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-md)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Cerrar" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--ground-3)]" onClick={onClose} autoFocus>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

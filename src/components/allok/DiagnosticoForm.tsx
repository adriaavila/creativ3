"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AREAS, BUDGETS, diagnosticoWhatsapp } from "@/lib/diagnostico";
import { STORAGE_KEY } from "@/lib/signup-attribution";

/**
 * La solicitud de diagnóstico. Una sola pantalla, sin pasos: nombre, empresa,
 * correo, y lo demás opcional en fichas que se tocan. Al enviar, el
 * formulario se convierte en la confirmación; si nada quedó guardado, la
 * confirmación ofrece seguir por WhatsApp con el resumen ya escrito.
 */

type State = { kind: "idle" } | { kind: "busy" } | { kind: "done"; received: boolean; whatsapp: string } | { kind: "error"; message: string; whatsapp?: string };

const FIELD_ERRORS: Record<string, string> = {
  name: "Escribe tu nombre.",
  company: "Escribe el nombre de tu empresa.",
  email: "Ese correo no parece válido.",
  phone: "Revisa tu número de WhatsApp.",
};

const input =
  "min-h-12 w-full rounded-[12px] border border-[rgba(11,13,14,.16)] bg-white px-4 text-[16px] text-[var(--ink)] outline-none transition-[border-color] duration-200 placeholder:text-[var(--ink-40)] focus:border-[var(--ink)]";

function origen(): string {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const o = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return [o.utm_source, o.utm_campaign, o.landing].filter(Boolean).join(" · ").slice(0, 120);
  } catch {
    return "";
  }
}

export default function DiagnosticoForm() {
  const [areas, setAreas] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [state, setState] = useState<State>({ kind: "idle" });

  function toggle(id: string) {
    setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "busy") return;
    const f = new FormData(event.currentTarget);
    const body = {
      name: String(f.get("name") ?? ""),
      company: String(f.get("company") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      website: String(f.get("website") ?? ""),
      message: String(f.get("message") ?? ""),
      company_url: String(f.get("company_url") ?? ""),
      areas,
      budget: budget || undefined,
      source: origen(),
    };
    const fallback = diagnosticoWhatsapp({ ...body, areas: areas as never, budget: body.budget as never });
    setState({ kind: "busy" });
    const res = await fetch("/api/diagnostico", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { received?: boolean; whatsapp?: string; error?: { code?: string; field?: string } } | null;
    if (res?.ok) {
      setState({ kind: "done", received: Boolean(data?.received), whatsapp: data?.whatsapp ?? fallback });
      return;
    }
    if (data?.error?.code === "invalid") {
      setState({ kind: "error", message: FIELD_ERRORS[data.error.field ?? ""] ?? "Revisa los datos e intenta de nuevo." });
      return;
    }
    setState({
      kind: "error",
      message: data?.error?.code === "rate_limited" ? "Ya recibimos varias solicitudes tuyas hoy." : "No pudimos enviar tu solicitud.",
      whatsapp: data?.whatsapp ?? fallback,
    });
  }

  if (state.kind === "done") {
    return (
      <div role="status" className="allok-on-paper grid content-center gap-5 rounded-[24px] bg-white p-8 text-[var(--ink)] sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--ok)]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 className="display-sm text-[clamp(1.5rem,2.4vw,2rem)]">
          {state.received ? "Listo. Te escribimos en menos de un día hábil." : "Casi listo: falta un paso."}
        </h3>
        <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-[var(--ink-60)]">
          {state.received
            ? "Revisamos tu negocio antes de hablar, para que la primera conversación ya traiga ideas concretas. Si quieres adelantar, escríbenos por WhatsApp."
            : "No pudimos guardar tu solicitud. Mándanosla por WhatsApp: ya va escrita, solo tienes que enviarla."}
        </p>
        <a href={state.whatsapp} className="allok-btn w-fit bg-[var(--ink)] font-semibold text-[var(--cloud)]">
          {state.received ? "Escribir por WhatsApp" : "Enviar por WhatsApp"}
        </a>
      </div>
    );
  }

  const busy = state.kind === "busy";

  return (
    <form onSubmit={submit} noValidate={false} className="allok-on-paper grid gap-5 rounded-[24px] bg-white p-5 text-[var(--ink)] sm:p-8" aria-label="Solicitar diagnóstico">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tu nombre">
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Ana Pérez" className={input} disabled={busy} />
        </Field>
        <Field label="Empresa">
          <input name="company" required minLength={2} maxLength={160} autoComplete="organization" placeholder="Clínica Sol" className={input} disabled={busy} />
        </Field>
        <Field label="Correo">
          <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="ana@clinicasol.com" className={input} disabled={busy} />
        </Field>
        <Field label="WhatsApp" hint="opcional">
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="+52 55 1234 5678" className={input} disabled={busy} />
        </Field>
      </div>
      <Field label="Tu web" hint="opcional">
        <input name="website" maxLength={300} inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="clinicasol.com" className={input} disabled={busy} />
      </Field>

      <fieldset className="grid gap-2.5">
        <legend className="mono mb-2.5 text-[var(--ink-60)]">Qué quieres mejorar</legend>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip key={a.id} on={areas.includes(a.id)} onClick={() => toggle(a.id)} disabled={busy}>
              {a.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2.5">
        <legend className="mono mb-2.5 text-[var(--ink-60)]">Inversión que tienes en mente</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {BUDGETS.map((b) => (
            <Chip key={b.id} on={budget === b.id} role="radio" onClick={() => setBudget(budget === b.id ? "" : b.id)} disabled={busy}>
              {b.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Cuéntanos qué te quita tiempo o dinero" hint="opcional">
        <textarea
          name="message"
          rows={3}
          maxLength={2000}
          placeholder="Ej.: atendemos 200 mensajes al día a mano y perdemos citas por no contestar rápido."
          className={`${input} min-h-[96px] resize-y py-3 leading-relaxed`}
          disabled={busy}
        />
      </Field>

      {/* Trampa: una persona nunca la ve ni la llena. */}
      <input name="company_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

      {state.kind === "error" ? (
        <p role="alert" className="text-[14.5px] leading-relaxed text-[var(--dusk)]">
          {state.message}{" "}
          {state.whatsapp ? (
            <a href={state.whatsapp} className="font-semibold text-[var(--ink)] underline underline-offset-2">
              Envíala por WhatsApp
            </a>
          ) : null}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="submit" disabled={busy} className="allok-btn bg-[var(--ink)] font-semibold text-[var(--cloud)] disabled:opacity-60">
          {busy ? "Enviando…" : "Solicitar diagnóstico"}
        </button>
        <p className="text-[13.5px] text-[var(--ink-60)]">Sin costo. Respondemos en un día hábil.</p>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="mono text-[var(--ink-60)]">
        {label}
        {hint ? <span className="ml-2 normal-case tracking-normal opacity-70">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}

function Chip({ on, onClick, disabled, role, children }: { on: boolean; onClick: () => void; disabled?: boolean; role?: "radio"; children: ReactNode }) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : on}
      aria-checked={role ? on : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-full border px-4 text-[14.5px] transition-[background-color,border-color,color] duration-200 ${
        on ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--cloud)]" : "border-[rgba(11,13,14,.16)] bg-white text-[var(--ink)] hover:border-[rgba(11,13,14,.4)]"
      }`}
    >
      {children}
    </button>
  );
}

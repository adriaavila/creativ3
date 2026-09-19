"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  FlaskConical,
  GitBranch,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  XCircle,
} from "lucide-react";
import type { EveAgentCatalog, EveMode } from "@/lib/eve-agent-catalog";

type AgentsClientProps = { catalog: EveAgentCatalog | null };

const MODES: Array<{
  id: EveMode;
  label: string;
  description: string;
  tone: string;
}> = [
  { id: "simulation", label: "Simulación", description: "Evalúa respuestas con datos controlados.", tone: "bg-[var(--ground-3)] text-[var(--ink-60)]" },
  { id: "shadow", label: "Shadow", description: "Observa conversaciones sin responder.", tone: "bg-[var(--warn-soft)] text-[var(--status-warn)]" },
  { id: "approval", label: "Aprobación", description: "Propone; una persona revisa antes de actuar.", tone: "bg-[var(--assist-soft)] text-[var(--assist-ink)]" },
  { id: "production", label: "Producción", description: "Responde en vivo con controles adicionales.", tone: "bg-[var(--risk-soft)] text-[var(--status-risk)]" },
];

function SetupState() {
  return (
    <main className="min-h-dvh bg-[var(--ground-2)] p-6 text-[var(--ink)] md:p-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--rule)] bg-white p-8 shadow-[var(--shadow-md)]">
        <div className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--ground-3)] text-[var(--ink-60)]"><LockKeyhole className="size-5" /></div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-60)]">Agentes Eve</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">Configura el acceso de Ops</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-60)]">Esta vista requiere la sesión de operador. El agente se lee desde el repositorio y no se modifica desde el navegador.</p>
      </div>
    </main>
  );
}

function Status({ ok, yes = "Listo", no = "Pendiente" }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-[var(--assist-ink)]" : "text-[var(--status-warn)]"}`}>
      <span className={`size-1.5 rounded-full ${ok ? "bg-[var(--assist)]" : "bg-[var(--warn-mid)]"}`} aria-hidden="true" />
      {ok ? yes : no}
    </span>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: typeof Bot; eyebrow: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ground-3)] text-[var(--ink-60)]"><Icon className="size-4" strokeWidth={1.8} /></span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ink-40)]">{eyebrow}</p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</h2>
      </div>
    </div>
  );
}

export default function AgentsClient({ catalog }: AgentsClientProps) {
  const [selectedMode, setSelectedMode] = useState<EveMode>("approval");

  if (!catalog) return <SetupState />;

  const selectedModeInfo = MODES.find((mode) => mode.id === selectedMode) ?? MODES[2];

  return (
    <main className="min-h-dvh bg-[var(--ground-2)] pb-12 text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[1450px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-60)]"><Bot className="size-4 text-[var(--ink-60)]" /> Agentes</div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-5xl">Eve para operaciones</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-60)]">Define agentes como archivos versionados: instrucciones, herramientas, canales, especialistas, horarios y evaluaciones.</p>
          </div>
          <Link href="/ops/lab" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--rule)] bg-white px-4 text-sm font-semibold text-[var(--ink-60)] shadow-[var(--shadow-sm)] transition hover:border-[var(--rule)] hover:bg-[var(--ground-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]">
            <FlaskConical className="size-4" /> Ver observabilidad <ChevronRight className="size-4" />
          </Link>
        </header>

        <div className="mt-8 grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_310px]">
          <aside className="rounded-2xl border border-[var(--rule)] bg-white p-3 shadow-[var(--shadow-md)]" aria-label="Lista de agentes">
            <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ink-40)]">Agentes configurados</p>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--ground-3)] p-3">
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ink-40)] text-white"><Sparkles className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--ink)]">{catalog.agent.name}</p><p className="mt-0.5 text-[11px] text-[var(--ink-60)]">{catalog.agent.packageVersion ? `v${catalog.agent.packageVersion}` : "Versión no declarada"}</p></div></div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--assist-ink)]"><span className="size-1.5 rounded-full bg-[var(--assist)]" /> Descubierto desde archivos</div>
            </div>
            <div className="mt-5 border-t border-[var(--hairline)] pt-4">
              <Link href="#crear-agente" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--ink-60)] transition hover:bg-[var(--ground-3)] hover:text-[var(--ink)]">Crear un agente <ChevronRight className="size-4" /></Link>
              <Link href="#seguridad" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--ink-60)] transition hover:bg-[var(--ground-3)] hover:text-[var(--ink)]">Guardrails <ChevronRight className="size-4" /></Link>
            </div>
          </aside>

          <section className="space-y-5" aria-label="Configuración del agente">
            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--ground-3)] text-[var(--ink-60)]"><Bot className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold tracking-[-0.03em]">{catalog.agent.name}</h2><span className="rounded-full bg-[var(--ground-3)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-60)]">Eve</span></div><p className="mt-1 text-sm text-[var(--ink-60)]">{catalog.agent.description}</p></div></div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--assist-line)] bg-[var(--assist-soft)] px-3 py-1.5 text-xs font-medium text-[var(--assist-ink)]"><span className="size-1.5 rounded-full bg-[var(--assist)]" /> Catálogo sincronizado</div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-40)]">Runtime</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{catalog.runtime.packageVersion ? `Eve ${catalog.runtime.packageVersion}` : "Eve detectado"}</p><Status ok={Boolean(catalog.runtime.packageVersion)} /></div>
                <div className="rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-40)]">Modelo</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{catalog.runtime.model}</p><Status ok={catalog.runtime.modelCredentialConfigured} yes="Credencial disponible" no="Revisar credencial" /></div>
                <div className="rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-40)]">Canal</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{catalog.channels[0]?.label ?? "Eve HTTP"}</p><Status ok={catalog.runtime.channelAuthConfigured} yes="Auth configurada" no="Auth local / pendiente" /></div>
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-6" id="modos">
              <div className="flex flex-wrap items-end justify-between gap-3"><SectionTitle icon={ShieldCheck} eyebrow="Control operativo" title="Modos de operación" /><span className="text-xs text-[var(--ink-40)]">Vista informativa · no cambia el runtime</span></div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {MODES.map((mode) => {
                  const selected = mode.id === selectedMode;
                  return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)] ${selected ? "border-[var(--rule)] bg-[var(--ground-3)]" : "border-[var(--hairline)] bg-[var(--ground-2)] hover:border-[var(--rule)]"}`}><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${mode.tone}`}>{mode.label}</span>{mode.id === "approval" && <span className="text-[10px] font-semibold text-[var(--assist-ink)]">Recomendado</span>}</div><p className="mt-3 text-xs leading-5 text-[var(--ink-60)]">{mode.description}</p></button>;
                })}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-3 text-xs leading-5 text-[var(--ink-60)]"><CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--status-warn)]" /><p><span className="font-semibold text-[var(--ink)]">{selectedModeInfo.label}:</span> {selectedModeInfo.description} La selección es una guía de diseño; el panel no envía mensajes ni cambia la configuración de Eve.</p></div>
            </article>

            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-6" id="instrucciones">
              <SectionTitle icon={BookOpen} eyebrow="Identidad" title="Instrucciones del agente" />
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-40)]">{catalog.agent.instructionsPath}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-60)]">{catalog.agent.instructionsPreview}</p></div>
                <div id="seguridad"><p className="text-xs font-semibold text-[var(--ink)]">Guardrails visibles</p><ul className="mt-3 space-y-2.5">{catalog.agent.guardrails.map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-[var(--ink-60)]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--assist-ink)]" /> {item}</li>)}</ul></div>
              </div>
            </article>

            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><SectionTitle icon={Wrench} eyebrow="Capacidades" title={`Herramientas · ${catalog.tools.length}`} /><div className="mt-4 space-y-2">{catalog.tools.map((tool) => <div key={tool.sourcePath} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--hairline)] px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[var(--ink)]">{tool.label}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--ink-60)]">{tool.description}</p></div>{tool.status === "disabled" ? <XCircle className="size-4 shrink-0 text-[var(--status-risk)]" aria-label="Deshabilitada" /> : <CheckCircle2 className="size-4 shrink-0 text-[var(--assist-ink)]" aria-label="Habilitada" />}</div>)}</div></article>
              <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><SectionTitle icon={MessageSquareText} eyebrow="Orquestación" title={`Subagentes · ${catalog.subagents.length}`} /><div className="mt-4 space-y-3">{catalog.subagents.map((subagent) => <div key={subagent.sourcePath} className="rounded-xl border border-[var(--hairline)] bg-[var(--ground-2)] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[var(--ink)]">{subagent.label}</p><span className="rounded-full bg-[var(--ground-3)] px-2 py-1 text-[10px] font-medium text-[var(--ink-60)]">{subagent.toolCount} herramientas</span></div><p className="mt-2 text-xs leading-5 text-[var(--ink-60)]">{subagent.description}</p><p className="mt-2 text-[10px] text-[var(--ink-40)]">{subagent.hasInstructions ? "Tiene instrucciones propias" : "Usa configuración mínima"}</p></div>)}</div></article>
            </div>

            <article className="rounded-2xl border border-[var(--assist-line)] bg-[var(--assist-soft)] p-5 shadow-[var(--shadow-md)] sm:p-6" id="crear-agente"><SectionTitle icon={Code2} eyebrow="Apartado exclusivo" title="Crear un agente Eve" /><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-60)]">Eve es filesystem-first: la identidad vive en archivos versionados. Para Growth, la puerta segura es crear primero un agente en modo aprobación, validar sus evals y observarlo antes de promoverlo.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[{ n: "01", title: "Define identidad", text: "Crea agent/agent.ts e instructions.md con una misión y límites explícitos." }, { n: "02", title: "Añade capacidades", text: "Agrega tools, subagents y channels solo cuando exista un caso real." }, { n: "03", title: "Escribe evals", text: "Cubre privacidad, evidencia y el comportamiento esperado." }, { n: "04", title: "Promueve con control", text: "Simulation → Shadow → Approval → Production, con observabilidad." }].map((step) => <div key={step.n} className="rounded-xl border border-[var(--assist-line)] bg-white/80 p-4"><span className="text-[10px] font-bold tracking-[0.14em] text-[var(--assist-ink)]">{step.n}</span><h3 className="mt-2 text-sm font-semibold text-[var(--ink)]">{step.title}</h3><p className="mt-2 text-xs leading-5 text-[var(--ink-60)]">{step.text}</p></div>)}</div><div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-60)]"><span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-[var(--ink-60)]"><GitBranch className="size-3.5" /> apps/growth-agent</span><span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2"><Terminal className="size-3.5" /> pnpm --dir apps/growth-agent eval --list</span><Link href="/ops/lab" className="inline-flex items-center gap-1 font-semibold text-[var(--ink-60)] hover:underline">Ver observabilidad <ChevronRight className="size-3.5" /></Link></div></article>
          </section>

          <aside className="space-y-5">
            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[var(--ink)]">Inventario Eve</h2><span className="text-[10px] text-[var(--ink-40)]">solo lectura</span></div><div className="mt-4 space-y-3">{[{ icon: Wrench, label: "Herramientas", value: catalog.tools.length }, { icon: MessageSquareText, label: "Subagentes", value: catalog.subagents.length }, { icon: CalendarClock, label: "Schedules", value: catalog.schedules.length }, { icon: FlaskConical, label: "Evaluaciones", value: catalog.evals.length }].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center justify-between border-b border-[var(--hairline)] pb-3 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-xs text-[var(--ink-60)]"><Icon className="size-4 text-[var(--ink-60)]" /> {label}</span><span className="text-sm font-semibold text-[var(--ink)]">{value}</span></div>)}</div></article>
            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><h2 className="text-sm font-semibold text-[var(--ink)]">Schedules descubiertos</h2><div className="mt-4 space-y-3">{catalog.schedules.map((schedule) => <div key={schedule.sourcePath}><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-[var(--ink-60)]">{schedule.label}</p><code className="text-[10px] text-[var(--ink-60)]">{schedule.cron ?? "sin cron"}</code></div><p className="mt-1 text-[11px] leading-4 text-[var(--ink-40)]">{schedule.description}</p></div>)}</div></article>
            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><h2 className="text-sm font-semibold text-[var(--ink)]">Canales descubiertos</h2><div className="mt-4 space-y-3">{catalog.channels.length ? catalog.channels.map((channel) => <div key={channel.sourcePath} className="border-b border-[var(--hairline)] pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-60)]"><MessageSquareText className="size-4 text-[var(--ink-60)]" /> {channel.label}</div><p className="mt-1 text-[11px] leading-4 text-[var(--ink-40)]">{channel.description}</p></div>) : <p className="text-xs text-[var(--ink-40)]">No hay canales declarados.</p>}</div></article>
            <article className="rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)]"><h2 className="text-sm font-semibold text-[var(--ink)]">Seguridad del panel</h2><div className="mt-4 space-y-3 text-xs leading-5 text-[var(--ink-60)]"><p className="flex gap-2"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-[var(--ink-60)]" /> La lectura ocurre en servidor después de authorizeOps().</p><p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--ink-60)]" /> Nunca se serializan secretos, tokens de continuación ni chain-of-thought.</p><p className="flex gap-2"><GitBranch className="mt-0.5 size-4 shrink-0 text-[var(--ink-60)]" /> El repositorio sigue siendo la fuente de verdad.</p></div></article>
          </aside>
        </div>
      </div>
    </main>
  );
}

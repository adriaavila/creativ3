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
  { id: "simulation", label: "Simulación", description: "Evalúa respuestas con datos controlados.", tone: "bg-[#eef3f8] text-[#526174]" },
  { id: "shadow", label: "Shadow", description: "Observa conversaciones sin responder.", tone: "bg-[#f4f1e8] text-[#7f6b39]" },
  { id: "approval", label: "Aprobación", description: "Propone; una persona revisa antes de actuar.", tone: "bg-[#eaf5de] text-[#4d6f29]" },
  { id: "production", label: "Producción", description: "Responde en vivo con controles adicionales.", tone: "bg-[#f5ecec] text-[#8a4e4e]" },
];

function SetupState() {
  return (
    <main className="min-h-dvh bg-[#f7f8fa] p-6 text-[#172238] md:p-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-[0_10px_35px_rgba(24,38,58,0.04)]">
        <div className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef3f8] text-[#385a78]"><LockKeyhole className="size-5" /></div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#738196]">Agentes Eve</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">Configura el acceso de Ops</h1>
        <p className="mt-3 text-sm leading-6 text-[#667386]">Esta vista requiere la sesión de operador. El agente se lee desde el repositorio y no se modifica desde el navegador.</p>
      </div>
    </main>
  );
}

function Status({ ok, yes = "Listo", no = "Pendiente" }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-[#50772f]" : "text-[#8a6a40]"}`}>
      <span className={`size-1.5 rounded-full ${ok ? "bg-[#9ac83c]" : "bg-[#d5a45e]"}`} aria-hidden="true" />
      {ok ? yes : no}
    </span>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: typeof Bot; eyebrow: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f4f7] text-[#48637d]"><Icon className="size-4" strokeWidth={1.8} /></span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8a96a5]">{eyebrow}</p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#172238]">{title}</h2>
      </div>
    </div>
  );
}

export default function AgentsClient({ catalog }: AgentsClientProps) {
  const [selectedMode, setSelectedMode] = useState<EveMode>("approval");

  if (!catalog) return <SetupState />;

  const selectedModeInfo = MODES.find((mode) => mode.id === selectedMode) ?? MODES[2];

  return (
    <main className="min-h-dvh bg-[#f7f8fa] pb-12 text-[#172238]">
      <div className="mx-auto w-full max-w-[1450px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#738196]"><Bot className="size-4 text-[#48637d]" /> Agentes</div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-[#172238] sm:text-5xl">Eve para operaciones</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7888]">Define agentes como archivos versionados: instrucciones, herramientas, canales, especialistas, horarios y evaluaciones.</p>
          </div>
          <Link href="/ops/lab" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dfe5eb] bg-white px-4 text-sm font-semibold text-[#385a78] shadow-[0_1px_2px_rgba(24,38,58,0.03)] transition hover:border-[#b9c8d6] hover:bg-[#fbfcfd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385a78]">
            <FlaskConical className="size-4" /> Abrir laboratorio <ChevronRight className="size-4" />
          </Link>
        </header>

        <div className="mt-8 grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_310px]">
          <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-[0_8px_28px_rgba(24,38,58,0.025)]" aria-label="Lista de agentes">
            <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8a96a5]">Agentes configurados</p>
            <div className="rounded-xl border border-[#dce6ee] bg-[#f4f7fa] p-3">
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#385a78] text-white"><Sparkles className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#172238]">{catalog.agent.name}</p><p className="mt-0.5 text-[11px] text-[#7b8797]">{catalog.agent.packageVersion ? `v${catalog.agent.packageVersion}` : "Versión no declarada"}</p></div></div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#547833]"><span className="size-1.5 rounded-full bg-[#9ac83c]" /> Descubierto desde archivos</div>
            </div>
            <div className="mt-5 border-t border-[#edf0f3] pt-4">
              <Link href="#crear-agente" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-[#607086] transition hover:bg-[#f5f7f9] hover:text-[#172238]">Crear un agente <ChevronRight className="size-4" /></Link>
              <Link href="#seguridad" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-[#607086] transition hover:bg-[#f5f7f9] hover:text-[#172238]">Guardrails <ChevronRight className="size-4" /></Link>
            </div>
          </aside>

          <section className="space-y-5" aria-label="Configuración del agente">
            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eef3f8] text-[#385a78]"><Bot className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold tracking-[-0.03em]">{catalog.agent.name}</h2><span className="rounded-full bg-[#eef3f8] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#526b83]">Eve</span></div><p className="mt-1 text-sm text-[#6c7888]">{catalog.agent.description}</p></div></div>
                <div className="flex items-center gap-2 rounded-full border border-[#e4ebdf] bg-[#f5faef] px-3 py-1.5 text-xs font-medium text-[#547833]"><span className="size-1.5 rounded-full bg-[#9ac83c]" /> Catálogo sincronizado</div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a96a5]">Runtime</p><p className="mt-2 text-sm font-semibold text-[#263850]">{catalog.runtime.packageVersion ? `Eve ${catalog.runtime.packageVersion}` : "Eve detectado"}</p><Status ok={Boolean(catalog.runtime.packageVersion)} /></div>
                <div className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a96a5]">Modelo</p><p className="mt-2 text-sm font-semibold text-[#263850]">{catalog.runtime.model}</p><Status ok={catalog.runtime.modelCredentialConfigured} yes="Credencial disponible" no="Revisar credencial" /></div>
                <div className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a96a5]">Canal</p><p className="mt-2 text-sm font-semibold text-[#263850]">{catalog.channels[0]?.label ?? "Eve HTTP"}</p><Status ok={catalog.runtime.channelAuthConfigured} yes="Auth configurada" no="Auth local / pendiente" /></div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)] sm:p-6" id="modos">
              <div className="flex flex-wrap items-end justify-between gap-3"><SectionTitle icon={ShieldCheck} eyebrow="Control operativo" title="Modos de operación" /><span className="text-xs text-[#8a96a5]">Vista informativa · no cambia el runtime</span></div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {MODES.map((mode) => {
                  const selected = mode.id === selectedMode;
                  return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385a78] ${selected ? "border-[#385a78] bg-[#f2f6fa]" : "border-[#edf0f3] bg-[#fbfcfd] hover:border-[#cad5df]"}`}><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${mode.tone}`}>{mode.label}</span>{mode.id === "approval" && <span className="text-[10px] font-semibold text-[#5a7e33]">Recomendado</span>}</div><p className="mt-3 text-xs leading-5 text-[#677487]">{mode.description}</p></button>;
                })}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#e9edf1] bg-[#fafbfc] p-3 text-xs leading-5 text-[#677487]"><CircleAlert className="mt-0.5 size-4 shrink-0 text-[#a47e42]" /><p><span className="font-semibold text-[#263850]">{selectedModeInfo.label}:</span> {selectedModeInfo.description} La selección es una guía de diseño; el panel no envía mensajes ni cambia la configuración de Eve.</p></div>
            </article>

            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)] sm:p-6" id="instrucciones">
              <SectionTitle icon={BookOpen} eyebrow="Identidad" title="Instrucciones del agente" />
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a96a5]">{catalog.agent.instructionsPath}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#536275]">{catalog.agent.instructionsPreview}</p></div>
                <div id="seguridad"><p className="text-xs font-semibold text-[#263850]">Guardrails visibles</p><ul className="mt-3 space-y-2.5">{catalog.agent.guardrails.map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-[#677487]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#75a038]" /> {item}</li>)}</ul></div>
              </div>
            </article>

            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><SectionTitle icon={Wrench} eyebrow="Capacidades" title={`Herramientas · ${catalog.tools.length}`} /><div className="mt-4 space-y-2">{catalog.tools.map((tool) => <div key={tool.sourcePath} className="flex items-start justify-between gap-3 rounded-lg border border-[#edf0f3] px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#263850]">{tool.label}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#788496]">{tool.description}</p></div>{tool.status === "disabled" ? <XCircle className="size-4 shrink-0 text-[#a77a67]" aria-label="Deshabilitada" /> : <CheckCircle2 className="size-4 shrink-0 text-[#75a038]" aria-label="Habilitada" />}</div>)}</div></article>
              <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><SectionTitle icon={MessageSquareText} eyebrow="Orquestación" title={`Subagentes · ${catalog.subagents.length}`} /><div className="mt-4 space-y-3">{catalog.subagents.map((subagent) => <div key={subagent.sourcePath} className="rounded-xl border border-[#edf0f3] bg-[#fbfcfd] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#263850]">{subagent.label}</p><span className="rounded-full bg-[#eef3f8] px-2 py-1 text-[10px] font-medium text-[#526b83]">{subagent.toolCount} herramientas</span></div><p className="mt-2 text-xs leading-5 text-[#677487]">{subagent.description}</p><p className="mt-2 text-[10px] text-[#8a96a5]">{subagent.hasInstructions ? "Tiene instrucciones propias" : "Usa configuración mínima"}</p></div>)}</div></article>
            </div>

            <article className="rounded-2xl border border-[#dce7d3] bg-[#f8fbf5] p-5 shadow-[0_8px_28px_rgba(24,38,58,0.02)] sm:p-6" id="crear-agente"><SectionTitle icon={Code2} eyebrow="Apartado exclusivo" title="Crear un agente Eve" /><p className="mt-3 max-w-3xl text-sm leading-6 text-[#61705b]">Eve es filesystem-first: la identidad vive en archivos versionados. Para este CRM, la puerta segura es crear primero un agente en modo aprobación y conectar WhatsApp oficial después de probar sus evals.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[{ n: "01", title: "Define identidad", text: "Crea agent/agent.ts e instructions.md con una misión y límites explícitos." }, { n: "02", title: "Añade capacidades", text: "Agrega tools, subagents y channels solo cuando exista un caso real." }, { n: "03", title: "Escribe evals", text: "Cubre no envío, privacidad, evidencia y el comportamiento esperado." }, { n: "04", title: "Promueve con control", text: "Simulation → Shadow → Approval → Production, con revisión humana." }].map((step) => <div key={step.n} className="rounded-xl border border-[#e2ecd9] bg-white/80 p-4"><span className="text-[10px] font-bold tracking-[0.14em] text-[#78a43b]">{step.n}</span><h3 className="mt-2 text-sm font-semibold text-[#263850]">{step.title}</h3><p className="mt-2 text-xs leading-5 text-[#687768]">{step.text}</p></div>)}</div><div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#687768]"><span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-[#526b83]"><GitBranch className="size-3.5" /> apps/growth-agent</span><span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2"><Terminal className="size-3.5" /> pnpm --dir apps/growth-agent eval --list</span><Link href="/ops/lab" className="inline-flex items-center gap-1 font-semibold text-[#385a78] hover:underline">Ver evaluaciones <ChevronRight className="size-3.5" /></Link></div></article>
          </section>

          <aside className="space-y-5">
            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[#263850]">Inventario Eve</h2><span className="text-[10px] text-[#8a96a5]">solo lectura</span></div><div className="mt-4 space-y-3">{[{ icon: Wrench, label: "Herramientas", value: catalog.tools.length }, { icon: MessageSquareText, label: "Subagentes", value: catalog.subagents.length }, { icon: CalendarClock, label: "Schedules", value: catalog.schedules.length }, { icon: FlaskConical, label: "Evaluaciones", value: catalog.evals.length }].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center justify-between border-b border-[#edf0f3] pb-3 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-xs text-[#677487]"><Icon className="size-4 text-[#72849a]" /> {label}</span><span className="text-sm font-semibold text-[#263850]">{value}</span></div>)}</div></article>
            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><h2 className="text-sm font-semibold text-[#263850]">Schedules descubiertos</h2><div className="mt-4 space-y-3">{catalog.schedules.map((schedule) => <div key={schedule.sourcePath}><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-[#526275]">{schedule.label}</p><code className="text-[10px] text-[#7a8797]">{schedule.cron ?? "sin cron"}</code></div><p className="mt-1 text-[11px] leading-4 text-[#8994a2]">{schedule.description}</p></div>)}</div></article>
            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><h2 className="text-sm font-semibold text-[#263850]">Canales descubiertos</h2><div className="mt-4 space-y-3">{catalog.channels.length ? catalog.channels.map((channel) => <div key={channel.sourcePath} className="border-b border-[#edf0f3] pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-2 text-xs font-semibold text-[#526275]"><MessageSquareText className="size-4 text-[#72849a]" /> {channel.label}</div><p className="mt-1 text-[11px] leading-4 text-[#8994a2]">{channel.description}</p></div>) : <p className="text-xs text-[#8994a2]">No hay canales declarados.</p>}</div></article>
            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_28px_rgba(24,38,58,0.025)]"><h2 className="text-sm font-semibold text-[#263850]">Seguridad del panel</h2><div className="mt-4 space-y-3 text-xs leading-5 text-[#677487]"><p className="flex gap-2"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#65809b]" /> La lectura ocurre en servidor después de authorizeOps().</p><p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#65809b]" /> Nunca se serializan secretos, tokens de continuación ni chain-of-thought.</p><p className="flex gap-2"><GitBranch className="mt-0.5 size-4 shrink-0 text-[#65809b]" /> El repositorio sigue siendo la fuente de verdad.</p></div></article>
          </aside>
        </div>
      </div>
    </main>
  );
}

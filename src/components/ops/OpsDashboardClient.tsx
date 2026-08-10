"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Inbox,
  MessageSquareReply,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useOpsRealtime } from "@/hooks/useOpsRealtime";
import type { OpsAction, OpsCommandCenter, OpsHealthStatus } from "@/lib/ops-command-center";

const COUNT_CARDS = [
  { key: "waitingReplies", label: "Esperan respuesta", detail: "Conversaciones entrantes", icon: MessageSquareReply, href: "/ops/inbox" },
  { key: "dueFollowUps", label: "Follow-ups vencidos", detail: "Acciones comerciales", icon: Clock3, href: "/ops/crm" },
  { key: "pendingApprovals", label: "Por aprobar", detail: "Borradores humanos", icon: FileCheck2, href: "/ops/growth?tab=drafts" },
  { key: "incidents", label: "Incidentes", detail: "Canales y entregas", icon: AlertTriangle, href: "/ops/crm?view=connections" },
] as const;

export default function OpsDashboardClient({ snapshot }: { snapshot: OpsCommandCenter }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const realtime = useOpsRealtime({ onReconnect: () => router.refresh() });
  const realtimeLabel = realtime.status === "connected"
    ? "Realtime conectado"
    : realtime.status === "reconnecting"
      ? "Reconectando"
      : realtime.status === "connecting"
        ? "Conectando"
        : realtime.status === "polling"
          ? "Actualización cada 15 s"
          : "Realtime offline";

  return (
    <main className="min-h-dvh bg-[#f7f8fa] px-4 py-7 text-[#142b4b] sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c7d90]">
              <span className={`size-2 rounded-full ${realtime.status === "connected" ? "bg-[#a8d52d] shadow-[0_0_0_4px_rgba(168,213,45,0.16)]" : "bg-[#aeb8c3]"}`} />
              {realtimeLabel}
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.055em] text-[#142b4b] sm:text-5xl">Hoy</h1>
            <p className="mt-2 text-sm capitalize text-[#647388]">{formatBusinessDate(snapshot.businessDate)}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="lg" className="h-11 border-[#dce2e8] bg-white px-4">
              <Link href="/ops/inbox"><Inbox data-icon="inline-start" /> Bandeja</Link>
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={refreshing}
              onClick={() => startTransition(() => router.refresh())}
              className="h-11 bg-[#142b4b] px-4 text-white hover:bg-[#203d5e]"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} /> Actualizar
            </Button>
          </div>
        </header>

        {snapshot.sourceErrors.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#ead9b3] bg-[#fffaf0] px-4 py-3 text-sm text-[#755b16]" role="status">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Datos no disponibles: {snapshot.sourceErrors.join(", ")}. Los demás módulos siguen mostrando valores reales.
          </div>
        )}

        <section aria-label="Trabajo pendiente" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COUNT_CARDS.map(({ key, label, detail, icon: Icon, href }) => {
            const value = snapshot.counts[key];
            const attention = value !== null && value > 0;
            return (
              <Card key={key} className="gap-3 rounded-[14px] bg-white py-5 shadow-none ring-[#e2e7ec]">
                <CardHeader className="px-5">
                  <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#667589]"><Icon className="size-4" /> {label}</CardTitle>
                  <CardAction><span className={`block size-2 rounded-full ${value === null ? "bg-[#aeb8c3]" : attention ? "bg-[#e38b37]" : "bg-[#9fc72a]"}`} /></CardAction>
                </CardHeader>
                <CardContent className="px-5">
                  <div className="font-display text-[34px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{value ?? "—"}</div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#748296]">
                    <span>{value === null ? "No disponible" : detail}</span>
                    <Link href={href} aria-label={`Abrir ${label}`} className="text-[#405b77] hover:text-[#142b4b]"><ArrowRight className="size-4" /></Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="mt-5 gap-0 rounded-[16px] bg-white py-0 shadow-none ring-[#e2e7ec]">
          <CardHeader className="border-b border-[#e8ecf0] px-6 py-5 sm:px-7">
            <CardTitle className="font-display text-xl font-semibold tracking-[-0.035em]">Necesita atención</CardTitle>
            <CardDescription>Una cola, priorizada por impacto y antigüedad.</CardDescription>
            <CardAction><Badge variant="secondary" className="bg-[#eef3f7] text-[#526174]">{snapshot.actions.length} visibles</Badge></CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {snapshot.actions.length === 0 ? (
              <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-[#68778a]"><CheckCircle2 className="size-5 text-[#8aaa27]" /> No hay acciones abiertas en las fuentes disponibles.</div>
            ) : snapshot.actions.map((item, index) => (
              <ActionRow key={item.id} action={item} last={index === snapshot.actions.length - 1} />
            ))}
          </CardContent>
        </Card>

        <section className="mt-5" aria-labelledby="pulse-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><h2 id="pulse-heading" className="font-display text-xl font-semibold tracking-[-0.035em]">Pulso comercial</h2><p className="mt-1 text-xs text-[#748296]">KPIs y objetivos del mes.</p></div>
            <Badge variant="outline" className="border-[#dce2e8] bg-white text-[#667589]">OKRs mensuales</Badge>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <PulseCard icon={TrendingUp} label="Conversaciones con próximo paso" value={formatPercent(snapshot.pulse.nextStepShare)} target="Meta 65%" progress={snapshot.pulse.nextStepShare === null ? null : Math.min(100, snapshot.pulse.nextStepShare / 65 * 100)} />
            <PulseCard icon={CalendarCheck2} label="Citas confirmadas" value={snapshot.pulse.citas === null ? "—" : String(snapshot.pulse.citas)} target="Meta 12" progress={snapshot.pulse.citas === null ? null : Math.min(100, snapshot.pulse.citas / 12 * 100)} />
            <PulseCard icon={Target} label="Pipeline ponderado" value={formatMoney(snapshot.pulse.weightedPipeline)} target="Valor × probabilidad" progress={null} />
          </div>
        </section>

        <Card className="mt-5 gap-0 rounded-[16px] bg-white py-0 shadow-none ring-[#e2e7ec]">
          <CardHeader className="border-b border-[#e8ecf0] px-6 py-4">
            <CardTitle className="font-display text-lg font-semibold">Salud del sistema</CardTitle>
            <CardDescription>Lecturas observacionales; no disparan pruebas ni mensajes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-0 px-0 sm:grid-cols-3">
            {snapshot.health.map((item, index) => (
              <div key={item.id} className={`flex items-center gap-3 px-6 py-5 ${index > 0 ? "border-t border-[#e8ecf0] sm:border-l sm:border-t-0" : ""}`}>
                <span className={`size-2.5 rounded-full ${healthColor(item.status)}`} />
                <span className="min-w-0"><strong className="block text-sm font-semibold">{item.label}</strong><span className="mt-1 block truncate text-xs text-[#748296]">{item.detail}</span></span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ActionRow({ action, last }: { action: OpsAction; last: boolean }) {
  return (
    <div className={`grid gap-3 px-6 py-5 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:px-7 ${last ? "" : "border-b border-[#edf0f3]"}`}>
      <div><Badge variant={action.kind === "incident" ? "destructive" : "secondary"} className={action.kind === "incident" ? undefined : "bg-[#eef3f7] text-[#526174]"}>{kindLabel(action.kind)}</Badge><time className="mt-2 block font-mono text-[10px] text-[#8a96a5]">{formatActionTime(action.occurredAt)}</time></div>
      <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[#172b43]">{action.title}</h3><p className="mt-1 text-xs leading-5 text-[#68778a]">{action.reason}</p></div>
      <Button asChild variant="outline" className="h-10 border-[#dce2e8] bg-white"><Link href={action.href}>{action.cta} <ArrowRight data-icon="inline-end" /></Link></Button>
    </div>
  );
}

function PulseCard({ icon: Icon, label, value, target, progress }: { icon: typeof Target; label: string; value: string; target: string; progress: number | null }) {
  return (
    <Card className="gap-4 rounded-[14px] bg-white py-5 shadow-none ring-[#e2e7ec]">
      <CardHeader className="px-5"><CardTitle className="flex items-center gap-2 text-xs font-semibold text-[#667589]"><Icon className="size-4" /> {label}</CardTitle><CardAction className="font-mono text-[10px] uppercase text-[#8a96a5]">{target}</CardAction></CardHeader>
      <CardContent className="px-5"><div className="font-display text-3xl font-semibold tracking-[-0.045em] tabular-nums">{value}</div>{progress !== null && <><Separator className="my-4" /><Progress value={progress} className="h-2 bg-[#edf1f4] [&_[data-slot=progress-indicator]]:bg-[#a8d52d]" /></>}</CardContent>
    </Card>
  );
}

function formatBusinessDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "full", timeZone: "America/Caracas" }).format(new Date(`${value}T12:00:00-04:00`));
}

function formatActionTime(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Caracas" }).format(new Date(value));
}

function formatPercent(value: number | null) { return value === null ? "—" : `${value}%`; }
function formatMoney(value: number | null) { return value === null ? "—" : new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value); }
function healthColor(status: OpsHealthStatus) { return status === "healthy" ? "bg-[#9fc72a]" : status === "unhealthy" ? "bg-[#d95f59]" : "bg-[#aeb8c3]"; }
function kindLabel(kind: OpsAction["kind"]) { return kind === "reply" ? "Responder" : kind === "follow_up" ? "Follow-up" : kind === "approval" ? "Aprobar" : kind === "proposal" ? "Propuesta" : "Incidente"; }

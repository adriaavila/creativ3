"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Key,
  LoaderCircle,
  Play,
  Server,
  Webhook,
  XCircle,
  AlertCircle,
  FileText,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import type { WhatsAppConnectionView } from "@/lib/whatsapp-connections-db";
import type { GrowthLead } from "@/lib/growth-types";
import type { GrowthPromptInfo } from "@/lib/growth-prompts";
import GrowthOutreachPanel from "@/components/ops/GrowthOutreachPanel";

type DiagnosticsResult = {
  env: Record<string, boolean>;
  database: { ok: boolean; error: string };
  growthAgent: { ok: boolean; error: string; statusText: string };
  n8n: { ok: boolean; error: string; statusText: string };
  callbackUrl: { ok: boolean; error: string; statusText: string };
  metaVersion: string;
} | null;

type OpsDashboardClientProps = {
  stats: {
    leadsCount: number;
    draftsCount: number;
    runsCount: number;
  };
  initialWhatsAppConnections: WhatsAppConnectionView[];
  initialWhatsAppConnectionsError: string | null;
  initialGrowthLeads: GrowthLead[];
  growthPrompts: GrowthPromptInfo[];
};

export default function OpsDashboardClient({
  stats,
  initialWhatsAppConnections,
  initialWhatsAppConnectionsError,
  initialGrowthLeads,
  growthPrompts,
}: OpsDashboardClientProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticsResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [whatsappConnections, setWhatsAppConnections] = useState(initialWhatsAppConnections);
  const [whatsappConnectionsError, setWhatsAppConnectionsError] = useState(
    initialWhatsAppConnectionsError,
  );
  const [refreshingWhatsApp, setRefreshingWhatsApp] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/diagnose", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Diagnostics failed with status ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const refreshWhatsAppConnections = async () => {
    setRefreshingWhatsApp(true);
    setWhatsAppConnectionsError(null);
    try {
      const response = await fetch("/api/ops/whatsapp-connections", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`La consulta respondió con estado ${response.status}`);
      }
      const data = (await response.json()) as { connections: WhatsAppConnectionView[] };
      setWhatsAppConnections(data.connections);
    } catch (refreshError) {
      setWhatsAppConnectionsError(
        refreshError instanceof Error
          ? refreshError.message
          : "No se pudo actualizar la lista.",
      );
    } finally {
      setRefreshingWhatsApp(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1711] px-4 py-5 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">
                Panel de Administración
              </div>
              <h1 className="mt-1 font-display text-3xl">Creativv Systems Ops</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-run-diagnostics"
              type="button"
              disabled={running}
              onClick={runDiagnostics}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#dbe9c3] px-5 text-sm font-semibold text-[#172016] transition hover:bg-white disabled:opacity-50"
            >
              {running ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Activity className="size-4" />
              )}
              Ejecutar Diagnóstico
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

        {/* Overview Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Leads Investigados",
              value: stats.leadsCount,
              desc: "Prospectos calificados en base de datos",
            },
            {
              label: "Borradores Pendientes",
              value: stats.draftsCount,
              desc: "Mensajes listos para revisión manual",
            },
            {
              label: "Historial de Runs",
              value: stats.runsCount,
              desc: "Sesiones de adquisición ejecutadas",
            },
            {
              label: "Números WhatsApp",
              value: whatsappConnections.filter(
                (connection) => connection.status !== "deauthorized",
              ).length,
              desc: "Conexiones registradas por Embedded Signup",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:border-white/15"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                {item.label}
              </div>
              <div className="mt-3 font-display text-4xl text-[#dbe9c3]">{item.value}</div>
              <p className="mt-2 text-xs text-white/50">{item.desc}</p>
            </div>
          ))}
        </section>

        <GrowthOutreachPanel initialLeads={initialGrowthLeads} prompts={growthPrompts} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main Console & Diagnostic Output */}
          <div className="space-y-6">
            {/* Action Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:bg-white/[0.05]">
                <div>
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[#a9c989]/10 text-[#a9c989]">
                    <Play className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-xl">Growth OS Agent Console</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Administra los prospectos, revisa borradores de DM/Email/WhatsApp,
                    aprueba copias comerciales generadas por el agente de IA Eve y
                    monitorea ejecuciones de búsqueda.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    id="lnk-growth-os"
                    href="/ops/growth"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#dbe9c3] transition hover:text-white"
                  >
                    Abrir consola de crecimiento <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:bg-white/[0.05]">
                <div>
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[#a9c989]/10 text-[#a9c989]">
                    <Webhook className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-xl">WhatsApp Embedded Signup</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Configuración de Meta para integración de WhatsApp como Tech Provider.
                    Administra webhooks, intercambio de tokens a través de n8n,
                    y registros de números de teléfono.
                  </p>
                </div>
                <div className="mt-6">
                  <a
                    href="#whatsapp-connections"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#dbe9c3] transition hover:text-white"
                  >
                    Ver números conectados <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </div>

            <section
              id="whatsapp-connections"
              className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-5 text-[#a9c989]" />
                    <h2 className="font-display text-xl">Números conectados</h2>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    Inventario persistente de números autorizados mediante coexistencia.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={refreshWhatsAppConnections}
                    disabled={refreshingWhatsApp}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`size-4 ${refreshingWhatsApp ? "animate-spin" : ""}`}
                    />
                    Actualizar
                  </button>
                  <Link
                    href="/embedded-whatsapp"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#dbe9c3] px-4 text-sm font-semibold text-[#172016] transition hover:bg-white"
                  >
                    Conectar otro número <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {whatsappConnectionsError && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  <AlertCircle className="size-5 shrink-0" />
                  {whatsappConnectionsError}
                </div>
              )}

              {whatsappConnections.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
                  <p className="text-sm text-white/55">Todavía no hay números conectados.</p>
                  <Link
                    href="/embedded-whatsapp"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#dbe9c3] hover:text-white"
                  >
                    Iniciar el primer onboarding <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-3 font-medium">Número</th>
                        <th className="px-3 py-3 font-medium">Nombre verificado</th>
                        <th className="px-3 py-3 font-medium">Estado</th>
                        <th className="px-3 py-3 font-medium">Calidad</th>
                        <th className="px-3 py-3 font-medium">WABA</th>
                        <th className="px-3 py-3 font-medium">Conectado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatsappConnections.map((connection) => (
                        <tr
                          key={`${connection.wabaId}:${connection.phoneNumberId}`}
                          className="border-b border-white/[0.06] last:border-0"
                        >
                          <td className="px-3 py-4">
                            <div className="font-semibold text-white">
                              {connection.displayPhoneNumber ?? "Pendiente de Meta"}
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-white/35">
                              ID {connection.phoneNumberId}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-white/65">
                            {connection.verifiedName ?? "Sin nombre verificado"}
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                connection.status === "deauthorized"
                                  ? "bg-red-500/10 text-red-300"
                                  : "bg-[#a9c989]/10 text-[#bfe39b]"
                              }`}
                            >
                              {connection.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-white/65">
                            {connection.qualityRating ?? "Sin dato"}
                          </td>
                          <td className="px-3 py-4 font-mono text-[11px] text-white/45">
                            {connection.wabaId}
                          </td>
                          <td className="px-3 py-4 text-white/55">
                            {formatConnectionDate(connection.connectedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Diagnostics Report */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-display text-lg">Estado de Conectividad</h3>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  {results ? "Reporte activo" : "Requiere escaneo"}
                </span>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  <AlertCircle className="size-5 shrink-0" />
                  <div>
                    <span className="font-semibold">Error al diagnosticar:</span> {error}
                  </div>
                </div>
              )}

              {!results && !running && !error && (
                <div className="mt-6 py-10 text-center text-sm text-white/40">
                  Haz clic en <span className="text-[#dbe9c3] font-semibold">&quot;Ejecutar Diagnóstico&quot;</span> para comprobar la conexión con la base de datos, el agente de IA Eve y n8n.
                </div>
              )}

              {running && (
                <div className="mt-6 flex flex-col items-center justify-center py-10 text-sm text-white/50">
                  <LoaderCircle className="size-8 animate-spin text-[#a9c989]" />
                  <span className="mt-4 font-mono text-xs">Pingeando servidores y servicios...</span>
                </div>
              )}

              {results && (
                <div className="mt-6 space-y-4">
                  {/* Neon Database */}
                  <div className="flex items-start justify-between rounded-xl bg-white/[0.02] p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[#a9c989]">
                        <Database className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Neon Serverless Database</div>
                        <div className="text-xs text-white/50">Conexión directa Postgres por pooler HTTP</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.database.ok ? (
                        <>
                          <span className="font-mono text-xs text-[#a9c989]">{results.database.error}</span>
                          <CheckCircle2 className="size-5 text-[#a9c989]" />
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-red-400 max-w-[200px] truncate" title={results.database.error}>
                            {results.database.error}
                          </span>
                          <XCircle className="size-5 text-red-400" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Growth Agent */}
                  <div className="flex items-start justify-between rounded-xl bg-white/[0.02] p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[#a9c989]">
                        <Server className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Growth Agent Runtime</div>
                        <div className="text-xs text-white/50">Runtime configurable: Eve o Hermes Agent</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.growthAgent.ok ? (
                        <>
                          <span className="font-mono text-xs text-[#a9c989]">{results.growthAgent.statusText}</span>
                          <CheckCircle2 className="size-5 text-[#a9c989]" />
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-red-400 max-w-[200px] truncate" title={results.growthAgent.error || results.growthAgent.statusText}>
                            {results.growthAgent.error || results.growthAgent.statusText}
                          </span>
                          <XCircle className="size-5 text-red-400" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* n8n Webhook */}
                  <div className="flex items-start justify-between rounded-xl bg-white/[0.02] p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[#a9c989]">
                        <Webhook className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">n8n Workflow Webhook</div>
                        <div className="text-xs text-white/50">Recibe eventos de registro WABA y sincronizaciones</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.n8n.ok ? (
                        <>
                          <span className="font-mono text-xs text-[#a9c989]">{results.n8n.statusText}</span>
                          <CheckCircle2 className="size-5 text-[#a9c989]" />
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-red-400 max-w-[200px] truncate" title={results.n8n.error}>
                            {results.n8n.error}
                          </span>
                          <XCircle className="size-5 text-red-400" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Meta Webhook Callback */}
                  <div className="flex items-start justify-between rounded-xl bg-white/[0.02] p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[#a9c989]">
                        <Webhook className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Meta Callback Webhook URL</div>
                        <div className="text-xs text-white/50">Endpoint público de retorno HTTPS para Meta</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.callbackUrl.ok ? (
                        <>
                          <span className="font-mono text-xs text-[#a9c989]">{results.callbackUrl.statusText}</span>
                          <CheckCircle2 className="size-5 text-[#a9c989]" />
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-red-400 max-w-[200px] truncate" title={results.callbackUrl.error}>
                            {results.callbackUrl.error}
                          </span>
                          <XCircle className="size-5 text-red-400" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Env Status & Static Checklist */}
          <div className="space-y-6">
            {/* Env Status */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <Key className="size-4 text-[#a9c989]" />
                <h3 className="font-display text-md font-semibold">Variables de Entorno</h3>
              </div>
              <ul className="mt-4 space-y-3 font-mono text-xs">
                {[
                  { key: "DATABASE_URL", isOptional: false },
                  { key: "GROWTH_AGENT_URL", isOptional: false },
                  { key: "META_APP_ID", isOptional: false },
                  { key: "META_APP_SECRET", isOptional: false },
                  { key: "META_CONFIG_ID", isOptional: false },
                  { key: "N8N_WEBHOOK_URL", isOptional: false },
                  { key: "META_WEBHOOK_VERIFY_TOKEN", isOptional: false },
                  { key: "APP_URL", isOptional: false },
                  { key: "N8N_WEBHOOK_SECRET", isOptional: false },
                ].map((item) => {
                  const configured = results ? results.env[item.key] : true; // assume true before run
                  return (
                    <li key={item.key} className="flex items-center justify-between gap-4">
                      <span className="truncate text-white/70" title={item.key}>
                        {item.key}
                      </span>
                      {results ? (
                        configured ? (
                          <span className="rounded bg-[#a9c989]/10 px-1.5 py-0.5 text-[10px] text-[#a9c989]">
                            LISTO
                          </span>
                        ) : (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] ${item.isOptional ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                            {item.isOptional ? 'OPCIONAL' : 'FALTA'}
                          </span>
                        )
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20"></span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Checklist */}
            <div className="rounded-2xl border border-white/10 bg-[#0c120d] p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <FileText className="size-4 text-[#a9c989]" />
                <h3 className="font-display text-md font-semibold">Verificación Manual</h3>
              </div>
              <ul className="mt-4 space-y-4 text-xs text-white/70">
                <li className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-white/20 bg-transparent text-[#a9c989] focus:ring-[#a9c989]/30"
                    id="chk-1"
                  />
                  <label htmlFor="chk-1" className="leading-5">
                    App publicada y permisos aprobados (`whatsapp_business_management`, `whatsapp_business_messaging`).
                  </label>
                </li>
                <li className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-white/20 bg-transparent text-[#a9c989] focus:ring-[#a9c989]/30"
                    id="chk-2"
                  />
                  <label htmlFor="chk-2" className="leading-5">
                    Configuración de redirección OAuth e HTTPS habilitados en Meta Business.
                  </label>
                </li>
                <li className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-white/20 bg-transparent text-[#a9c989] focus:ring-[#a9c989]/30"
                    id="chk-3"
                  />
                  <label htmlFor="chk-3" className="leading-5">
                    El workflow `Meta Embedded Signup` en n8n está activo.
                  </label>
                </li>
                <li className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-white/20 bg-transparent text-[#a9c989] focus:ring-[#a9c989]/30"
                    id="chk-4"
                  />
                  <label htmlFor="chk-4" className="leading-5">
                    El daemon de Eve está corriendo y escuchando en el puerto local o de staging.
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatConnectionDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

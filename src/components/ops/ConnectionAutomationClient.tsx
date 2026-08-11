"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Loader2,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Users,
  Webhook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { previewTenantAutomation, type AutomationMode, type ModelTier, type TenantAutomationInput } from "@/lib/tenant-automation";
import { canRemoveConnection } from "@/lib/connection-removal";
import type { TenantBotConfig } from "@/lib/tenant-bot-config";
import { crmChannelStatusLabel, crmNameStatusLabel, crmQualityLabel } from "@/lib/crm-channels";
import type { WhatsAppConnectionActivity } from "@/lib/whatsapp-connections-db";

const RULES = [
  { key: "saludo", label: "Saludo", placeholder: "¡Hola! Gracias por escribir…" },
  { key: "servicios", label: "Servicios", placeholder: "Ofrecemos…" },
  { key: "precio", label: "Precio", placeholder: "Para cotizar necesito…" },
  { key: "cita", label: "Cita", placeholder: "Dime qué día y horario…" },
] as const;

export type AutomationConnectionView = {
  provider: "meta" | "waha";
  key: string;
  label: string;
  phone: string | null;
  status: string;
  client: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  connectionMode?: "META_CLOUD_API" | "META_COEXISTENCE";
  qualityRating?: string | null;
  nameStatus?: string | null;
  wabaId?: string;
  businessId?: string | null;
  businessTokenStored?: boolean;
  registeredAt?: string | null;
  webhookOverrideUri?: string | null;
  crmOrganizationId?: string | null;
  crmOrganizationName?: string | null;
  crmConnectedAt?: string | null;
};

type Props = {
  connection: AutomationConnectionView;
  activity: WhatsAppConnectionActivity;
  initialConfig: TenantBotConfig;
  pilotMode: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "No disponible";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(new Date(value));
}

function modeLabel(mode: AutomationMode) {
  if (mode === "automatic") return "Automático";
  if (mode === "approval") return "Aprobación";
  return "Desactivado";
}

export default function ConnectionAutomationClient({ connection, activity, initialConfig, pilotMode }: Props) {
  const [config, setConfig] = useState<TenantAutomationInput>({
    enabled: initialConfig.enabled,
    operatingMode: initialConfig.operatingMode,
    modelTier: initialConfig.modelTier,
    systemPrompt: initialConfig.systemPrompt,
    businessFacts: initialConfig.businessFacts,
    handoffNote: initialConfig.handoffNote,
    autoReplies: initialConfig.autoReplies,
  });
  const [saved, setSaved] = useState(config);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [removalOpen, setRemovalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removalConfirmation, setRemovalConfirmation] = useState("");
  const [externalCredentialsRemoved, setExternalCredentialsRemoved] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const preview = useMemo(() => testMessage.trim() ? previewTenantAutomation(testMessage, config) : null, [config, testMessage]);
  const channelStatus = crmChannelStatusLabel({ status: connection.status, official: connection.provider === "meta" });
  const handedToExternalApp = Boolean(connection.webhookOverrideUri);
  const removalReady = canRemoveConnection({
    confirmation: removalConfirmation,
    handedToExternalApp,
    externalCredentialsRemoved,
  });

  function setField<K extends keyof TenantAutomationInput>(key: K, value: TenantAutomationInput[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  function setReply(key: (typeof RULES)[number]["key"], value: string) {
    setConfig((current) => ({ ...current, autoReplies: { ...current.autoReplies, [key]: value } }));
    setNotice(null);
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/ops/whatsapp-connections/${encodeURIComponent(connection.key)}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json() as { config?: TenantBotConfig; error?: string };
      if (!response.ok || !data.config) throw new Error(data.error ?? "No se pudo guardar la automatización.");
      const next: TenantAutomationInput = {
        enabled: data.config.enabled,
        operatingMode: data.config.operatingMode,
        modelTier: data.config.modelTier,
        systemPrompt: data.config.systemPrompt,
        businessFacts: data.config.businessFacts,
        handoffNote: data.config.handoffNote,
        autoReplies: data.config.autoReplies,
      };
      setConfig(next);
      setSaved(next);
      setNotice({ kind: "success", text: "Configuración guardada para este número." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo guardar la automatización." });
    } finally {
      setSaving(false);
    }
  }

  async function removeConnection() {
    if (!removalReady) return;
    setRemoving(true);
    setRemovalError(null);
    try {
      const response = connection.provider === "meta"
        ? await fetch("/api/meta/embedded-signup/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number_id: connection.key, workspace: connection.client }),
          })
        : await fetch(`/api/ops/waha/sessions/${encodeURIComponent(connection.key)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar la conexión.");
      window.location.assign("/ops/crm?view=connections");
    } catch (error) {
      setRemovalError(error instanceof Error ? error.message : "No se pudo eliminar la conexión.");
      setRemoving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f7f8fa] pb-10 text-[#172238]">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <Link href="/ops/crm?view=connections" className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-[#64748b] hover:text-[#172238]">
          <ArrowLeft className="size-4" /> Volver a conexiones
        </Link>

        <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#172238] text-white shadow-sm"><MessageCircle className="size-5" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">{connection.provider === "meta" ? "Número oficial · Meta" : "Sesión de prueba · WAHA no oficial"}</p>
                <Badge className="bg-[#e9f5d7] text-[#4b6d24]">{channelStatus}</Badge>
              </div>
              <h1 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{connection.label}</h1>
              <p className="mt-2 font-mono text-sm text-[#64748b]">{connection.phone ?? connection.key}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#dfe5eb] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(20,43,75,0.04)]">
            <span className={`size-2.5 rounded-full ${config.enabled ? "bg-[#9bc53d]" : "bg-[#b8c1cb]"}`} />
            <div><p className="text-xs font-semibold">{config.enabled ? "Configuración activa" : "Configuración pausada"}</p><p className="mt-0.5 text-[11px] text-[#7a8797]">{modeLabel(config.operatingMode)}</p></div>
          </div>
        </header>

        <section className="mt-7 grid overflow-hidden rounded-xl border border-[#e2e7ed] bg-white sm:grid-cols-3" aria-label="Actividad del número">
          <Metric icon={Users} label="Conversaciones" value={activity.conversations} detail="históricas" />
          <Metric icon={MessagesSquare} label="Mensajes" value={activity.messages} detail="registrados" />
          <Metric icon={Clock3} label="Esperan respuesta" value={activity.waitingReplies} detail={activity.lastMessageAt ? `Último ${formatDate(activity.lastMessageAt)}` : "Sin actividad"} />
        </section>

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-[#dfe5eb] bg-white shadow-[0_12px_36px_rgba(20,43,75,0.05)]">
            <CardHeader className="border-b border-[#edf0f3]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><CardTitle className="flex items-center gap-2 text-xl text-[#172238]"><Bot className="size-5 text-[#526d87]" /> Automatización</CardTitle><CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-[#5f6f82]">Define cómo responde este número: reglas frecuentes, contexto del negocio y cuándo debe intervenir una persona.</CardDescription></div>
                <Badge variant="outline" className="border-[#cbd5df] bg-[#f7f9fb] font-mono text-[#40556d]">Reglas · IA · persona</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-7 p-5 sm:p-7">
              {connection.webhookOverrideUri && (
                <p className="rounded-xl border border-[#e6d9b8] bg-[#fffdf6] px-4 py-3 text-xs leading-5 text-[#7a6425]" role="status">
                  Los webhooks de este número van a {connection.crmOrganizationName ?? "otra app"}, así que allok no ve sus mensajes y esta configuración no responde. Sirve como respaldo si algún día se devuelve el webhook.
                </p>
              )}
              <div className="flex items-center justify-between gap-5 rounded-xl border border-[#dfe5eb] bg-[#fafbfc] p-4">
                <div className="max-w-2xl"><Label htmlFor="automation-enabled" className="text-sm font-semibold text-[#263b54]">Habilitar automatización</Label><p className="mt-1.5 text-sm leading-6 text-[#5f6f82]">Las reglas responden primero. La IA sólo atiende preguntas que no coincidan con una regla.</p></div>
                <Switch id="automation-enabled" checked={config.enabled} onCheckedChange={(checked) => setField("enabled", checked)} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Modo de operación" hint={config.operatingMode === "automatic" ? "Las conversaciones nuevas entran en IA; errores o dudas pasan a una persona." : "Las conversaciones nuevas permanecen con una persona."}>
                  <Select value={config.operatingMode} onValueChange={(value) => setField("operatingMode", value as AutomationMode)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="off">Desactivado</SelectItem><SelectItem value="approval">Aprobación humana</SelectItem><SelectItem value="automatic">Automático seguro</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Nivel del modelo" hint="Afecta sugerencias y respuestas automáticas; los modelos disponibles siguen una lista cerrada.">
                  <Select value={config.modelTier} onValueChange={(value) => setField("modelTier", value as ModelTier)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="fast">Rápido · menor costo</SelectItem><SelectItem value="balanced">Equilibrado · mayor criterio</SelectItem></SelectContent>
                  </Select>
                </Field>
              </div>

              <Separator />

              <div className="space-y-5">
                <Field label="Persona del asistente" hint="Tono, rol y límites. No incluyas secretos.">
                  <Textarea value={config.systemPrompt ?? ""} onChange={(event) => setField("systemPrompt", event.target.value)} rows={5} placeholder="Sos el asistente de…" />
                </Field>
                <Field label="Datos verificados del negocio" hint="Horarios, dirección, servicios, precios confirmados y políticas.">
                  <Textarea value={config.businessFacts ?? ""} onChange={(event) => setField("businessFacts", event.target.value)} rows={7} placeholder="Abrimos de lunes a sábado…" />
                </Field>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2"><Sparkles className="size-4 text-[#526d87]" /><h2 className="text-sm font-semibold text-[#263b54]">Respuestas automáticas</h2></div>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#5f6f82]">Estas respuestas tienen prioridad sobre la IA. Si dejas una vacía, ese caso pasa a una persona.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {RULES.map((rule) => <Field key={rule.key} label={rule.label}><Textarea rows={3} value={config.autoReplies[rule.key] ?? ""} onChange={(event) => setReply(rule.key, event.target.value)} placeholder={rule.placeholder} /></Field>)}
                </div>
              </div>

              <Field label="Frase de transferencia" hint="La IA usa esta frase al preparar una respuesta para revisión humana.">
                <Input value={config.handoffNote ?? ""} onChange={(event) => setField("handoffNote", event.target.value)} placeholder="Te paso con una persona del equipo." />
              </Field>

              <div className="rounded-xl border border-dashed border-[#cfd8e1] bg-[#fafbfc] p-4">
                <div className="flex items-center gap-2"><MessageSquareText className="size-4 text-[#526d87]" /><h2 className="text-sm font-semibold text-[#263b54]">Probar sin enviar</h2></div>
                <p className="mt-1 text-xs leading-5 text-[#6f7d8e]">Comprueba si el mensaje usaría una regla, IA o transferencia. No llama al modelo ni toca WhatsApp.</p>
                <Input className="mt-4" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} placeholder="Ej.: Hola, ¿cuánto cuesta y puedo agendar?" />
                {preview && <div className="mt-3 rounded-lg border border-[#e0e6ec] bg-white px-3 py-2.5 text-xs leading-5 text-[#526174]" role="status"><span className="font-semibold uppercase tracking-[0.08em] text-[#385a78]">{preview.kind}</span><span className="mx-2 text-[#a4afba]">·</span>{preview.label}{"reply" in preview && <p className="mt-2 border-t border-[#edf0f3] pt-2 text-[#263b54]">{preview.reply}</p>}</div>}
              </div>

              {notice && <p className={`rounded-lg border px-3 py-2.5 text-sm ${notice.kind === "success" ? "border-[#dcebc8] bg-[#f5faed] text-[#4b6d24]" : "border-[#f0caca] bg-[#fff5f5] text-[#9f4141]"}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] pt-5">
                <p className="text-xs text-[#7a8797]">{dirty ? "Cambios sin guardar" : "Configuración sincronizada"}</p>
                <Button onClick={() => void save()} disabled={saving || !dirty} size="lg" className="min-w-44 bg-[#c5f04a] text-[#142b4b] hover:bg-[#b7e63b]">
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Guardar configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="border-[#dfe5eb] bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-[#172238]"><Database className="size-4 text-[#526d87]" /> Datos de la conexión</CardTitle></CardHeader>
              <CardContent className="space-y-0 text-sm">
                <Fact label="Cliente" value={connection.client ?? "Sin cliente asignado"} />
                <Fact label="Proveedor" value={connection.provider === "meta" ? (connection.connectionMode === "META_COEXISTENCE" ? "Meta · Coexistencia" : "Meta · Cloud API") : "WAHA · no oficial"} />
                {connection.provider === "meta" && <Fact label="Calidad" value={crmQualityLabel(connection.qualityRating ?? null)} />}
                {connection.provider === "meta" && <Fact label="Nombre" value={crmNameStatusLabel(connection.nameStatus ?? null)} />}
                {connection.wabaId && <Fact label="WABA" value={connection.wabaId} mono />}
                <Fact label={connection.provider === "meta" ? "Phone number ID" : "Sesión"} value={connection.key} mono />
                <Fact label="Conectado" value={formatDate(connection.connectedAt)} />
                <Fact label="Sincronizado" value={formatDate(connection.lastSyncedAt)} />
                {connection.provider === "meta" && <Fact label="Registro" value={connection.registeredAt ? formatDate(connection.registeredAt) : "No requerido en coexistencia"} />}
              </CardContent>
            </Card>

            <Card className="border-[#dce7d3] bg-[#f8fbf5]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-[#30472a]"><ShieldCheck className="size-4 text-[#6f9632]" /> Límites de producción</CardTitle><CardDescription className="text-[#61705b]">El motor conserva cola, deduplicación, reintentos e idempotencia.</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-xs leading-5 text-[#61705b]">
                <p>{pilotMode ? "Piloto activo: ningún envío sale de la allowlist configurada." : "Producción: el canal puede responder a cualquier conversación entrante."}</p>
                <p>Las reglas visibles responden primero; la IA atiende únicamente los casos restantes.</p>
                <p>Un timeout del modelo cae al nivel rápido antes de fallar.</p>
              </CardContent>
            </Card>

            <Card className="border-[#e6e0ce] bg-[#fffdf6]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-[#5f481d]"><Webhook className="size-4 text-[#8b6b28]" /> CRM externo</CardTitle><CardDescription className="text-[#75683f]">{connection.crmConnectedAt ? "Meta entrega los eventos de esta WABA directamente al CRM." : "La conexión todavía usa el callback principal de Allok."}</CardDescription></CardHeader>
              <CardContent className="space-y-0">
                <Fact label="Estado" value={connection.crmConnectedAt ? "Conectado y verificado" : "Sin entregar"} />
                {connection.crmOrganizationName && <Fact label="Organización" value={connection.crmOrganizationName} />}
                {connection.crmOrganizationId && <Fact label="Organization ID" value={connection.crmOrganizationId} mono />}
                {connection.webhookOverrideUri && <Fact label="Callback" value={callbackHost(connection.webhookOverrideUri)} mono />}
                {connection.crmConnectedAt && <Fact label="Entregado" value={formatDate(connection.crmConnectedAt)} />}
                <Button variant="outline" asChild className="mt-4 w-full"><Link href="/ops/crm?view=connections">{connection.crmConnectedAt ? "Revisar entrega" : "Conectar al CRM"}</Link></Button>
              </CardContent>
            </Card>

            <section className="rounded-xl border border-[#edcccc] bg-[#fff8f7] p-5" aria-labelledby="remove-connection-title">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f7dedd] text-[#9b3f3a]"><TriangleAlert className="size-4" /></span>
                <div><h2 id="remove-connection-title" className="text-sm font-semibold text-[#7f302d]">Eliminar conexión</h2><p className="mt-1.5 text-xs leading-5 text-[#7b5a58]">Desconecta el proveedor, borra el token guardado y retira el número de Ops. Las conversaciones históricas se conservan.</p></div>
              </div>

              {!removalOpen ? (
                <Button variant="outline" onClick={() => setRemovalOpen(true)} className="mt-4 w-full border-[#dfb6b3] bg-white text-[#8f3834] hover:bg-[#fff0ef] hover:text-[#7f302d]"><Trash2 /> Eliminar conexión</Button>
              ) : (
                <div className="mt-4 space-y-4 border-t border-[#efd6d4] pt-4">
                  {handedToExternalApp && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white px-3 py-3 text-xs leading-5 text-[#684c4a]">
                      <input type="checkbox" checked={externalCredentialsRemoved} onChange={(event) => setExternalCredentialsRemoved(event.target.checked)} className="mt-0.5 size-4 accent-[#9b3f3a]" />
                      <span>Ya eliminé el token y la conexión en <strong>{connection.crmOrganizationName ?? "la app externa"}</strong>.</span>
                    </label>
                  )}
                  <Field label="Escribe ELIMINAR para confirmar" hint={connection.provider === "meta" && connection.connectionMode === "META_COEXISTENCE" ? "Tu número seguirá funcionando en la app WhatsApp Business; sólo se desconecta de Allok." : undefined}>
                    <Input value={removalConfirmation} onChange={(event) => setRemovalConfirmation(event.target.value)} autoComplete="off" />
                  </Field>
                  {removalError && <p className="text-xs leading-5 text-[#9b3f3a]" role="alert">{removalError}</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setRemovalOpen(false); setRemovalError(null); }} disabled={removing} className="flex-1 bg-white">Cancelar</Button>
                    <Button onClick={() => void removeConnection()} disabled={!removalReady || removing} className="flex-1 bg-[#9b3f3a] text-white hover:bg-[#842f2b]">{removing ? <Loader2 className="animate-spin" /> : <Trash2 />} Confirmar</Button>
                  </div>
                </div>
              )}
            </section>

            <Button variant="outline" asChild className="w-full"><Link href="/ops/inbox">Abrir Bandeja <ExternalLink /></Link></Button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2.5 [&_button[role=combobox]]:text-[#263b54] [&_input]:min-h-11 [&_input]:bg-white [&_input]:text-sm [&_input]:text-[#263b54] [&_textarea]:bg-white [&_textarea]:text-sm [&_textarea]:leading-6 [&_textarea]:text-[#263b54]"><Label className="text-sm font-semibold text-[#263b54]">{label}</Label>{children}{hint && <p className="max-w-2xl text-xs leading-5 text-[#627186]">{hint}</p>}</div>;
}

function callbackHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "Configurado";
  }
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: number; detail: string }) {
  return <div className="border-b border-[#e7ebf0] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a8797]">{label}</span><Icon className="size-4 text-[#526d87]" /></div><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 truncate text-xs text-[#7a8797]">{detail}</p></div>;
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#edf0f3] py-3 first:pt-0 last:border-0 last:pb-0"><span className="text-xs text-[#7a8797]">{label}</span><span className={`max-w-[220px] break-all text-right text-xs font-medium text-[#34445a] ${mono ? "font-mono" : ""}`}>{value}</span></div>;
}

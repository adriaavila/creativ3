"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Send } from "lucide-react";
import Link from "next/link";

type MessageTemplate = {
  name: string;
  language: string;
  category: string;
  bodyText: string;
  variableCount: number;
  headerText?: string;
};

type TemplateComponent = {
  type: "body";
  parameters: Array<{ type: "text"; text: string }>;
};

type TemplateComposerProps = {
  conversationId: number;
  channelKey: string;
  onSent?: () => void;
};

type CatalogState = "loading" | "ready" | "no-connection" | "empty" | "error";

const VARIABLE_PATTERN = /\{\{(\d+)\}\}/g;

function templateKey(template: MessageTemplate) {
  return `${template.name}:${template.language}`;
}

export function templateVariableIds(bodyText: string) {
  return [...new Set([...bodyText.matchAll(VARIABLE_PATTERN)].map((match) => match[1]))].sort(
    (left, right) => Number(left) - Number(right),
  );
}

export function buildTemplateComponents(
  bodyText: string,
  values: Record<string, string> | string[],
): TemplateComponent[] {
  const ids = templateVariableIds(bodyText);
  return [
    {
      type: "body",
      parameters: ids.map((id, index) => ({
        type: "text",
        text: (Array.isArray(values) ? values[index] : values[id])?.trim() ?? "",
      })),
    },
  ];
}

function previewBody(bodyText: string, values: Record<string, string>) {
  return bodyText.replace(VARIABLE_PATTERN, (_, id: string) => values[id]?.trim() || `{{${id}}}`);
}

function isMissingConnection(reason: string | undefined) {
  return Boolean(reason && /no hay una conexión oficial/i.test(reason));
}

export default function TemplateComposer({ conversationId, channelKey, onSent }: TemplateComposerProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [state, setState] = useState<CatalogState>("loading");
  const [reason, setReason] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deliveryUnconfirmed, setDeliveryUnconfirmed] = useState(false);
  const actionIdRef = useRef<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setState("loading");
    setReason(null);
    setSendError(null);

    if (!channelKey) {
      setState("no-connection");
      return;
    }

    try {
      const response = await fetch(`/api/ops/whatsapp/templates?connectionId=${encodeURIComponent(channelKey)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { templates?: MessageTemplate[]; reason?: string; error?: string };
      const nextTemplates = Array.isArray(data.templates) ? data.templates : [];

      if (!response.ok || data.error) {
        setReason(data.reason ?? data.error ?? "No se pudo cargar el catálogo de WhatsApp.");
        setState("error");
        return;
      }
      if (data.reason && isMissingConnection(data.reason)) {
        setReason(data.reason);
        setState("no-connection");
        return;
      }
      if (data.reason) {
        setReason(data.reason);
        setState("error");
        return;
      }
      if (nextTemplates.length === 0) {
        setState("empty");
        return;
      }

      setTemplates(nextTemplates);
      setSelectedKey((current) => nextTemplates.some((template) => templateKey(template) === current) ? current : templateKey(nextTemplates[0]));
      setState("ready");
    } catch {
      setReason("No se pudo contactar el catálogo de WhatsApp.");
      setState("error");
    }
  }, [channelKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTemplates(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTemplates]);

  const selected = templates.find((template) => templateKey(template) === selectedKey) ?? null;
  const variableIds = useMemo(() => (selected ? templateVariableIds(selected.bodyText) : []), [selected]);
  const preview = selected ? previewBody(selected.bodyText, values) : "";

  function selectTemplate(name: string) {
    actionIdRef.current = null;
    setDeliveryUnconfirmed(false);
    setSelectedKey(name);
    setValues({});
    setSendError(null);
  }

  async function sendTemplate() {
    if (!selected) return;
    const missing = variableIds.filter((id) => !values[id]?.trim());
    if (missing.length > 0) {
      setSendError(`Completa las variables ${missing.map((id) => `{{${id}}}`).join(", ")}.`);
      return;
    }

    setSending(true);
    setSendError(null);
    const actionId = actionIdRef.current ?? crypto.randomUUID();
    actionIdRef.current = actionId;
    let responseReceived = false;
    try {
      const response = await fetch(`/api/ops/inbox/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "send",
          actionId,
          template: {
            name: selected.name,
            languageCode: selected.language,
            components: buildTemplateComponents(selected.bodyText, values),
          },
        }),
      });
      responseReceived = true;
      const data = (await response.json()) as { error?: string; status?: string };
      if (response.status === 202 || data.status === "pending" || data.status === "unknown") {
        setDeliveryUnconfirmed(true);
        setSendError(data.error ?? "Entrega no confirmada; no reintentes esta plantilla.");
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "No se pudo enviar la plantilla.");
      actionIdRef.current = null;
      setDeliveryUnconfirmed(false);
      setValues({});
      onSent?.();
    } catch (error) {
      if (!responseReceived) setDeliveryUnconfirmed(true);
      setSendError(error instanceof Error ? error.message : "No se pudo enviar la plantilla.");
    } finally {
      setSending(false);
    }
  }

  if (state === "loading") {
    return <p className="flex items-center gap-2 text-xs text-[#7c8998]" role="status"><Loader2 className="size-3.5 animate-spin" /> Cargando plantillas aprobadas…</p>;
  }

  if (state === "no-connection") {
    return (
      <div className="space-y-2 rounded-[9px] border border-[#e7dfc5] bg-[#fffaf0] p-3 text-xs text-[#7c6b3f]" role="status">
        <p className="font-medium text-[#755b16]">Conecta WhatsApp oficial para usar plantillas.</p>
        <p>Necesitas un número Cloud API activo y una WABA con catálogo.</p>
        <Link href="/embedded-whatsapp" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#3f5f7b] px-3 font-medium text-[#3f5f7b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b] hover:bg-[#eef3f7]">
          Conectar WhatsApp oficial <ExternalLink className="size-3.5" />
        </Link>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="rounded-[9px] border border-[#e5e7eb] bg-white p-3 text-xs text-[#7c8998]" role="status">
        <p className="font-medium text-[#506176]">Esta WABA no tiene plantillas aprobadas.</p>
        <p className="mt-1">Crea y espera la aprobación de una plantilla en Meta para reabrir la conversación.</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-2 rounded-[9px] border border-[#f0caca] bg-[#fff5f5] p-3 text-xs text-[#a33b3b]" role="alert">
        <p>{reason ?? "No se pudo cargar el catálogo de WhatsApp."}</p>
        <button type="button" onClick={() => void loadTemplates()} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#e4b6b6] px-3 text-[#a33b3b] hover:bg-[#feecec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3f5f7b]">
          <RefreshCw className="size-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[9px] border border-[#e5e7eb] bg-[#fafbfc] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#47704d]">Plantilla oficial</p>
          <p className="mt-1 text-xs text-[#7c8998]">Solo plantillas aprobadas por Meta.</p>
        </div>
        <select
          value={selectedKey}
          onChange={(event) => selectTemplate(event.target.value)}
          aria-label="Seleccionar plantilla aprobada"
          className="min-h-10 max-w-full rounded-md border border-[#dfe5eb] bg-white px-2.5 text-xs text-[#172238] outline-none focus:border-[#3f5f7b]"
        >
          {templates.map((template) => <option key={templateKey(template)} value={templateKey(template)}>{template.name} · {template.language}</option>)}
        </select>
      </div>

      {selected && (
        <>
          <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2.5 text-xs leading-5 text-[#506176]" aria-label="Vista previa del cuerpo de la plantilla">
            {selected.headerText && <p className="mb-1 font-semibold text-[#172238]">{selected.headerText}</p>}
            <p className="whitespace-pre-wrap">{preview}</p>
          </div>
          {variableIds.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {variableIds.map((id) => (
                <label key={id} className="text-[11px] text-[#7c8998]">
                  Variable {`{{${id}}}`}
                  <input
                    value={values[id] ?? ""}
                    onChange={(event) => {
                      actionIdRef.current = null;
                      setDeliveryUnconfirmed(false);
                      setValues((current) => ({ ...current, [id]: event.target.value }));
                    }}
                    placeholder={`Texto para {{${id}}}`}
                    aria-label={`Texto para variable ${id}`}
                    className="mt-1 min-h-10 w-full rounded-md border border-[#dfe5eb] bg-white px-2.5 text-xs text-[#172238] outline-none placeholder:text-[#a2acb8] focus:border-[#3f5f7b]"
                  />
                </label>
              ))}
            </div>
          )}
          {sendError && <p className="text-xs text-[#a33b3b]" role="alert">{sendError}</p>}
          <button
            type="button"
            onClick={() => void sendTemplate()}
            disabled={sending || deliveryUnconfirmed}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#3f5f7b] px-3 text-xs font-semibold text-white transition hover:bg-[#2e4b65] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b] disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Enviar plantilla
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toWorkspaceSlug } from "@/lib/meta/onboarding-link";

/**
 * Builds the per-client Embedded Signup link an operator sends to a business
 * owner. The workspace slug in that URL becomes whatsapp_connections.client and
 * then the tenant key for that number's bot config — so it is picked here, once,
 * rather than typed by hand into a URL each time.
 */

const SLUG_MAX = 80;

export default function OnboardingLinkGenerator({
  cloudApiAvailable,
}: {
  cloudApiAvailable: boolean;
}) {
  const [name, setName] = useState("");
  const [cloudApi, setCloudApi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = useMemo(() => toWorkspaceSlug(name), [name]);

  const generate = async () => {
    if (!slug) return;
    setGenerating(true);
    setError(null);
    setUrl("");
    const response = await fetch("/api/ops/meta/onboarding-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: slug, mode: cloudApi ? "cloud_api" : "coexistence" }),
    });
    const result = await response.json().catch(() => ({}));
    setGenerating(false);
    if (!response.ok || typeof result.url !== "string") {
      setError(typeof result.error === "string" ? result.error : "No se pudo generar el enlace.");
      return;
    }
    setUrl(result.url);
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="onboarding-link"
      className="scroll-mt-6 rounded-none border border-white/10 bg-white/[0.015] p-6"
    >
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Link2 className="size-5 text-[#c5f04a]" />
        <h2 className="font-display text-xl">Enlace de onboarding por cliente</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/50">
        Genera el enlace que le mandas al dueño del negocio. El identificador queda
        guardado como dueño del número y es la clave con la que se configura su bot.
        El cliente puede abrirlo sin iniciar sesión en Ops.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Nombre del cliente
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setUrl("");
            }}
            placeholder="Panadería Rosa"
            maxLength={SLUG_MAX}
            className="mt-2 min-h-11 w-full rounded-none border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c5f04a]"
          />
          {slug && (
            <span className="mt-2 block font-mono text-[11px] text-white/40">
              identificador: {slug}
            </span>
          )}
        </label>

        <fieldset className="block">
          <legend className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Tipo de número
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="radio"
                name="connection-mode"
                checked={!cloudApi}
                onChange={() => {
                  setCloudApi(false);
                  setUrl("");
                }}
                className="mt-1 accent-[#c5f04a]"
              />
              <span>
                Coexistencia
                <span className="mt-0.5 block text-xs text-white/40">
                  El cliente ya usa ese número en la app de WhatsApp Business y la sigue usando.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="radio"
                name="connection-mode"
                checked={cloudApi}
                onChange={() => {
                  setCloudApi(true);
                  setUrl("");
                }}
                disabled={!cloudApiAvailable}
                className="mt-1 accent-[#c5f04a] disabled:opacity-40"
              />
              <span className={cloudApiAvailable ? undefined : "opacity-40"}>
                Cloud API puro
                <span className="mt-0.5 block text-xs text-white/40">
                  {cloudApiAvailable
                    ? "Número nuevo o dedicado, sin app de WhatsApp Business. Se registra automáticamente."
                    : "Requiere META_CONFIG_ID_CLOUD_API configurado en Meta y en el entorno."}
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={!slug || generating}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#c5f04a] px-4 text-sm font-semibold text-[#0a0a0a] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? "Generando…" : "Generar enlace seguro"}
      </button>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {url ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border border-white/10 bg-black/30 p-4">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-[#c5f04a]">{url}</code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[#c5f04a] px-4 text-sm font-semibold text-[#0a0a0a] transition hover:bg-white"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      ) : (
        <p className="mt-5 border border-dashed border-white/10 px-5 py-6 text-center text-sm text-white/40">
          Escribe el nombre del cliente para generar el enlace.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-white/35">
        El enlace vence en 7 días y está firmado para este workspace y modo. Compártelo
        solo con el cliente correspondiente.
      </p>
    </section>
  );
}

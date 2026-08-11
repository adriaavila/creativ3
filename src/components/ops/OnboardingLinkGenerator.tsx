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
      className="scroll-mt-6 rounded-2xl border border-[#dfe5eb] bg-white p-5 shadow-[0_12px_32px_rgba(20,43,75,0.05)] sm:p-7"
    >
      <div className="flex items-center gap-3 border-b border-[#e7ebf0] pb-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#172238] text-[#c5f04a]"><Link2 className="size-4.5" /></span>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a96a5]">Invitación segura</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#172238]">Onboarding por cliente</h2></div>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-6 text-[#68778a]">
        Genera el enlace que enviarás al dueño del negocio. El nombre identifica su
        conexión y separa la configuración de automatización de cada cliente.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-[#526174]">
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
            className="mt-2 min-h-11 w-full rounded-lg border border-[#d5dde5] bg-[#fafbfc] px-3 text-sm text-[#172238] outline-none transition placeholder:text-[#8a96a5] focus:border-[#6f8733] focus:ring-2 focus:ring-[#c5f04a]/25"
          />
          {slug && (
            <span className="mt-2 block font-mono text-[11px] text-[#7a8797]">
              identificador: {slug}
            </span>
          )}
        </label>

        <fieldset className="block">
          <legend className="text-xs font-semibold text-[#526174]">
            Tipo de número
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-3 text-sm font-medium text-[#263b54]">
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
                <span className="mt-1 block text-xs font-normal leading-5 text-[#7a8797]">
                  El cliente ya usa ese número en la app de WhatsApp Business y la sigue usando.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm font-medium text-[#263b54]">
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
                <span className="mt-1 block text-xs font-normal leading-5 text-[#7a8797]">
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
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172238] px-4 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#263b54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? "Generando…" : "Generar enlace seguro"}
      </button>
      {error && <p className="mt-3 rounded-lg border border-[#f0cecb] bg-[#fff5f4] px-3 py-2.5 text-sm text-[#98453f]" role="alert">{error}</p>}

      {url ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#d9e4cf] bg-[#f7fbf2] p-4">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-[#405525]">{url}</code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-[#c5f04a] px-4 text-sm font-semibold text-[#263710] transition hover:bg-[#b7e63b]"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-[#cfd8e1] bg-[#fafbfc] px-5 py-6 text-center text-sm text-[#7a8797]">
          Escribe el nombre del cliente para generar el enlace.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-[#7a8797]">
        El enlace vence en 7 días y está firmado para este workspace y modo. Compártelo
        solo con el cliente correspondiente.
      </p>
    </section>
  );
}

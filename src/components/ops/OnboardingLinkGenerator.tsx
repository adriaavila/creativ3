"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toWorkspaceSlug } from "@/lib/meta/onboarding-link";

/**
 * Builds the per-client Embedded Signup link an operator sends to a business
 * owner. The workspace slug in that URL becomes whatsapp_connections.client and
 * then the tenant key for that number's bot config — so it is picked here, once,
 * rather than typed by hand into a URL each time.
 */

const SLUG_MAX = 80;

type DestinationView = {
  slug: string;
  label: string;
  provisionUrl: string | null;
};

export default function OnboardingLinkGenerator({
  cloudApiAvailable,
}: {
  cloudApiAvailable: boolean;
}) {
  const [name, setName] = useState("");
  const [cloudApi, setCloudApi] = useState(false);
  const [destination, setDestination] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [destinations, setDestinations] = useState<DestinationView[]>([]);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = useMemo(() => toWorkspaceSlug(name), [name]);

  useEffect(() => {
    void fetch("/api/ops/destinations", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { destinations?: DestinationView[] }) => setDestinations(data.destinations ?? []))
      .catch(() => setDestinations([]));
  }, []);

  const generate = async () => {
    if (!slug) return;
    setGenerating(true);
    setError(null);
    setUrl("");
    const response = await fetch("/api/ops/meta/onboarding-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace: slug,
        mode: cloudApi ? "cloud_api" : "coexistence",
        ...(destination ? { destination } : {}),
        ...(externalRef.trim() ? { external_ref: externalRef.trim() } : {}),
      }),
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
      className="scroll-mt-6 rounded-2xl border border-[var(--rule)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-7"
    >
      <div className="flex items-center gap-3 border-b border-[var(--hairline)] pb-5">
        <span className="on-ink flex size-10 items-center justify-center rounded-xl bg-[var(--ink-fill)] text-[var(--assist-ink)]"><Link2 className="size-4.5" /></span>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-40)]">Invitación segura</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Onboarding por cliente</h2></div>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--ink-60)]">
        Genera el enlace que enviarás al dueño del negocio. El nombre identifica su
        conexión y separa la configuración de automatización de cada cliente.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-[var(--ink-60)]">
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
            className="mt-2 min-h-11 w-full rounded-lg border border-[var(--rule)] bg-[var(--ground-2)] px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-40)] focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25"
          />
          {slug && (
            <span className="mt-2 block font-mono text-[11px] text-[var(--ink-60)]">
              identificador: {slug}
            </span>
          )}
        </label>

        <fieldset className="block">
          <legend className="text-xs font-semibold text-[var(--ink-60)]">
            Tipo de número
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-3 text-sm font-medium text-[var(--ink)]">
              <input
                type="radio"
                name="connection-mode"
                checked={!cloudApi}
                onChange={() => {
                  setCloudApi(false);
                  setUrl("");
                }}
                className="mt-1 accent-[var(--assist)]"
              />
              <span>
                Coexistencia
                <span className="mt-1 block text-xs font-normal leading-5 text-[var(--ink-60)]">
                  El cliente ya usa ese número en la app de WhatsApp Business y la sigue usando.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm font-medium text-[var(--ink)]">
              <input
                type="radio"
                name="connection-mode"
                checked={cloudApi}
                onChange={() => {
                  setCloudApi(true);
                  setUrl("");
                }}
                disabled={!cloudApiAvailable}
                className="mt-1 accent-[var(--assist)] disabled:opacity-40"
              />
              <span className={cloudApiAvailable ? undefined : "opacity-40"}>
                Cloud API puro
                <span className="mt-1 block text-xs font-normal leading-5 text-[var(--ink-60)]">
                  {cloudApiAvailable
                    ? "Número nuevo o dedicado, sin app de WhatsApp Business. Se registra automáticamente."
                    : "Requiere META_CONFIG_ID_CLOUD_API configurado en Meta y en el entorno."}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-semibold text-[var(--ink-60)]">Entrega automática</span>
          <select
            value={destination}
            onChange={(event) => { setDestination(event.target.value); setUrl(""); }}
            className="mt-2 min-h-11 w-full rounded-lg border border-[var(--rule)] bg-[var(--ground-2)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25"
          >
            <option value="">Sólo conectar en Allok</option>
            {destinations.filter((item) => item.slug !== "allok").map((item) => (
              <option key={item.slug} value={item.slug}>{item.label}</option>
            ))}
          </select>
          <span className="mt-2 block text-[11px] leading-5 text-[var(--ink-60)]">El destino con provisión recibe las credenciales y el webhook automáticamente.</span>
        </label>

        {destination && destinations.find((item) => item.slug === destination)?.provisionUrl && (
          <label className="block">
            <span className="text-xs font-semibold text-[var(--ink-60)]">Referencia SaaS (opcional)</span>
            <input
              value={externalRef}
              onChange={(event) => { setExternalRef(event.target.value); setUrl(""); }}
              placeholder="organization_id"
              className="mt-2 min-h-11 w-full rounded-lg border border-[var(--rule)] bg-[var(--ground-2)] px-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--assist-line)] focus:ring-2 focus:ring-[var(--assist-ink)]/25"
            />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={!slug || generating}
        className="on-ink mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--ink-fill)] px-4 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--ink-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? "Generando…" : "Generar enlace seguro"}
      </button>
      {error && <p className="mt-3 rounded-lg border border-[var(--risk-line)] bg-[var(--risk-soft)] px-3 py-2.5 text-sm text-[var(--status-risk)]" role="alert">{error}</p>}

      {url ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--assist-line)] bg-[var(--assist-soft)] p-4">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-[var(--on-assist)]">{url}</code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--assist)] px-4 text-sm font-semibold text-[var(--on-assist)] transition hover:bg-[var(--assist)]"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-[var(--rule)] bg-[var(--ground-2)] px-5 py-6 text-center text-sm text-[var(--ink-60)]">
          Escribe el nombre del cliente para generar el enlace.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-[var(--ink-60)]">
        El enlace vence en 7 días y está firmado para este workspace y modo. Compártelo
        solo con el cliente correspondiente.
      </p>
    </section>
  );
}

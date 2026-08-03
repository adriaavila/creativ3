"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

/**
 * Builds the per-client Embedded Signup link an operator sends to a business
 * owner. The workspace slug in that URL becomes whatsapp_connections.client and
 * then the tenant key for that number's bot config — so it is picked here, once,
 * rather than typed by hand into a URL each time.
 */

const SLUG_MAX = 80;

/** Must satisfy the server-side check in /embedded-whatsapp and resolveOpsWorkspace. */
export function toWorkspaceSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
}

export function buildOnboardingUrl(origin: string, slug: string, cloudApi: boolean) {
  const url = new URL("/embedded-whatsapp", origin);
  url.searchParams.set("workspace", slug);
  if (cloudApi) url.searchParams.set("mode", "cloud_api");
  return url.toString();
}

export default function OnboardingLinkGenerator({
  cloudApiAvailable,
}: {
  cloudApiAvailable: boolean;
}) {
  const [name, setName] = useState("");
  const [cloudApi, setCloudApi] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => toWorkspaceSlug(name), [name]);
  const url = useMemo(() => {
    if (!slug) return "";
    // window is unavailable during SSR; this component only renders its link
    // after the user types, which is client-side by then.
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return origin ? buildOnboardingUrl(origin, slug, cloudApi) : "";
  }, [slug, cloudApi]);

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
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Nombre del cliente
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
                onChange={() => setCloudApi(false)}
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
                onChange={() => setCloudApi(true)}
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
        El enlace exige sesión de Ops: quien lo abra inicia sesión primero. Acompaña
        al cliente en la llamada en lugar de mandarlo suelto.
      </p>
    </section>
  );
}

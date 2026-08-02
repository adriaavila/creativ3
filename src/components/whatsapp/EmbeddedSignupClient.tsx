"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AllokLogo from "@/components/brand/AllokLogo";
import {
  isMetaMessageOrigin,
  type MetaEmbeddedSignupConfig,
  type MetaSignupSession,
} from "@/lib/meta/embedded-signup";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: object) => void;
      login: (callback: (response: FBLoginResponse) => void, options: object) => void;
    };
  }
}

interface FBLoginResponse {
  authResponse?: {
    code?: string;
    grantedScopes?: string;
  };
  status?: string;
  error?: string;
  error_code?: string | number;
  error_message?: string;
  error_reason?: string;
}

type SignupEvent = {
  type?: string;
  event?: string;
  version?: number;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
    current_step?: string;
    error_code?: string;
    error_message?: string;
    session_id?: string;
    timestamp?: string;
  };
};

type PendingSignup = {
  code?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  session?: MetaSignupSession;
};

type Status = "idle" | "loading" | "exchanging" | "success" | "error";

type ConnectionDetails = {
  wabaId?: string;
  phoneNumberId?: string;
  businessId?: string | null;
  displayPhoneNumber?: string | null;
  verifiedName?: string | null;
  qualityRating?: string | null;
  nameStatus?: string | null;
  status?: string | null;
  connectionMode?: string | null;
  connectedAt?: string | null;
};

export default function EmbeddedSignupClient({ workspace }: { workspace: string }) {
  const [config, setConfig] = useState<MetaEmbeddedSignupConfig | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<ConnectionDetails | null>(null);
  const pendingSignupRef = useRef<PendingSignup>({});
  const exchangeStartedRef = useRef(false);
  const signupStateRef = useRef<string>("");

  const exchangeWhenReady = useCallback(async (allowServerDiscovery = false) => {
    const pending = pendingSignupRef.current;
    if (
      exchangeStartedRef.current ||
      !pending.code ||
      (!allowServerDiscovery && (!pending.waba_id || !pending.phone_number_id))
    ) {
      return;
    }

    exchangeStartedRef.current = true;
    setStatus("exchanging");
    setErrorMessage(null);

    const response = await fetch("/api/meta/embedded-signup/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: pending.code,
        waba_id: pending.waba_id,
        phone_number_id: pending.phone_number_id,
        business_id: pending.business_id,
        state: signupStateRef.current,
        client: workspace,
        session: pending.session,
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      exchangeStartedRef.current = false;
      setStatus("error");
      setErrorMessage(safeErrorMessage(result));
      return;
    }

    setSuccessDetails(
      normalizeConnection(result.connected_account, {
        waba_id: pending.waba_id,
        phone_number_id: pending.phone_number_id,
      }),
    );
    setStatus("success");
  }, [workspace]);

  useEffect(() => {
    let cancelled = false;

    async function bootMetaSdk() {
      try {
        const response = await fetch(
          `/api/meta/embedded-signup/config?workspace=${encodeURIComponent(workspace)}`,
          {
            cache: "no-store",
          },
        );
        const metaConfig = await response.json();

        if (!response.ok) {
          throw new Error(safeErrorMessage(metaConfig));
        }

        if (cancelled) return;

        setConfig(metaConfig);
        signupStateRef.current = metaConfig.state;
        if (metaConfig.connection) {
          setSuccessDetails(normalizeConnection(metaConfig.connection));
          setStatus("success");
        }

        const initializeSdk = () => {
          window.FB?.init({
            appId: metaConfig.appId,
            autoLogAppEvents: true,
            xfbml: true,
            version: metaConfig.graphVersion,
          });
          setSdkReady(true);
        };

        window.fbAsyncInit = initializeSdk;

        if (window.FB) {
          initializeSdk();
          return;
        }

        const existingScript = document.getElementById("facebook-jssdk");
        if (existingScript) {
          existingScript.addEventListener("load", initializeSdk, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Meta no está configurado.");
      }
    }

    void bootMetaSdk();

    const handleMessage = (event: MessageEvent) => {
      if (!isMetaMessageOrigin(event.origin)) return;

      const signupEvent = parseSignupEvent(event.data);
      if (signupEvent?.type !== "WA_EMBEDDED_SIGNUP") return;

      if (signupEvent.event === "CANCEL") {
        setStatus("error");
        setErrorMessage(cancelMessage(signupEvent));
        return;
      }

      const wabaId = signupEvent.data?.waba_id;
      const phoneNumberId = signupEvent.data?.phone_number_id;
      if (!wabaId || !phoneNumberId) return;

      pendingSignupRef.current = {
        ...pendingSignupRef.current,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        business_id: signupEvent.data?.business_id,
        session: {
          event: signupEvent.event,
          version: signupEvent.version,
          session_id: signupEvent.data?.session_id,
          received_at: new Date().toISOString(),
        },
      };
      void exchangeWhenReady();
    };

    window.addEventListener("message", handleMessage);
    return () => {
      cancelled = true;
      window.removeEventListener("message", handleMessage);
    };
  }, [exchangeWhenReady, workspace]);

  const fbLoginCallback = (response: FBLoginResponse) => {
    const code = response.authResponse?.code;

    if (!code) {
      console.warn("Meta Embedded Signup did not return an authorization code.", {
        status: response.status,
        error: response.error,
        error_code: response.error_code,
        error_message: response.error_message,
        error_reason: response.error_reason,
        origin: window.location.origin,
      });
      setStatus("error");
      setErrorMessage(loginFailureMessage(response, config));
      return;
    }

    pendingSignupRef.current = {
      ...pendingSignupRef.current,
      code,
    };
    void exchangeWhenReady();

    window.setTimeout(() => {
      void exchangeWhenReady(true);
    }, 2500);
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB || !config) {
      setStatus("error");
      setErrorMessage("El SDK de Meta todavía no está listo.");
      return;
    }

    pendingSignupRef.current = {};
    exchangeStartedRef.current = false;
    setSuccessDetails(null);
    setErrorMessage(null);
    setStatus("loading");

    window.FB.login(fbLoginCallback, {
      config_id: config.configId,
      auth_type: "rerequest",
      response_type: "code",
      override_default_response_type: true,
      return_scopes: true,
      scope: config.requiredPermissions.join(","),
      state: signupStateRef.current,
      extras: {
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: "3",
      },
    });
  };

  const disconnectWhatsApp = async () => {
    if (!successDetails?.phoneNumberId) return;
    setStatus("loading");
    setErrorMessage(null);
    const response = await fetch("/api/meta/embedded-signup/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number_id: successDetails.phoneNumberId,
        workspace,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setErrorMessage(safeErrorMessage(result));
      return;
    }
    setSuccessDetails(null);
    setStatus("idle");
  };

  const busy = status === "loading" || status === "exchanging";

  return (
    <main className="min-h-dvh bg-[#f7f8fa] text-[#142b4b]">
      <header className="border-b border-[#e5e9ed] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <AllokLogo variant="mark" theme="light" className="size-9" />
            <div>
              <p className="font-display text-[17px] font-semibold tracking-[-0.04em] text-[#142b4b]">
                allok<span className="text-[#97c51e]">.</span>
              </p>
              <p className="text-[11px] text-[#7a8797]">Conexión oficial de WhatsApp</p>
            </div>
          </div>
          <Link
            href="/ops/crm?view=connections#connections"
            className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#dce2e8] px-3 text-[13px] font-medium text-[#526174] transition hover:border-[#142b4b] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"
          >
            Volver a conexiones
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-10 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          aria-labelledby="whatsapp-onboarding-title"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718096]">
            WhatsApp oficial · Meta Embedded Signup
          </p>
          <h1 id="whatsapp-onboarding-title" className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#142b4b] sm:text-5xl">
            Conecta el número que ya usa tu negocio.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#617086]">
            Vincula tu WhatsApp Business con allok desde el flujo oficial de Meta.
            Tu equipo puede seguir atendiendo desde la app mientras el CRM recibe y
            organiza las nuevas conversaciones.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[#e1e6eb] bg-white shadow-[0_16px_42px_rgba(20,43,75,0.06)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f3] px-5 py-4 sm:px-7">
              <div>
                <p className="text-[13px] font-semibold text-[#142b4b]">
                  {successDetails ? "Conexión actual" : "Activa tu conexión"}
                </p>
                <p className="mt-1 text-[12px] text-[#7a8797]">
                  {successDetails ? "Estado registrado en allok" : "Toma unos minutos y requiere acceso de administrador"}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${successDetails ? "bg-[#eef8dd] text-[#52720f]" : "bg-[#f1f4f7] text-[#65758a]"}`}>
                <span className={`size-1.5 rounded-full ${successDetails ? "bg-[#86b51c]" : "bg-[#9aa8b8]"}`} aria-hidden="true" />
                {successDetails ? connectionStatusLabel(successDetails.status) : "Sin conectar"}
              </span>
            </div>

            <div className="p-5 sm:p-7">
              {successDetails ? (
                <div className="rounded-xl border border-[#dcebd0] bg-[#f8fcf3] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f6ca] text-[#638416]">
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#29420d]">
                        {successDetails.verifiedName || "WhatsApp Business conectado"}
                      </p>
                      <p className="mt-1 text-[13px] text-[#63734b]">
                        {successDetails.displayPhoneNumber || "Número conectado"}
                        {successDetails.connectionMode === "META_COEXISTENCE" ? " · Coexistencia oficial" : " · Meta Cloud API"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 border-t border-[#deebd1] pt-4 text-[12px] sm:grid-cols-3">
                    <ConnectionMetric label="Calidad" value={formatQuality(successDetails.qualityRating)} />
                    <ConnectionMetric label="Nombre" value={formatNameStatus(successDetails.nameStatus)} />
                    <ConnectionMetric label="Sincronizado" value={formatSyncStatus(successDetails.status)} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <OnboardingStep number="01" title="Autoriza en Meta" text="Usa el acceso de administrador de tu negocio." />
                  <OnboardingStep number="02" title="Elige tu número" text="Selecciona el WhatsApp Business que ya utilizas." />
                  <OnboardingStep number="03" title="Empieza en allok" text="Conserva la app y centraliza las conversaciones nuevas." />
                </div>
              )}

              <AnimatePresence mode="wait">
                {status === "error" && errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-5 flex items-start gap-3 rounded-xl border border-[#f1d3d0] bg-[#fff8f7] px-4 py-3 text-left"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#b34c43]" aria-hidden="true" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#8f3932]">No pudimos completar la conexión.</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#a05b54]">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={launchWhatsAppSignup}
                disabled={!sdkReady || busy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#142b4b] px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(20,43,75,0.16)] transition hover:bg-[#234466] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {status === "exchanging" ? "Guardando conexión..." : "Abriendo Meta..."}
                  </>
                ) : (
                  <>
                    {successDetails ? "Volver a conectar con Meta" : "Conectar con Meta"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>

              {status === "success" && (
                <button
                  type="button"
                  onClick={disconnectWhatsApp}
                  className="mt-4 block w-full text-center text-[12px] text-[#7a8797] transition hover:text-[#a53e35] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"
                >
                  Desconectar de allok
                </button>
              )}

              {!sdkReady && status === "idle" && (
                <p className="mt-3 text-center text-[12px] text-[#8b98a8]">Cargando el acceso seguro de Meta...</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#e1e6eb] bg-white px-4 py-4 text-[12px] leading-5 text-[#718096]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6c8c19]" aria-hidden="true" />
            <p>El código de autorización se intercambia en el servidor. Nunca mostramos tokens ni credenciales en el navegador.</p>
          </div>
        </motion.section>

        <aside className="space-y-4" aria-label="Información de la conexión">
          <InfoCard icon={Smartphone} title="Tu número permanece en WhatsApp Business">
            <p>Con <strong className="font-semibold text-[#344b68]">Coexistencia</strong>, la app móvil sigue siendo tuya. allok usa la API oficial de Meta para el inbox, el equipo y la automatización supervisada.</p>
          </InfoCard>

          <InfoCard icon={Clock3} title="La regla de las 24 horas">
            <p>Después de un mensaje del cliente puedes responder con texto libre durante 24 horas. Fuera de esa ventana, Meta exige una plantilla aprobada.</p>
          </InfoCard>

          <InfoCard icon={FileText} title="Qué se sincroniza">
            <ul className="space-y-2">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#78a01b]" aria-hidden="true" />Mensajes nuevos y estados que Meta entregue al webhook.</li>
              <li className="flex gap-2"><CircleHelp className="mt-0.5 size-3.5 shrink-0 text-[#91a0b0]" aria-hidden="true" />No prometemos importar automáticamente todo el historial de la app.</li>
            </ul>
          </InfoCard>

          <div className="rounded-xl border border-[#e1e6eb] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a97a6]">Más información</p>
            <div className="mt-3 space-y-2">
              <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows/onboarding-business-app-users/" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-[13px] font-medium text-[#526174] hover:text-[#142b4b]">
                Coexistencia en Meta <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-[13px] font-medium text-[#526174] hover:text-[#142b4b]">
                Cloud API oficial <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function OnboardingStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#e6ebef] bg-[#fbfcfd] p-4">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8a97a6]">{number}</p>
      <p className="mt-3 text-[13px] font-semibold text-[#263d59]">{title}</p>
      <p className="mt-1 text-[12px] leading-5 text-[#718096]">{text}</p>
    </div>
  );
}

function ConnectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a9a78]">{label}</p>
      <p className="mt-1 font-medium text-[#415536]">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e1e6eb] bg-white p-5 text-[13px] leading-5 text-[#718096]">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f8] text-[#526b87]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-[#263d59]">{title}</h2>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

function normalizeConnection(value: unknown, fallback: Record<string, unknown> = {}): ConnectionDetails | null {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const stringValue = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key] ?? fallback[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
    return null;
  };

  const wabaId = stringValue("wabaId", "waba_id");
  const phoneNumberId = stringValue("phoneNumberId", "phone_number_id");
  if (!wabaId && !phoneNumberId) return null;

  return {
    wabaId: wabaId ?? undefined,
    phoneNumberId: phoneNumberId ?? undefined,
    businessId: stringValue("businessId", "business_id"),
    displayPhoneNumber: stringValue("displayPhoneNumber", "display_phone_number"),
    verifiedName: stringValue("verifiedName", "verified_name"),
    qualityRating: stringValue("qualityRating", "quality_rating"),
    nameStatus: stringValue("nameStatus", "name_status"),
    status: stringValue("status"),
    connectionMode: stringValue("connectionMode", "connection_mode"),
    connectedAt: stringValue("connectedAt", "connected_at"),
  };
}

function connectionStatusLabel(status?: string | null) {
  if (status === "subscribed") return "Conectado";
  if (status === "connected") return "Conectado";
  if (status === "deauthorized") return "Desconectado";
  return status || "Conectado";
}

function formatQuality(value?: string | null) {
  if (!value) return "No disponible";
  if (value.toUpperCase() === "GREEN") return "Saludable";
  if (value.toUpperCase() === "YELLOW") return "En observación";
  if (value.toUpperCase() === "RED") return "Limitada";
  return value;
}

function formatNameStatus(value?: string | null) {
  if (!value) return "No disponible";
  if (value.toUpperCase() === "APPROVED") return "Aprobado";
  return value;
}

function formatSyncStatus(value?: string | null) {
  if (value === "subscribed") return "Webhook activo";
  if (value === "connected") return "Conectado";
  return value || "No disponible";
}

function parseSignupEvent(data: unknown): SignupEvent | null {
  try {
    return typeof data === "string" ? JSON.parse(data) : (data as SignupEvent);
  } catch {
    return null;
  }
}

function safeErrorMessage(result: unknown) {
  if (!result || typeof result !== "object") return "Error desconocido.";

  const value = result as Record<string, unknown>;
  if (typeof value.error === "string") {
    const missingEnv = Array.isArray(value.missing_env) ? ` (${value.missing_env.join(", ")})` : "";
    return `${value.error}${missingEnv}`;
  }

  return "Error desconocido.";
}

function loginFailureMessage(
  response: FBLoginResponse,
  config: MetaEmbeddedSignupConfig | null,
) {
  const details = [
    response.error_message,
    response.error_reason,
    response.error,
    response.error_code ? `Código ${response.error_code}` : undefined,
  ].filter(Boolean);
  const detailText = details.length ? ` Meta respondió: ${details.join(" · ")}.` : "";
  const statusText = response.status ? ` Estado: ${response.status}.` : "";
  const origin = typeof window === "undefined" ? undefined : window.location.origin;
  const configuredOrigin = getConfiguredOrigin(config?.appUrl);

  if (response.status === "not_authorized") {
    return `Meta no autorizó la app.${statusText}${detailText} Revoca permisos y vuelve a intentar; si sigue igual, revisa permisos avanzados y la configuración de Facebook Login for Business.`;
  }

  if (configuredOrigin && origin && configuredOrigin !== origin) {
    return `Meta no devolvió un código de autorización.${statusText}${detailText} Estás abriendo la página desde ${origin}, pero la app está configurada para ${configuredOrigin}; agrega este origen en Meta o usa el dominio configurado.`;
  }

  return `Meta no devolvió un código de autorización.${statusText}${detailText} Revisa que ${origin ?? "este dominio"} esté en Allowed domains y Valid OAuth Redirect URIs, que el config_id pertenezca a Facebook Login for Business y que los permisos estén aprobados.`;
}

function getConfiguredOrigin(appUrl?: string) {
  if (!appUrl) return undefined;

  try {
    return new URL(appUrl).origin;
  } catch {
    return undefined;
  }
}

function cancelMessage(signupEvent: SignupEvent) {
  if (signupEvent.data?.error_message) return signupEvent.data.error_message;
  if (signupEvent.data?.current_step) {
    return `Proceso cancelado en ${signupEvent.data.current_step}.`;
  }
  return "Proceso cancelado antes de finalizar.";
}

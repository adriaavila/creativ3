"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  META_MESSAGE_ORIGINS,
  type MetaEmbeddedSignupConfig,
  type MetaSignupSession,
} from "@/lib/meta/embedded-signup";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: object) => void;
      login: (callback: (response: FBLoginResponse) => void, options: object) => void;
      api: (
        path: string,
        method: "GET" | "POST" | "DELETE",
        callback: (response: unknown) => void,
      ) => void;
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

const allowedOrigins = new Set<string>(META_MESSAGE_ORIGINS);

export default function EmbeddedWhatsapp() {
  const [config, setConfig] = useState<MetaEmbeddedSignupConfig | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    waba_id?: string;
    phone_number_id?: string;
  } | null>(null);
  const pendingSignupRef = useRef<PendingSignup>({});
  const exchangeStartedRef = useRef(false);
  const signupStateRef = useRef<string>("");

  const exchangeWhenReady = useCallback(async () => {
    const pending = pendingSignupRef.current;
    if (
      exchangeStartedRef.current ||
      !pending.code ||
      !pending.waba_id ||
      !pending.phone_number_id
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
        ...getSafeAppContext(),
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

    setSuccessDetails({
      waba_id: pending.waba_id,
      phone_number_id: pending.phone_number_id,
    });
    setStatus("success");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootMetaSdk() {
      try {
        const response = await fetch("/api/meta/embedded-signup/config", {
          cache: "no-store",
        });
        const metaConfig = await response.json();

        if (!response.ok) {
          throw new Error(safeErrorMessage(metaConfig));
        }

        if (cancelled) return;

        setConfig(metaConfig);
        signupStateRef.current = metaConfig.state;

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
      if (!allowedOrigins.has(event.origin)) return;

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
  }, [exchangeWhenReady]);

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
      const pending = pendingSignupRef.current;
      if (
        !exchangeStartedRef.current &&
        pending.code &&
        (!pending.waba_id || !pending.phone_number_id)
      ) {
        setStatus("error");
        setErrorMessage("Meta devolvió el código, pero no llegó el evento con WABA y número.");
      }
    }, 24000);
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

  const deauthorizeApp = () => {
    if (!window.FB) {
      setStatus("error");
      setErrorMessage("El SDK de Meta no está listo.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    window.FB.api("/me/permissions", "DELETE", (response: unknown) => {
      const res = response as { error?: { message?: string } } | null | undefined;
      if (res && !res.error) {
        setStatus("idle");
        setSuccessDetails(null);
        pendingSignupRef.current = {};
        exchangeStartedRef.current = false;
        window.location.reload();
      } else {
        setStatus("error");
        setErrorMessage(
          res?.error?.message || "No se pudieron revocar los permisos."
        );
      }
    });
  };

  const busy = status === "loading" || status === "exchanging";

  return (
    <div className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#336443]/8 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-[#1f2a1d]/10 bg-[#1f2a1d]/5 backdrop-blur-xl p-10 md:p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 fill-green-500"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-normal mb-3 tracking-tight leading-tight">
            Conecta tu WhatsApp Business
          </h1>
          <p className="text-[#1f2a1d]/55 font-mono text-sm leading-relaxed mb-10">
            Autoriza la conexión para activar automatizaciones, seguimiento y
            atención desde Servicios Creativos.
          </p>

          <AnimatePresence mode="wait">
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 mb-8 text-left"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Conexión autorizada y guardada.
                  </p>
                  <p className="text-xs text-[#4b5b47]/80 font-mono mt-0.5">
                    WABA {successDetails?.waba_id} · número {successDetails?.phone_number_id}
                  </p>
                </div>
              </motion.div>
            )}

            {status === "error" && errorMessage && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-8 text-left"
              >
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    No pudimos completar la conexión.
                  </p>
                  <p className="text-xs text-[#4b5b47]/80 font-mono mt-0.5">
                    {errorMessage}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={launchWhatsAppSignup}
            disabled={!sdkReady || busy || status === "success"}
            className="w-full h-14 rounded-2xl bg-[#1877f2] hover:bg-[#1565d8] active:bg-[#1053b8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#1877f2]/20"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {status === "exchanging" ? "Guardando conexión..." : "Abriendo Meta..."}
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Conectado
              </>
            ) : (
              "Conectar mi WhatsApp"
            )}
          </button>

          {(status === "success" || status === "error") && (
            <button
              onClick={deauthorizeApp}
              className="mt-4 text-xs font-mono text-[#1f2a1d]/50 hover:text-red-600 hover:underline transition-colors cursor-pointer"
            >
              Resetear Conexión (Revocar permisos en Facebook)
            </button>
          )}

          {!sdkReady && status === "idle" && (
            <p className="text-[#4b5b47]/60 font-mono text-xs mt-3">
              Cargando SDK de Meta...
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-8 text-[#1f2a1d]/35 font-mono text-xs">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>La clave secreta de Meta se usa solo en el servidor.</span>
          </div>
        </div>

        <p className="text-center text-[#1f2a1d]/25 font-mono text-xs mt-6">
          Servicios Creativos · Integración oficial Meta WhatsApp API
        </p>
      </motion.div>
    </div>
  );
}

function parseSignupEvent(data: unknown): SignupEvent | null {
  try {
    return typeof data === "string" ? JSON.parse(data) : (data as SignupEvent);
  } catch {
    return null;
  }
}

function getSafeAppContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    client: safeParam(params, "client"),
    user_id: safeParam(params, "user_id"),
    team_id: safeParam(params, "team_id"),
    account_id: safeParam(params, "account_id"),
  };
}

function safeParam(params: URLSearchParams, key: string) {
  const value = params.get(key);
  return value && value.length <= 160 ? value : undefined;
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

"use client";

import React, { useEffect, useState } from "react";
import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (config: object) => void;
      login: (callback: (response: FBLoginResponse) => void, options: object) => void;
    };
  }
}

interface FBLoginResponse {
  authResponse?: {
    code: string;
    accessToken?: string;
  };
  status?: string;
}

const APP_ID = "928506006692783";
const GRAPH_VERSION = "v24.0";
const CONFIG_ID = "1314818040747845";

const N8N_ONBOARDING_WEBHOOK =
  "https://n8n.servicioscreativos.online/webhook/whatsapp-onboarding-finish-7f3a9c";
const N8N_CODE_WEBHOOK =
  "https://n8n.servicioscreativos.online/webhook/whatsapp-login-code-7f3a9c";

const WEBHOOK_HEADER_NAME = "x-servicioscreativos-secret";
const WEBHOOK_HEADER_VALUE = "rei_n8n_secret_2026_xK92pLm7qA_private";

function getClientParam(): string | null {
  return new URLSearchParams(window.location.search).get("client");
}

async function postToN8n(url: string, payload: object): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_HEADER_NAME]: WEBHOOK_HEADER_VALUE,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Error enviando a n8n:", err);
  }
}

type Status = "idle" | "loading" | "success" | "error";

export default function EmbeddedWhatsapp() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: GRAPH_VERSION,
      });
      setSdkReady(true);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          const client = getClientParam();
          await postToN8n(N8N_ONBOARDING_WEBHOOK, {
            client,
            embedded_event: data,
            received_at: new Date().toISOString(),
          });
        }
      } catch {
        // non-JSON messages from facebook.com — ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const fbLoginCallback = (response: FBLoginResponse) => {
    const client = getClientParam();

    if (response.authResponse) {
      const code = response.authResponse.code;
      void postToN8n(N8N_CODE_WEBHOOK, {
        client,
        code,
        received_at: new Date().toISOString(),
      }).then(() => setStatus("success"));
    } else {
      void postToN8n(N8N_CODE_WEBHOOK, {
        client,
        error: response,
        received_at: new Date().toISOString(),
      }).then(() => setStatus("error"));
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      console.error("FB SDK no cargado aún");
      return;
    }
    setStatus("loading");
    window.FB.login(fbLoginCallback, {
      config_id: CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: "3",
      },
    });
  };

  return (
    <div className="min-h-screen bg-noche text-papiro flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cobalto/8 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-papiro/10 bg-papiro/5 backdrop-blur-xl p-10 md:p-14 text-center">
          {/* WhatsApp icon */}
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 fill-green-500"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-editorial italic mb-3 tracking-tight leading-tight">
            Conecta tu WhatsApp Business
          </h1>
          <p className="text-papiro/55 font-mono text-sm leading-relaxed mb-10">
            Autoriza la conexión para activar automatizaciones, seguimiento y
            atención desde Servicios Creativos.
          </p>

          {/* Status area */}
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
                  <p className="text-sm font-semibold text-green-400">
                    ¡Conexión autorizada!
                  </p>
                  <p className="text-xs text-papiro/50 font-mono mt-0.5">
                    Tu cuenta fue enviada para activación.
                  </p>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-8 text-left"
              >
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-400">
                    Proceso cancelado
                  </p>
                  <p className="text-xs text-papiro/50 font-mono mt-0.5">
                    Puedes intentarlo de nuevo cuando quieras.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA button */}
          <button
            onClick={launchWhatsAppSignup}
            disabled={!sdkReady || status === "loading" || status === "success"}
            className="w-full h-14 rounded-2xl bg-[#1877f2] hover:bg-[#1565d8] active:bg-[#1053b8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#1877f2]/20"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Abriendo Meta…
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

          {!sdkReady && status === "idle" && (
            <p className="text-papiro/30 font-mono text-xs mt-3">
              Cargando SDK de Meta…
            </p>
          )}

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-8 text-papiro/35 font-mono text-xs">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>
              Nunca compartimos tu clave secreta de Meta en el navegador.
            </span>
          </div>
        </div>

        {/* Powered by */}
        <p className="text-center text-papiro/25 font-mono text-xs mt-6">
          Servicios Creativos · Integración oficial Meta WhatsApp API
        </p>
      </motion.div>
    </div>
  );
}

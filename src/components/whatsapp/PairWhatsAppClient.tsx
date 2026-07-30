"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type PairState = {
  session?: string;
  status?: "pending" | "scan_qr" | "connected" | "disconnected";
  qr?: { mimetype: string; data: string } | null;
  code?: string | null;
  plan?: string;
  error?: string;
  channel?: string;
};

const POLL_MS = 3000;

// apple-design §4: critically damped by default — the QR swap is a state change,
// not a gesture, so no bounce.
const SETTLE = { type: "spring" as const, bounce: 0, duration: 0.35 };

export default function PairWhatsAppClient({ stripeSessionId }: { stripeSessionId: string }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<PairState>({});
  const [loading, setLoading] = useState(true);
  // Pairing by code is a one-shot request, deliberately outside the poll loop:
  // every request-code call invalidates the previous code, so polling with the
  // phone attached would rewrite the number the user is trying to type in.
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);

  const requestCode = async () => {
    setRequestingCode(true);
    setCodeError(null);
    try {
      const res = await fetch(
        `/api/waha/pair?session_id=${encodeURIComponent(stripeSessionId)}&phone=${encodeURIComponent(phone)}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as PairState;
      if (data.code) setCode(data.code);
      else setCodeError(data.error ?? "No pudimos generar el código. Revisá el número e intentá de nuevo.");
    } catch {
      setCodeError("No pudimos generar el código. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setRequestingCode(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const res = await fetch(`/api/waha/pair?session_id=${encodeURIComponent(stripeSessionId)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as PairState;
        if (cancelled) return;
        setState(data);
        setLoading(false);
        // Stop polling once paired or definitively wrong-channel/not-found.
        if (data.status !== "connected" && !data.channel && res.status !== 404) {
          timer = setTimeout(tick, POLL_MS);
        }
      } catch {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stripeSessionId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090a] px-6 py-20 text-white selection:bg-[#0a0a0a] selection:text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white shadow-2xl shadow-black/50">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c5f04a]">
            Activación
          </p>
          <h1 className="mt-3 text-3xl font-display leading-tight tracking-[-0.02em] text-white">Conectá tu WhatsApp</h1>

          {loading && (
            <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
              <Loader2 className="size-4 animate-spin text-[#c5f04a]" /> Preparando tu sesión…
            </div>
          )}

          {!loading && state.error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
              <p>{state.error}</p>
            </div>
          )}

          {state.status === "scan_qr" && !code && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/70">¿Sin cámara a mano? Vinculá con tu número.</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="591XXXXXXXX"
                  aria-label="Número de WhatsApp con código de país, sin +"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c5f04a]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={requestingCode || phone.replace(/\D/g, "").length < 8}
                  className="shrink-0 rounded-xl bg-[#c5f04a] px-4 py-2 text-sm font-medium text-black transition disabled:opacity-40"
                >
                  {requestingCode ? "Generando…" : "Obtener código"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">Con código de país, sin el signo +.</p>
              {codeError && <p className="mt-2 text-xs text-red-300">{codeError}</p>}
            </div>
          )}

          {state.status === "scan_qr" && code && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SETTLE}
              className="mt-6"
            >
              <div className="rounded-2xl border border-[#c5f04a]/30 bg-[#c5f04a]/5 p-6 text-center">
                <p className="font-mono text-3xl tracking-[0.2em] text-[#c5f04a]">{code}</p>
              </div>
              <ol className="mt-5 space-y-2 text-sm leading-relaxed text-white/70">
                <li>1. Abrí WhatsApp en tu teléfono.</li>
                <li>2. Ajustes → Dispositivos vinculados → Vincular dispositivo.</li>
                <li>3. Tocá «Vincular con número de teléfono» e ingresá este código.</li>
              </ol>
              <button
                type="button"
                onClick={() => {
                  setCode(null);
                  setPhone("");
                }}
                className="mt-4 text-xs text-white/50 underline underline-offset-4 hover:text-white/80"
              >
                Prefiero escanear el QR
              </button>
            </motion.div>
          )}

          {state.status === "scan_qr" && !code && state.qr && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SETTLE}
              className="mt-6"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
                <Image
                  src={`data:${state.qr.mimetype};base64,${state.qr.data}`}
                  alt="Código QR para vincular WhatsApp"
                  width={320}
                  height={320}
                  unoptimized
                  className="mx-auto h-auto w-full max-w-[280px]"
                />
              </div>
              <ol className="mt-5 space-y-2 text-sm leading-relaxed text-white/70">
                <li>1. Abrí WhatsApp en tu teléfono.</li>
                <li>2. Ajustes → Dispositivos vinculados → Vincular dispositivo.</li>
                <li>3. Escaneá este código.</li>
              </ol>
            </motion.div>
          )}

          {state.status === "connected" && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SETTLE}
              className="mt-6 flex items-start gap-2 rounded-2xl border border-[#c5f04a]/30 bg-[#0a0a0a]/20 p-4 text-sm text-[#c5f04a]"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>Listo. Tu número quedó conectado — ya podemos recibir y responder mensajes.</p>
            </motion.div>
          )}

          {state.status === "disconnected" && (
            <p className="mt-6 text-sm text-white/70">
              La sesión se desconectó. Recargá esta página para generar un código nuevo.
            </p>
          )}

          <div className="mt-8 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/50">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-[#c5f04a]" />
            <p>
              Este canal usa una conexión <strong>no oficial</strong> de WhatsApp (vinculación por
              QR, sin la API de Meta). Es más rápido de activar, pero WhatsApp puede restringir el
              número y no admite plantillas oficiales fuera de la ventana de 24 horas. Si preferís
              el canal oficial de Meta, escribinos y lo migramos.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

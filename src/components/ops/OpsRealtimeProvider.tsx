"use client";

import type { ReactNode } from "react";
import { OpsRealtimeContext, useOpsRealtimeController } from "@/hooks/useOpsRealtime";

export default function OpsRealtimeProvider({ children }: { children: ReactNode }) {
  const realtime = useOpsRealtimeController();
  const label = {
    connected: "Conectado",
    connecting: "Conectando…",
    reconnecting: "Reconectando…",
    offline: "Sin conexión",
  }[realtime.status];
  const dotClass = realtime.status === "connected"
    ? "bg-[#a8d51f]"
    : realtime.status === "reconnecting" || realtime.status === "connecting"
      ? "bg-[#b58a1b]"
      : "bg-[#9aa6b4]";

  return (
    <OpsRealtimeContext.Provider value={realtime}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-[#e1e7ec] bg-white/95 px-3 py-2 text-[11px] font-medium text-[#526174] shadow-[0_8px_24px_rgba(20,43,75,0.1)] backdrop-blur md:bottom-5 md:right-5"
        role="status"
        aria-live="polite"
        aria-label={`Realtime: ${label}. ${realtime.onlineOperators.length} operadores online.`}
      >
        <span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />
        <span>{label}</span>
        <span className="text-[#9aa6b4]">·</span>
        <span>{realtime.onlineOperators.length} online</span>
      </div>
    </OpsRealtimeContext.Provider>
  );
}

"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { WHATSAPP_NUMBER } from "@/lib/contact";

/**
 * Cuenta cada toque a un botón de WhatsApp de allok (…3684), en cualquier
 * página, con un solo listener: no hay que envolver cada CTA. Junto con la
 * fuente «web» que ve el agente (el primer mensaje trae «vengo de allok.fun»),
 * da la tasa de clic → conversación por página.
 * ponytail: los eventos propios de Vercel Analytics necesitan el plan Pro; en
 * Hobby `track` no hace nada.
 */
export default function WhatsappClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (!href.includes(`wa.me/${WHATSAPP_NUMBER}`)) return;
      const prefill = new URL(href, location.href).searchParams.get("text") ?? "";
      track("whatsapp_opened", {
        path: location.pathname,
        cta: (link?.textContent ?? "").trim().slice(0, 40),
        prefill: prefill.replace(/^Hola, vengo de allok\.fun\.\s*/, "").slice(0, 60),
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

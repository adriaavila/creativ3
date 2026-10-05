"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import {
  STORAGE_KEY,
  buildFirstTouch,
  externalReferrerHost,
  isRegisterHref,
  mergeIntoRegisterUrl,
  parseStoredOrigen,
  type Origen,
} from "@/lib/signup-attribution";

type Fbq = (command: "track", event: string, params?: Record<string, unknown>) => void;

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(origen: Origen): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(origen));
  } catch {
    // Modo privado o almacenamiento bloqueado: el origen viaja solo en esta visita.
  }
}

/**
 * Lleva el origen de la visita (utm, fbclid, la página de llegada…) hasta el
 * registro del CRM, que vive en otro dominio y lo lee de su propia URL.
 *
 * - Al cargar guarda el **primer toque** en localStorage (`allok_origen`) si la
 *   URL trae parámetros de la lista blanca y no había uno guardado.
 * - Un solo listener en captura sobre `document` reescribe el href de
 *   cualquier enlace a `CRM_APP_URL/register` justo antes de navegar, sin
 *   pisar lo que el enlace ya trae (`plan=`).
 * - Cuenta el clic (`signup_click`) y, con el Pixel de Meta cargado, `Lead`.
 */
export default function SignupAttribution() {
  useEffect(() => {
    // Lo de esta visita, para cuando no hay primer toque guardado.
    const visit: Origen = {
      landing: location.pathname,
      referrer: externalReferrerHost(document.referrer, location.hostname),
    };

    if (!readStored()) {
      const firstTouch = buildFirstTouch({
        search: location.search,
        pathname: location.pathname,
        referrer: document.referrer,
        currentHost: location.hostname,
      });
      if (firstTouch) writeStored(firstTouch);
    }

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || !isRegisterHref(link.href)) return;

      const stored = parseStoredOrigen(readStored());
      const origen: Origen = Object.keys(stored).length > 0 ? stored : visit;
      link.href = mergeIntoRegisterUrl(link.href, origen);

      // El clic medio también navega, pero se cuenta solo el principal.
      if (event.type !== "click") return;
      track("signup_click", { source: origen.utm_source ?? origen.referrer ?? "direct" });
      const fbq = (window as unknown as { fbq?: Fbq }).fbq;
      if (typeof fbq === "function") {
        try {
          fbq("track", "Lead");
        } catch {
          // El Pixel nunca frena el registro.
        }
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("auxclick", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("auxclick", onClick, { capture: true });
    };
  }, []);
  return null;
}

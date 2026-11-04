"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { useFicha } from "./useFicha";

type PropsFicha = { id: string | null; onClose: () => void; onGo: (id: string) => void };

// Ficha.tsx, y con ella PIEZAS e HISTORIAS, viaja en su propio trozo de JS: la portada no lo carga al
// abrir, solo cuando alguien va a tocar una captura. Se pide una vez; si falla, el próximo intento la
// vuelve a pedir.
let cargada: ComponentType<PropsFicha> | null = null;
let pedido: Promise<ComponentType<PropsFicha>> | null = null;

function cargar(): Promise<ComponentType<PropsFicha>> {
  pedido ??= import("./Ficha").then(
    (m) => {
      cargada = m.default;
      return m.default;
    },
    (e: unknown) => {
      pedido = null;
      throw e;
    },
  );
  return pedido;
}

const sinModificadores = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * La ficha en la portada. Un solo oyente en el documento para todo
 * `[data-abrir-pieza]`: un clic sin teclas de por medio abre la ficha de esa
 * pieza en vez de seguir el enlace (que, sin JS o antes de hidratar, lleva a
 * /trabajo#pieza=… y funciona igual). Con Ctrl, Cmd, Shift o el botón del
 * medio el enlace hace lo suyo. `ids` son las piezas que se pueden abrir; los
 * pasa el servidor para que PIEZAS no viaje en el JS inicial.
 */
export default function FichaIsla({ ids }: { ids: string[] }) {
  const { abierta, abrir, ir, cerrar } = useFicha(ids);
  const router = useRouter();
  const [Ficha, setFicha] = useState<ComponentType<PropsFicha> | null>(() => cargada);
  const clave = ids.join(" ");

  // Hace falta la ficha (un toque, un enlace directo con #pieza=, Atrás o Adelante) y todavía no llegó. Si
  // no llega (sin red, o un despliegue nuevo que ya no tiene ese trozo), la pieza se abre en /trabajo, que
  // la trae en su propio JS; si tampoco puede, el router de Next termina en una carga completa.
  useEffect(() => {
    if (!abierta || Ficha) return;
    let vigente = true;
    cargar().then(
      (F) => setFicha(() => F),
      () => {
        if (vigente) router.push(`/trabajo#pieza=${encodeURIComponent(abierta)}`);
      },
    );
    return () => {
      vigente = false;
    };
  }, [abierta, Ficha, router]);

  useEffect(() => {
    const validos = new Set(clave.split(" "));
    const pieza = (e: Event): string | null => {
      const el = e.target instanceof Element ? e.target.closest("[data-abrir-pieza]") : null;
      const id = el?.getAttribute("data-abrir-pieza");
      return id && validos.has(id) ? id : null;
    };
    const alTocar = (e: MouseEvent) => {
      if (e.defaultPrevented || !sinModificadores(e)) return;
      const id = pieza(e);
      if (!id) return;
      e.preventDefault();
      abrir(id);
      cargar().catch(() => undefined);
    };
    // El dedo que baja, el mouse encima o el foco del teclado adelantan la descarga.
    const alAcercarse = (e: Event) => {
      if (!cargada && pieza(e)) cargar().catch(() => undefined);
    };
    document.addEventListener("click", alTocar);
    document.addEventListener("pointerdown", alAcercarse, { passive: true });
    document.addEventListener("pointerover", alAcercarse, { passive: true });
    document.addEventListener("focusin", alAcercarse);
    return () => {
      document.removeEventListener("click", alTocar);
      document.removeEventListener("pointerdown", alAcercarse);
      document.removeEventListener("pointerover", alAcercarse);
      document.removeEventListener("focusin", alAcercarse);
    };
  }, [clave, abrir]);

  return Ficha ? <Ficha id={abierta} onClose={cerrar} onGo={ir} /> : null;
}

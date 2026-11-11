"use client";

import { useEffect, useRef } from "react";

// Venezuela vive en UTC-4 todo el año, sin horario de verano, desde mayo de 2016 (Bolivia también): la hora sale
// de restar 4 h, sin Intl. El primer Intl.DateTimeFormat de una página carga los datos de ICU, y eso eran de 70
// a 120 ms de una sola tarea al hidratar en un teléfono 4x más lento. Si el huso vuelve a cambiar, se cambia aquí.
const DESFASE = -4 * 60 * 60 * 1000;

/** «3:07 p. m.», como lo escribe Intl con es-VE (comprobado minuto a minuto): 12 del mediodía es «12:00 p. m.». */
function hora(ahora: number): string {
  const d = new Date(ahora + DESFASE);
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "a." : "p."} m.`;
}

/**
 * La hora de Adrián en Venezuela, en la fila de «Te contesto yo». La página es
 * estática y no sabe qué hora será: llega vacía y, mientras lo está, el CSS
 * esconde la hora y el lugar (ocupan su sitio sin verse), así que llenarla no
 * mueve nada que se vea. Cambia al cambiar el minuto, sin animación, y solo
 * con la pestaña a la vista. Escribe el texto en el nodo: React no vuelve a
 * pintar nada.
 */
export default function Reloj() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = 0;
    const tic = () => {
      window.clearTimeout(t);
      if (document.hidden) return;
      el.textContent = hora(Date.now());
      // Justo después del cambio de minuto, no 60 s desde ahora: la hora nunca se queda atrás.
      t = window.setTimeout(tic, 60_000 - (Date.now() % 60_000) + 50);
    };
    tic();
    document.addEventListener("visibilitychange", tic);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", tic);
    };
  }, []);

  return <span ref={ref} className="reloj" />;
}

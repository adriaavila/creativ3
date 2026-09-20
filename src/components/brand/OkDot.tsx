"use client";

import { useEffect, useRef } from "react";
import { DOT_SEGMENTS, STATES, type SystemState } from "@/lib/brand";

/**
 * El punto de allok, animado.
 *
 * Reproduce el tramo del Lottie que le toca al estado — esperando, procesando
 * o resuelto — y se queda ahí. `resuelto` no repite: un punto que late para
 * siempre deja de significar «ya está» y pasa a ser decoración.
 *
 * El player pesa 164 KB, así que se carga sólo en el cliente y sólo cuando el
 * punto está en pantalla. Mientras tanto se pinta un círculo CSS del mismo
 * color y del mismo tamaño: si el JS nunca llega, el logo sigue completo y en
 * su estado — que es el requisito, porque la `o` de allok es este punto.
 */
export default function OkDot({
  state,
  size = 14,
  className = "",
}: {
  state: SystemState;
  size?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const def = STATES[state];

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let anim: { destroy: () => void } | null = null;
    let cancelled = false;

    const io = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || anim || cancelled) return;
      io.disconnect();
      const [{ default: lottie }, res] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        fetch("/lottie/ok-dot.json"),
      ]);
      if (cancelled) return;
      const animationData = await res.json();
      // El verde del archivo es el de `activo`; para los otros estados se
      // repinta el trazo y el relleno, así un solo Lottie sirve a los cuatro.
      const rgb = [1, 3, 5].map((i) => parseInt(def.dot.slice(i, i + 2), 16) / 255);
      for (const layer of animationData.layers)
        for (const group of layer.shapes)
          for (const item of group.it)
            if (item.ty === "st" || item.ty === "fl") item.c.k = [...rgb, 1];

      const [from, to] = DOT_SEGMENTS[def.motion];
      anim = lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: def.motion !== "resuelto",
        autoplay: true,
        animationData,
        initialSegment: [from, to],
      });
      el.dataset.lottie = "on";
    }, { rootMargin: "120px" });

    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      anim?.destroy();
    };
  }, [def.dot, def.motion]);

  return (
    <span
      ref={host}
      role="img"
      aria-label={def.label}
      className={`inline-block shrink-0 rounded-full [&[data-lottie=on]]:bg-transparent ${className}`}
      style={{ width: size, height: size, background: def.dot }}
    />
  );
}

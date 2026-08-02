"use client";

import { useRef, useState } from "react";

/**
 * Gesto de arrastre horizontal para touch, mouse y trackpad — pointer events
 * cubre los tres.
 *
 * El desplazamiento vive en refs además del estado: si `pointermove` y
 * `pointerup` caen en el mismo batch de React (un flick rápido), el handler de
 * `pointerup` leería un delta viejo del closure y se perdería el swipe.
 */
export function useDragSwipe({
  count,
  minDistance = 40,
}: {
  count: number;
  minDistance?: number;
}) {
  const [active, setActive] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const deltaRef = useRef(0);

  const enabled = count > 1;

  const previous = () => setActive((value) => (value === 0 ? count - 1 : value - 1));
  const next = () => setActive((value) => (value === count - 1 ? 0 : value + 1));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    deltaRef.current = 0;
    setDragDelta(0);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return;
    deltaRef.current = e.clientX - startXRef.current;
    setDragDelta(deltaRef.current);
  };

  const endDrag = () => {
    if (startXRef.current === null) return;
    const delta = deltaRef.current;
    startXRef.current = null;
    deltaRef.current = 0;
    setDragDelta(0);
    setDragging(false);
    if (delta > minDistance) previous();
    else if (delta < -minDistance) next();
  };

  /** Props para el contenedor: `touchAction: pan-y` deja el scroll vertical intacto. */
  const dragProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onPointerLeave: dragging ? endDrag : undefined,
    style: { touchAction: "pan-y" as const },
  };

  /** Estilo de la capa que se desplaza con el dedo y vuelve a su sitio al soltar. */
  const trackStyle = {
    transform: `translateX(${dragDelta}px)`,
    transition: dragging ? "none" : "transform 0.35s ease-out",
  };

  return { active, setActive, previous, next, dragging, enabled, dragProps, trackStyle };
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const TRAIL_COUNT = 6;

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    document.documentElement.classList.add("cursor-hidden");

    gsap.set([cursor, ring, ...trailRefs.current], { xPercent: -50, yPercent: -50 });

    const xSetter = gsap.quickSetter(cursor, "x", "px");
    const ySetter = gsap.quickSetter(cursor, "y", "px");

    // Ring follows with lag
    const moveCursor = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      xSetter(e.clientX);
      ySetter(e.clientY);
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // Trail dots with increasing lag
    let raf: number;
    const positions: { x: number; y: number }[] = Array(TRAIL_COUNT).fill({ x: -100, y: -100 });

    const updateTrail = () => {
      positions.unshift({ ...posRef.current });
      positions.length = TRAIL_COUNT;

      trailRefs.current.forEach((dot, i) => {
        if (!dot || !positions[i + 1]) return;
        const target = positions[i + 1];
        gsap.set(dot, {
          x: target.x,
          y: target.y,
          opacity: 1 - (i + 1) / (TRAIL_COUNT + 1),
          scale: 1 - (i + 1) * 0.12,
        });
      });

      raf = requestAnimationFrame(updateTrail);
    };
    raf = requestAnimationFrame(updateTrail);

    const handleHover = () => {
      gsap.to(cursor, { scale: 2, duration: 0.3, ease: "back.out(2)" });
      gsap.to(ring, { scale: 2.8, opacity: 0.8, borderColor: "var(--cobalto)", duration: 0.3, ease: "back.out(2)" });
    };

    const handleLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(ring, { scale: 1, opacity: 0.55, borderColor: "var(--lima)", duration: 0.3, ease: "power2.out" });
    };

    window.addEventListener("mousemove", moveCursor);

    const attachListeners = () => {
      const targets = document.querySelectorAll("a, button, input, [role='button'], .hover-target");
      targets.forEach((el) => {
        el.addEventListener("mouseenter", handleHover);
        el.addEventListener("mouseleave", handleLeave);
      });
    };

    attachListeners();

    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", moveCursor);
      const targets = document.querySelectorAll("a, button, input, [role='button'], .hover-target");
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", handleHover);
        el.removeEventListener("mouseleave", handleLeave);
      });
      observer.disconnect();
      document.documentElement.classList.remove("cursor-hidden");
    };
  }, []);

  return (
    <>
      {/* Trail dots */}
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="fixed top-0 left-0 pointer-events-none rounded-full hidden sm:block"
          style={{
            width: 6,
            height: 6,
            background: "var(--lima)",
            zIndex: 9994 + i,
            opacity: 0,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Ring */}
      <div
        ref={ringRef}
        className="cc-ring fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border opacity-55 hidden sm:block"
        style={{ width: 44, height: 44, borderWidth: "1.5px" }}
      />

      {/* Core dot */}
      <div
        ref={cursorRef}
        className="cc-dot fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden sm:block"
        style={{ width: 8, height: 8 }}
      />
    </>
  );
}

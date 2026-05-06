"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function PageLoadChoreography() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) return;

    const tl = gsap.timeline();

    // Animate counter 0 → 100
    const obj = { val: 0 };
    tl.to(obj, {
      val: 100,
      duration: 1.1,
      ease: "power2.inOut",
      onUpdate: () => setCount(Math.round(obj.val)),
    });

    // Progress bar fill
    tl.to(barRef.current, {
      scaleX: 1,
      duration: 1.1,
      ease: "power2.inOut",
    }, "<");

    // Fade out word
    tl.to(wordRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in",
    });

    // Wipe overlay up
    tl.to(overlay, {
      yPercent: -100,
      duration: 1,
      ease: "power4.inOut",
      onComplete: () => {
        if (overlay) overlay.style.display = "none";
      },
    });
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9000] bg-noche-deep flex flex-col items-center justify-center pointer-events-none"
    >
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(42,110,160,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,110,160,0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Center content */}
      <div ref={wordRef} className="relative flex flex-col items-center gap-6">
        <div className="font-display text-2xl tracking-tight text-papiro">
          Servicios<span className="text-cobalto italic">Creativos</span>
        </div>

        <span
          ref={counterRef}
          className="font-mono text-7xl tabular-nums text-cobalto"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {String(count).padStart(2, "0")}
        </span>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-noche-rise">
        <div
          ref={barRef}
          className="h-full origin-left"
          style={{
            transform: "scaleX(0)",
            background: "linear-gradient(90deg, var(--cobalto), var(--lima))",
            boxShadow: "0 0 12px rgba(42,110,160,0.9)",
          }}
        />
      </div>

      {/* Corner coordinates */}
      <div className="absolute bottom-8 left-8 font-mono text-xs text-papiro/30">
        10.4806° N, 66.9036° W
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-xs text-papiro/30">
        MMXXVI
      </div>
    </div>
  );
}

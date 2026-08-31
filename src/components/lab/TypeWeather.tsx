"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Type, and a flow field pushes the letters around; the pointer shoves them
 * out of the way. The question it answers: how much can type move before it
 * stops being readable? Answer lives in the Turbulence slider — past ~60 it
 * is a texture, not a word.
 *
 * ponytail: transforms are written straight to the DOM in one rAF loop, not
 * held in React state. Sixty re-renders a second to move some spans would be
 * the whole cost of this toy for none of the benefit.
 */
export default function TypeWeather({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState("INDUSTRIAL ENGINEER");
  const [turbulence, setTurbulence] = useState(34);
  const stage = useRef<HTMLDivElement>(null);
  const knobs = useRef({ turbulence: 34, mx: -999, my: -999 });

  // Mirrored into a ref so the rAF loop reads the live value without the
  // loop itself becoming a dependency and restarting on every drag.
  useEffect(() => {
    knobs.current.turbulence = turbulence;
  }, [turbulence]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const time = (now - start) / 1000;
      const amp = knobs.current.turbulence;
      const letters = el.querySelectorAll<HTMLElement>("[data-glyph]");

      letters.forEach((glyph, i) => {
        // Two out-of-phase sines per axis: cheap, and it reads as wind
        // rather than as a wave, which one sine always does.
        const drift =
          Math.sin(time * 0.9 + i * 0.42) * 0.6 + Math.sin(time * 1.7 + i * 0.19) * 0.4;
        let x = drift * amp * 0.55;
        let y = Math.cos(time * 1.1 + i * 0.31) * amp * 0.42;

        const box = glyph.getBoundingClientRect();
        const dx = box.left + box.width / 2 - knobs.current.mx;
        const dy = box.top + box.height / 2 - knobs.current.my;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          const push = (1 - dist / 180) ** 2 * 90;
          x += (dx / (dist || 1)) * push;
          y += (dy / (dist || 1)) * push;
        }

        glyph.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      knobs.current.mx = e.clientX;
      knobs.current.my = e.clientY;
    };
    const onLeave = () => {
      knobs.current.mx = -999;
      knobs.current.my = -999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="grid gap-px bg-[var(--rule)]">
      <div
        ref={stage}
        className="sky-plate flex items-center justify-center overflow-hidden p-6"
        style={{ minHeight: compact ? 190 : 340 }}
      >
        <p
          aria-label={text}
          className="sky-over macro select-none text-center !text-[clamp(1.6rem,7vw,5rem)] !leading-[0.95]"
        >
          {text.split(" ").map((word, w, words) => (
            // Words stay whole while their letters still move independently.
            // Without this wrapper a run of inline-block glyphs breaks
            // mid-word at any width.
            <span key={`${word}-${w}`} className="inline-block whitespace-nowrap">
              {[...word].map((ch, i) => (
                <span
                  // Index keys are right here: these are glyph slots in a
                  // string, not identities, and they re-key every keystroke.
                  key={`${ch}-${i}`}
                  data-glyph
                  aria-hidden="true"
                  className="inline-block will-change-transform"
                >
                  {ch}
                </span>
              ))}
              {w < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
            </span>
          ))}
        </p>
      </div>

      <div className="grid gap-4 bg-[var(--paper)] p-5 sm:grid-cols-[1fr_240px] sm:items-end sm:gap-8 sm:p-6">
        <label className="mono grid gap-2">
          <span className="text-[var(--carbon-2)]">Type something</span>
          <input
            value={text}
            maxLength={40}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            className="mono w-full border border-[var(--rule)] bg-[var(--paper-2)] px-4 py-3 [letter-spacing:0.08em] focus-visible:border-[var(--hazard)]"
          />
        </label>
        <label className="mono grid gap-2">
          <span className="flex items-center justify-between text-[var(--carbon-2)]">
            Turbulence
            <output className="tabular-nums text-[var(--hazard)]">{turbulence}</output>
          </span>
          <input
            type="range"
            min={0}
            max={90}
            value={turbulence}
            onChange={(e) => setTurbulence(Number(e.target.value))}
            className="h-1 w-full appearance-none bg-[var(--rule)] accent-[var(--hazard)]"
          />
        </label>
      </div>
    </div>
  );
}

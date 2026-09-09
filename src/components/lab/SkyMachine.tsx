"use client";

import { useState } from "react";
import { skyPalette, skyVars } from "@/lib/sky";

const KNOBS = [
  { id: "t", label: "Time of day", min: 0, max: 1, step: 0.01 },
  { id: "spread", label: "Glow spread", min: 20, max: 90, step: 1 },
  { id: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01 },
] as const;

/**
 * The engine behind every sky plate on this site, with its knobs exposed.
 * It writes the same custom properties `SkyDriver` writes — scoped to this
 * box instead of <html>, so playing here never hijacks the page you are on.
 */
export default function SkyMachine({ compact = false }: { compact?: boolean }) {
  const [t, setT] = useState(0.28);
  const [spread, setSpread] = useState(42);
  const [grain, setGrain] = useState(0.18);

  const vars = skyVars(t);
  const palette = skyPalette(t);
  const value = { t, spread, grain } as Record<string, number>;
  const set: Record<string, (n: number) => void> = { t: setT, spread: setSpread, grain: setGrain };

  return (
    <div className="grid gap-px bg-[var(--rule)]">
      <button type="button" className="lab-reset mono" onClick={() => { setT(.28); setSpread(42); setGrain(.18); }}>Reset sky ↺</button>
      <div
        className="sky-plate relative bg-[var(--paper)]"
        style={{ ...vars, "--sky-glow": `${spread}px`, height: compact ? 190 : 420 } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="sky-over pointer-events-none !absolute inset-0 mix-blend-soft-light"
          style={{
            opacity: grain,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <span className="sky-over mono !absolute bottom-4 left-5 opacity-90">
          t = {t.toFixed(2)} · {t < 0.34 ? "dawn" : t < 0.7 ? "transit" : "dusk"}
        </span>
      </div>

      <div className="grid gap-5 bg-[var(--paper)] p-5 sm:p-6">
        {KNOBS.map((knob) => (
          <label key={knob.id} className="mono grid gap-2">
            <span className="flex items-center justify-between text-[var(--carbon-2)]">
              {knob.label}
              <output className="tabular-nums text-[var(--hazard)]">
                {value[knob.id].toFixed(knob.step < 1 ? 2 : 0)}
              </output>
            </span>
            <input
              type="range"
              min={knob.min}
              max={knob.max}
              step={knob.step}
              value={value[knob.id]}
              onChange={(e) => set[knob.id](Number(e.target.value))}
              className="h-1 w-full appearance-none bg-[var(--rule)] accent-[var(--hazard)]"
            />
          </label>
        ))}

        {!compact ? (
          <pre className="mono overflow-x-auto border border-[var(--rule)] bg-[var(--paper-2)] p-4 [letter-spacing:0.02em] [text-transform:none]">
            {`--sky-high: ${vars["--sky-high"]};
--sky-mid:  ${vars["--sky-mid"]};
--sky-low:  ${vars["--sky-low"]};
--cloud-lit: ${vars["--cloud-lit"]};
/* ink contrast holds AA across the whole range — see src/lib/sky.test.ts */`}
          </pre>
        ) : null}

        {!compact ? (
          <p className="mono flex flex-wrap gap-x-6 gap-y-2 text-[var(--carbon-3)] [letter-spacing:0.02em] [text-transform:none]">
            {(["high", "mid", "low", "cloudLit", "cloudShade"] as const).map((key) => (
              <span key={key} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 border border-[var(--rule)]"
                  style={{ background: `rgb(${palette[key].join(" ")})` }}
                />
                {key}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}

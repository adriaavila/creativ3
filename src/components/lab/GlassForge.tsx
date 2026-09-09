"use client";

import { useState } from "react";

const KNOBS = [
  { id: "blur", label: "Backdrop blur", min: 0, max: 30, step: 1, unit: "px" },
  { id: "saturate", label: "Saturate", min: 100, max: 260, step: 5, unit: "%" },
  { id: "tint", label: "Ink tint", min: 0, max: 100, step: 1, unit: "%" },
  { id: "rim", label: "Rim chroma", min: 0, max: 100, step: 1, unit: "%" },
  { id: "bloom", label: "Bloom under", min: 0, max: 40, step: 1, unit: "px" },
  { id: "radius", label: "Radius", min: 0, max: 999, step: 1, unit: "px" },
] as const;

const DEFAULTS: Record<string, number> = {
  blur: 14,
  saturate: 180,
  tint: 92,
  rim: 100,
  bloom: 19,
  radius: 999,
};

/**
 * The liquid-glass kit, live. The rest of the site allows exactly one round
 * translucent object per page; this is the workshop where that object gets
 * made, so here the rule is suspended on purpose.
 */
export default function GlassForge({ compact = false }: { compact?: boolean }) {
  const [v, setV] = useState(DEFAULTS);
  const [copied, setCopied] = useState(false);

  const rim = v.rim / 100;
  const css = `.lens {
  border-radius: ${v.radius}px;
  padding: 1.5px;
  background: linear-gradient(120deg,
    rgb(255 95 162 / ${rim.toFixed(2)}),
    rgb(95 215 255 / ${rim.toFixed(2)}) 48%,
    rgb(197 240 74 / ${rim.toFixed(2)}));
}
.lens > * {
  border-radius: ${v.radius}px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / .24), rgb(255 255 255 / .03) 48%, rgb(255 154 61 / .14)),
    rgb(10 10 10 / ${(v.tint / 100).toFixed(2)});
  backdrop-filter: blur(${v.blur}px) saturate(${v.saturate}%);
  box-shadow: inset 0 1.5px 0 rgb(255 255 255 / .6),
              inset 0 -2px 4px rgb(255 154 61 / .28);
}
.lens::before { /* the puddle of light underneath */
  filter: blur(${v.bloom}px);
}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-px bg-[var(--rule)]">
      <button type="button" className="lab-reset mono" onClick={() => setV(DEFAULTS)}>Reset glass ↺</button>
      <div
        className="sky-plate flex items-center justify-center gap-6 p-8"
        style={{ minHeight: compact ? 190 : 300 }}
      >
        <div className="sky-over inline-flex" style={{ borderRadius: v.radius, padding: 1.5, background: `linear-gradient(120deg, rgb(255 95 162 / ${rim}), rgb(95 215 255 / ${rim}) 48%, rgb(197 240 74 / ${rim}))` }}>
          <span
            aria-hidden="true"
            className="absolute inset-x-4 -bottom-3 h-9"
            style={{
              borderRadius: v.radius,
              filter: `blur(${v.bloom}px)`,
              background: "linear-gradient(90deg, #ff5fa2cc, rgb(255 154 61), #c5f04ab3)",
            }}
          />
          <span
            className="relative px-8 py-4 text-[17px] font-semibold text-[var(--sky-ink)]"
            style={{
              borderRadius: v.radius,
              background: `linear-gradient(180deg, rgb(255 255 255 / .24), rgb(255 255 255 / .03) 48%, rgb(255 154 61 / .14)), rgb(10 10 10 / ${v.tint / 100})`,
              backdropFilter: `blur(${v.blur}px) saturate(${v.saturate}%)`,
              WebkitBackdropFilter: `blur(${v.blur}px) saturate(${v.saturate}%)`,
              boxShadow: "inset 0 1.5px 0 rgb(255 255 255 / .6), inset 0 -2px 4px rgb(255 154 61 / .28)",
            }}
          >
            Start a project
          </span>
        </div>
      </div>

      <div className="grid gap-4 bg-[var(--paper)] p-5 sm:grid-cols-2 sm:gap-x-8 sm:p-6">
        {KNOBS.map((knob) => (
          <label key={knob.id} className="mono grid gap-2">
            <span className="flex items-center justify-between text-[var(--carbon-2)]">
              {knob.label}
              <output className="tabular-nums text-[var(--hazard)]">
                {v[knob.id]}
                {knob.unit}
              </output>
            </span>
            <input
              type="range"
              min={knob.min}
              max={knob.max}
              step={knob.step}
              value={v[knob.id]}
              onChange={(e) => setV({ ...v, [knob.id]: Number(e.target.value) })}
              className="h-1 w-full appearance-none bg-[var(--rule)] accent-[var(--hazard)]"
            />
          </label>
        ))}
      </div>

      {!compact ? (
        <div className="bg-[var(--paper)] p-5 sm:p-6">
          <div className="mono flex items-center justify-between">
            <span className="text-[var(--carbon-3)]">[ Output ]</span>
            <div className="flex gap-4">
              <button type="button" onClick={copy} className="text-[var(--hazard)] hover:underline">
                {copied ? "Copied ✓" : "Copy CSS"}
              </button>
            </div>
          </div>
          <pre className="mono mt-4 overflow-x-auto border border-[var(--rule)] bg-[var(--paper-2)] p-4 [letter-spacing:0.02em] [text-transform:none]">
            {css}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Line = { kind: "cmd" | "out" | "ok" | "note"; text: string };

// A replay of the shape of a real build session. Nothing here reaches an
// API: showing a workflow should not bill the person looking at it.
const SCRIPT: Line[] = [
  { kind: "cmd", text: 'claude "checkout is dropping the receipt on retry"' },
  { kind: "out", text: "→ reading src/lib/billing/catalog.ts, api/stripe/webhook" },
  { kind: "out", text: "→ the email fires after the row is persisted" },
  { kind: "out", text: "→ a retried webhook sees the row and skips the send" },
  { kind: "ok", text: "✓ send the receipt first, key it on the session id" },
  { kind: "out", text: "→ 1 file changed · check:billing green" },
  { kind: "cmd", text: 'git commit -m "fix(billing): send the receipt before persisting"' },
  { kind: "note", text: "I read every diff before it lands. The agent is fast, not trusted." },
];

const COLOUR: Record<Line["kind"], string> = {
  cmd: "text-[#5fd7ff]",
  out: "text-[var(--paper)]/55",
  ok: "text-[#c5f04a]",
  note: "text-[#ff6b6b]",
};

/**
 * ponytail: a local 40-line replay instead of a vendored terminal component.
 * The library version carried its own lint failures and an in-view trigger
 * this page does not need — a line counter on an interval is the whole job.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  const subscribe = useCallback((notify: () => void) => {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", notify);
    return () => mql.removeEventListener("change", notify);
  }, []);
  // Subscribed rather than read once, so flipping the OS setting settles the
  // replay live — and so the effect below never has to setState on mount.
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export default function AgentTerminal({ compact = false }: { compact?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [typed, setTyped] = useState(0);
  const [replay, setReplay] = useState(0);
  const shown = reduced ? SCRIPT.length : typed;

  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = false;
    const update = () => {
      clearInterval(timer);
      if (visible && !document.hidden) timer = setInterval(() => {
        setTyped(n => { if (n + 1 >= SCRIPT.length) clearInterval(timer); return Math.min(SCRIPT.length, n + 1); });
      }, 620);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (stage.current) observer.observe(stage.current);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [reduced, replay]);

  return (
    <div ref={stage} className="grid gap-px bg-[var(--rule)]">
      <button type="button" className="lab-reset mono" onClick={() => { setTyped(0); setReplay(n => n + 1); }}>Replay session ↺</button>
      <div
        className="bg-[var(--carbon)] p-5 font-[family-name:var(--font-jetbrains)] text-[13px] leading-[1.9] text-[var(--paper)] sm:p-6"
        style={{ minHeight: compact ? 190 : 300 }}
      >
        <div aria-hidden="true" className="mb-4 flex gap-2">
          <span className="h-2 w-2 rounded-full bg-[#e0687a]" />
          <span className="h-2 w-2 rounded-full bg-[#f0c04a]" />
          <span className="h-2 w-2 rounded-full bg-[#7ee0a8]" />
        </div>
        <pre className="overflow-x-auto">
          <code>
            {SCRIPT.slice(0, shown).map((line, i) => (
              <span key={line.text} className={`block ${COLOUR[line.kind]}`}>
                {line.kind === "cmd" ? <span className="text-[#5fd7ff]">$ </span> : null}
                {line.text}
                {i === shown - 1 && shown < SCRIPT.length ? (
                  <span className="ml-1 animate-pulse">▊</span>
                ) : null}
              </span>
            ))}
          </code>
        </pre>
      </div>

      {!compact ? (
        <div className="bg-[var(--paper)] p-5 sm:p-6">
          <p className="mono text-[var(--carbon-2)] [letter-spacing:0.02em] [text-transform:none]">
            A replay, not a live model — nothing on this page calls an API, so it costs you nothing
            to watch. The bug is real: it shipped as commit{" "}
            <code className="text-[var(--hazard)]">800ab1a</code> on this repository.
          </p>
        </div>
      ) : null}
    </div>
  );
}

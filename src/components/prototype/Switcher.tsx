"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * PROTOTIPO — no es parte del producto.
 *
 * Barra flotante para saltar entre variantes de una misma ruta. Se esconde en
 * producción, así que un merge despistado no la publica.
 */
export type VariantDef = { key: string; name: string };

export default function Switcher({ variants, current }: { variants: VariantDef[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  useEffect(() => {
    function go(step: number) {
      const next = variants[(index + step + variants.length) % variants.length];
      const q = new URLSearchParams(params.toString());
      q.set("variant", next.key);
      router.replace(`${pathname}?${q}`, { scroll: false });
    }
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, params, pathname, router, variants]);

  if (process.env.NODE_ENV === "production") return null;

  const step = (n: number) => {
    const next = variants[(index + n + variants.length) % variants.length];
    const q = new URLSearchParams(params.toString());
    q.set("variant", next.key);
    return `${pathname}?${q}`;
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-[999] -translate-x-1/2 select-none">
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#08090a] p-1 pr-1 text-[#f5f4f0] shadow-[0_18px_40px_-12px_rgba(0,0,0,.7)]">
        <a
          href={step(-1)}
          aria-label="Variante anterior"
          className="grid size-9 place-items-center rounded-full text-lg leading-none transition-colors hover:bg-white/10"
        >
          ‹
        </a>
        <span className="px-3 font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums">
          {variants[index].key} · {variants[index].name}
          <span className="ml-2 opacity-40">
            {index + 1}/{variants.length}
          </span>
        </span>
        <a
          href={step(1)}
          aria-label="Variante siguiente"
          className="grid size-9 place-items-center rounded-full text-lg leading-none transition-colors hover:bg-white/10"
        >
          ›
        </a>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SITE, shareLinks } from "@/lib/pen-ideas";

/**
 * Compartir una idea (o la página): copiar el enlace, la hoja de compartir del
 * teléfono cuando existe, y WhatsApp, X y LinkedIn como `<a>` simples, que
 * funcionan sin JavaScript. La imagen que se ve al pegar el enlace sale de
 * `opengraph-image.tsx`.
 */
export default function PenShare({ path, text, label = "Pass it on" }: { path: string; text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  // La hoja de compartir del teléfono solo existe en el navegador: en el servidor no se ofrece.
  const native = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );
  const url = `${SITE}${path}`;


  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Sin permiso para el portapapeles: el enlace queda a la vista para copiarlo a mano.
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="pen-share">
      <p className="pen-label">{label}</p>
      <ul className="pen-share-row">
        <li>
          <button type="button" className="pen-chip is-ink" onClick={copy} aria-live="polite">
            {copied ? "Link copied" : "Copy link"}
          </button>
        </li>
        {native ? (
          <li>
            <button type="button" className="pen-chip" onClick={() => navigator.share({ title: text, text, url }).catch(() => {})}>
              Share…
            </button>
          </li>
        ) : null}
        {shareLinks(path, text).map((link) => (
          <li key={link.id}>
            <a className="pen-chip" href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

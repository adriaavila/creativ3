"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function CustomerPortalButton({
  locale,
  sessionId,
  label,
}: {
  locale: Locale;
  sessionId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, locale }),
        });
        const body = (await response.json()) as { url?: string };
        if (body.url) window.location.assign(body.url);
        else setLoading(false);
      }}
      className="rounded-full border border-black/15 px-7 py-3 text-sm font-semibold transition-colors duration-200 hover:border-black disabled:opacity-60"
    >
      {loading ? "…" : label}
    </button>
  );
}

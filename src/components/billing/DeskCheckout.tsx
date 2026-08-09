"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { Locale, Messages } from "@/lib/i18n";

const planKeys = ["desk-cohort", "desk", "desk-scale"] as const;

export default function DeskCheckout({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages["desk"];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function checkout(item: (typeof planKeys)[number]) {
    setLoading(item);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ item, locale }),
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error);
      window.location.assign(body.url);
    } catch {
      setError(messages.error);
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {planKeys.map((key, index) => {
        const [name, monthly, setup, description] = messages.plans[key];
        const active = loading === key;
        const featured = index === 1;
        return (
          <article
            key={key}
            className={`flex flex-col rounded-[var(--r-xl)] border p-7 transition duration-200 hover:-translate-y-1 ${
              featured
                ? "border-[var(--lima)] bg-[var(--surface-2)] shadow-[var(--shadow-3)]"
                : "border-[var(--line)] bg-[var(--surface-1)]"
            }`}
          >
            <h2 className="text-2xl font-medium text-[var(--text-primary)]">allok {name}</h2>
            <div className="mt-5 flex items-baseline gap-1.5">
              <strong className="font-mono text-4xl text-[var(--text-primary)]">{monthly}</strong>
              <span className="text-[var(--text-tertiary)]">{messages.monthly}</span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              + {setup} {messages.setup}
            </p>
            <p className="mt-6 flex-1 leading-relaxed text-[var(--text-secondary)]">{description}</p>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => checkout(key)}
              className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${
                featured
                  ? "bg-[var(--lima)] text-[var(--lima-ink)]"
                  : "border border-[var(--line)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {active ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  {messages.loading}
                </>
              ) : (
                <>
                  {messages.checkout} <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </article>
        );
      })}
      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--status-lost)] lg:col-span-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}

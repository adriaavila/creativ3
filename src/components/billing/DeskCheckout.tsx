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
        return (
          <article
            key={key}
            className={`flex flex-col rounded-3xl border p-7 transition duration-200 hover:-translate-y-1 ${
              index === 1
                ? "border-black bg-black text-white shadow-[0_24px_60px_rgba(0,0,0,.2)]"
                : "border-neutral-200 bg-white"
            }`}
          >
            <h2 className="text-2xl font-semibold">allok {name}</h2>
            <div className="mt-5 flex items-baseline gap-1.5">
              <strong className="text-4xl">{monthly}</strong>
              <span className={index === 1 ? "text-neutral-400" : "text-neutral-500"}>
                {messages.monthly}
              </span>
            </div>
            <p className={`mt-3 text-sm ${index === 1 ? "text-neutral-300" : "text-neutral-600"}`}>
              + {setup} {messages.setup}
            </p>
            <p className={`mt-6 flex-1 leading-relaxed ${index === 1 ? "text-neutral-300" : "text-neutral-600"}`}>
              {description}
            </p>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => checkout(key)}
              className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${
                index === 1 ? "bg-[#c5f04a] text-black" : "bg-black text-white"
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
        <p role="alert" className="text-sm font-medium text-red-700 lg:col-span-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}

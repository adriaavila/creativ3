import Link from "next/link";
import { Check, X } from "lucide-react";
import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import type { Locale, Messages } from "@/lib/i18n";

export default function PaymentResult({
  locale,
  messages,
  status,
  sessionId,
}: {
  locale: Locale;
  messages: Messages;
  status: "success" | "canceled";
  sessionId?: string;
}) {
  const success = status === "success";
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-24 text-black">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-black/15">
          {success ? <Check className="h-8 w-8" aria-hidden /> : <X className="h-8 w-8 text-neutral-400" aria-hidden />}
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[.18em] text-neutral-500">
          allok Desk
        </p>
        <h1 className="mt-4 text-[clamp(2.5rem,7vw,4.5rem)] font-semibold tracking-[-.045em]">
          {success ? messages.payment.successTitle : messages.payment.cancelTitle}
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
          {success ? messages.payment.successBody : messages.payment.cancelBody}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {success ? (
            <Link
              href={sessionId ? `/conectar-whatsapp?session_id=${encodeURIComponent(sessionId)}` : `/${locale}/desk`}
              className="rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-neutral-800"
            >
              {messages.payment.activate}
            </Link>
          ) : (
            <Link
              href={`/${locale}/desk#planes`}
              className="rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-neutral-800"
            >
              {messages.common.prices}
            </Link>
          )}
          {success && sessionId ? (
            <CustomerPortalButton
              locale={locale}
              sessionId={sessionId}
              label={messages.payment.portal}
            />
          ) : null}
          <Link
            href={`/${locale}`}
            className="rounded-full border border-black/15 px-7 py-3 text-sm font-semibold transition-colors duration-200 hover:border-black"
          >
            {messages.common.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

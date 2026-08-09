import Link from "next/link";
import { Check, X } from "lucide-react";
import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import { whatsappUrl } from "@/lib/contact";
import type { Locale, Messages } from "@/lib/i18n";

export default function PaymentResult({
  locale,
  messages,
  status,
  sessionId,
  projectPayment = false,
}: {
  locale: Locale;
  messages: Messages;
  status: "success" | "canceled";
  sessionId?: string;
  projectPayment?: boolean;
}) {
  const success = status === "success";
  projectPayment = success && projectPayment;
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-24">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-1)]">
          {success ? (
            <Check className="h-8 w-8 text-[var(--lima)]" aria-hidden />
          ) : (
            <X className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden />
          )}
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[.18em] text-[var(--text-tertiary)]">
          {projectPayment ? "Servicio a medida" : "allok Desk"}
        </p>
        <h1 className="mt-4 text-[clamp(2.5rem,7vw,4.5rem)] font-medium tracking-[-.035em] text-[var(--text-primary)]">
          {success ? messages.payment.successTitle : messages.payment.cancelTitle}
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--text-secondary)]">
          {projectPayment
            ? "Gracias por confiar en nosotros. Te escribiremos para coordinar el inicio de tu proyecto."
            : success ? messages.payment.successBody : messages.payment.cancelBody}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {projectPayment ? (
            <a
              href={whatsappUrl("Hola Allok, ya realicé el pago de mi servicio a medida.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--lima)] px-7 py-3 text-sm font-semibold text-[var(--lima-ink)] transition-colors duration-200"
            >
              Hablar por WhatsApp
            </a>
          ) : success ? (
            <Link
              href={sessionId ? `/conectar-whatsapp?session_id=${encodeURIComponent(sessionId)}` : `/${locale}/desk`}
              className="rounded-full bg-[var(--lima)] px-7 py-3 text-sm font-semibold text-[var(--lima-ink)] transition-colors duration-200"
            >
              {messages.payment.activate}
            </Link>
          ) : (
            <Link
              href={`/${locale}/desk#planes`}
              className="rounded-full bg-[var(--lima)] px-7 py-3 text-sm font-semibold text-[var(--lima-ink)] transition-colors duration-200"
            >
              {messages.common.prices}
            </Link>
          )}
          {success && sessionId && !projectPayment ? (
            <CustomerPortalButton locale={locale} sessionId={sessionId} label={messages.payment.portal} />
          ) : null}
          <Link
            href={`/${locale}`}
            className="rounded-full border border-[var(--line)] px-7 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--surface-2)]"
          >
            {messages.common.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

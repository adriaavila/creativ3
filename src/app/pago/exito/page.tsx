import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pago completado — Servicios Creativos",
  description: "Tu suscripción fue procesada exitosamente.",
};

const PLAN_NAMES: Record<string, string> = {
  discover: "Discover",
  partner: "Partner",
};

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; session_id?: string }>;
}) {
  const { plan } = await searchParams;
  const planName = plan && plan in PLAN_NAMES ? PLAN_NAMES[plan] : "seleccionado";

  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d] flex items-center justify-center px-6 py-32">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full border border-[#1f2a1d]/15 flex items-center justify-center bg-white">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16L13 23L26 9" stroke="#336443" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <div className="font-mono text-xs tracking-widest text-[#336443] uppercase mb-4">
            Pago confirmado
          </div>
          <h1 className="font-normal text-4xl sm:text-6xl tracking-tight mb-4">
            Bienvenido al plan{" "}
            <em className="italic text-[#336443]">{planName}</em>.
          </h1>
          <p className="font-mono text-sm text-[#4b5b47] leading-relaxed max-w-sm mx-auto">
            Recibirás un correo de confirmación. Nuestro equipo te contactará en menos de 24 horas para agendar tu primera sesión.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/"
            className="border border-[#1f2a1d]/15 px-8 py-3 rounded-full font-mono text-sm hover:bg-[#1f2a1d] hover:text-[#f5f3ec] transition-colors duration-500"
          >
            Volver al inicio
          </Link>
          <a
            href="mailto:proyectos@servicioscreativos.online"
            className="bg-[#336443] text-white px-8 py-3 rounded-full font-mono text-sm hover:bg-[#1f2a1d] transition-colors duration-500"
          >
            Contactar equipo
          </a>
        </div>

        <p className="font-mono text-xs text-[#4b5b47]/60">
          ¿Algún problema? Escríbenos a{" "}
          <a href="mailto:proyectos@servicioscreativos.online" className="underline underline-offset-2 hover:text-[#1f2a1d] transition-colors">
            proyectos@servicioscreativos.online
          </a>
        </p>
      </div>
    </main>
  );
}

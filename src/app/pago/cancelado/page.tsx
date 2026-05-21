import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pago cancelado — Servicios Creativos",
  description: "El proceso de pago fue cancelado.",
};

export default function PagoCanceladoPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d] flex items-center justify-center px-6 py-32">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full border border-[#1f2a1d]/15 flex items-center justify-center bg-white">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M10 10L22 22M22 10L10 22" stroke="#d4cdb8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <div className="font-mono text-xs tracking-widest text-[#4b5b47]/70 uppercase mb-4">
            Pago cancelado
          </div>
          <h1 className="font-normal text-4xl sm:text-6xl tracking-tight mb-4">
            Sin problema.
          </h1>
          <p className="font-mono text-sm text-[#4b5b47] leading-relaxed max-w-sm mx-auto">
            No se realizó ningún cargo. Puedes retomar el proceso cuando quieras o escribirnos para resolver dudas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/#precios"
            className="bg-[#336443] text-white px-8 py-3 rounded-full font-mono text-sm hover:bg-[#1f2a1d] transition-colors duration-500"
          >
            Ver planes
          </Link>
          <a
            href="mailto:contacto@servicioscreativos.online"
            className="border border-[#1f2a1d]/15 px-8 py-3 rounded-full font-mono text-sm hover:bg-[#1f2a1d] hover:text-[#f5f3ec] transition-colors duration-500"
          >
            Hablar con el equipo
          </a>
        </div>
      </div>
    </main>
  );
}

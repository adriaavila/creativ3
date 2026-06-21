"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import CreativvLogo from "./CreativvLogo";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const STARTS = [
  ["Landing page", "USD 199", "3 días"],
  ["Automatización", "Desde USD 499", "5–10 días"],
  ["Web / Producto", "Desde USD 699", "10–21 días"],
];

export default function OutcomeFooter() {
  return (
    <footer id="empezar" className="bg-[#172016] px-5 pb-10 pt-24 text-white sm:px-8 lg:px-12 lg:pt-32">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b8d397]">Empezar</div>
            <h2 className="mt-5 max-w-5xl font-display text-[clamp(3.4rem,8vw,8.4rem)] leading-[0.84] tracking-[-0.05em]">
              Trae el problema.
              <span className="block italic text-[#cfe3b1]">Diseñamos el sistema.</span>
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-white/58 sm:text-lg">
              La calculadora pone un primer valor al trabajo repetitivo. Después validamos el proceso,
              el alcance y la forma más simple de empezar.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cotizar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#dbe9c3] px-6 text-sm font-semibold text-[#172016] transition-colors hover:bg-white"
              >
                Calcular ahorro <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/cotizar"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold transition-colors hover:bg-white/8"
              >
                Ver formas de empezar
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {STARTS.map(([name, price, time]) => (
            <Link key={name} href="/cotizar" className="bg-[#172016] p-5 transition-colors hover:bg-[#203023] sm:p-6">
              <div className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/38">{time}</div>
              <div className="mt-4 font-display text-2xl">{name}</div>
              <div className="mt-2 text-sm text-[#cfe3b1]">{price}</div>
            </Link>
          ))}
        </div>

        <div className="mt-20 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <CreativvLogo variant="lockup-bare" className="h-9 w-auto text-white" />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
              Estudio independiente de diseño, software y agentes para vender mejor y operar con menos fricción.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/65 hover:text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-white/65 hover:text-white">
              <Mail className="size-4" /> Email
            </a>
            <Link href="/privacidad" className="text-white/45 hover:text-white">Privacidad</Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-white/28 sm:flex-row">
          <span>© {new Date().getFullYear()} Creativv</span>
          <span>ServiciosCreativos.online</span>
        </div>
      </div>
    </footer>
  );
}

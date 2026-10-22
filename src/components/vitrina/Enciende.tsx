import ArmaTuDemo from "@/components/allok/ArmaTuDemo";

const PASOS = [
  {
    titulo: "Le pasas tus chats",
    cuerpo: "Exportas dos o tres conversaciones con clientes y las subes. Aprende tus precios y tu tono; tú corriges antes de guardar.",
  },
  {
    titulo: "Le escribes como cliente",
    cuerpo: "Lo pruebas desde la app antes de que toque a un cliente real. Lo que no te guste, se lo corriges.",
  },
  {
    titulo: "Lo enciendes",
    cuerpo: "Conectas tu número de siempre por la vía oficial de Meta. Nace en pausa: empieza a atender cuando tú digas.",
  },
];

/**
 * Cómo se empieza y cuánto cuesta, sin rodeos. El papel de la vitrina para que
 * se lea como una decisión, no como otra lámina; dentro va «Arma tu demo», la
 * misma de /agente-whatsapp.
 */
export default function Enciende({
  cta,
  probar,
  precio,
  nota,
  puesta,
}: {
  cta: { href: string; label: string };
  probar: string;
  precio: number;
  nota: string;
  puesta: { precio: number; href: string };
}) {
  return (
    <section id="empieza" aria-labelledby="empieza-titulo" className="relative px-4 pb-6 sm:px-10 sm:pb-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 border-t border-[var(--cream-12)] pt-14 sm:flex-row sm:items-end sm:pt-20">
          <h2 id="empieza-titulo" className="v-display text-[clamp(2.8rem,8vw,7.5rem)]">
            Listo <span className="v-serif">esta noche.</span>
          </h2>
          <p className="v-mono max-w-[18rem] text-[11px] leading-relaxed text-[var(--cream-60)] sm:text-right">
            Sin cambiar de número · la cuenta queda a nombre de tu negocio
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:mt-20 lg:grid-cols-3 lg:gap-8">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="border-t border-[var(--cream-12)] pt-6">
              <span className="v-mono text-[11px] text-[var(--cream-35)]">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-4 text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-0.035em]">{p.titulo}</p>
              <p className="mt-3 max-w-[26rem] text-[16px] leading-relaxed text-[var(--cream-60)]">{p.cuerpo}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 overflow-hidden rounded-[28px] bg-[var(--paper)] text-[var(--ink)] sm:mt-24 sm:rounded-[40px]">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:p-14">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="v-mono text-[11px] text-[var(--ink-60)]">Todo lo de esta página</p>
                <p className="v-display mt-5 text-[clamp(4rem,10vw,8.5rem)]">
                  US${precio}
                  <span className="v-serif ml-3 text-[0.32em] text-[var(--ink-60)]">al mes</span>
                </p>
                <p className="mt-6 max-w-[28rem] text-[16px] leading-relaxed text-[var(--ink-60)]">
                  {nota} Meta te cobra los mensajes a su tarifa, directo; nosotros no cobramos por conversación.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={cta.href}
                  data-cursor="Empezar"
                  className="inline-flex min-h-14 items-center rounded-full bg-[var(--ink)] px-7 text-[16px] font-semibold text-[var(--paper)] transition-transform hover:-translate-y-0.5"
                >
                  {cta.label}
                </a>
                <a href={probar} className="text-[15px] font-semibold underline decoration-[var(--ink-15)] underline-offset-4 hover:decoration-[var(--ink)]">
                  Escríbele a nuestro agente ↗
                </a>
              </div>
            </div>

            <div className="rounded-[22px] bg-[var(--cream)] p-5 sm:p-8">
              <p className="v-mono text-[11px] text-[var(--ink-60)]">En 30 segundos, con tu negocio</p>
              <p className="mt-3 text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-tight tracking-[-0.03em]">
                Pega tu web y escríbele <span className="v-serif font-normal">como si fueras un cliente.</span>
              </p>
              {/* `.allok` trae los tokens que usa la demo; el fondo lo pone el papel. */}
              <div className="allok mt-6" style={{ background: "transparent" }}>
                <ArmaTuDemo />
              </div>
              <p className="mt-6 border-t border-[var(--ink-15)] pt-4 text-[14px] text-[var(--ink-60)]">
                ¿Prefieres que lo dejemos andando nosotros?{" "}
                <a href={puesta.href} className="font-semibold text-[var(--ink)] underline underline-offset-2">
                  Puesta en marcha desde US${puesta.precio}
                </a>
                , una vez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

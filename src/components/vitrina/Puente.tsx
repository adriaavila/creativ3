/** El paso del producto al estudio: quién está detrás del agente. */
export default function Puente() {
  return (
    <section aria-labelledby="puente-titulo" className="relative px-4 pt-20 sm:px-10 sm:pt-28">
      <div className="mx-auto max-w-[1500px] border-t border-[var(--cream-12)] pt-14 sm:pt-20">
        <p className="v-mono text-[11px] text-[var(--cream-60)]">03 · Quién lo hace</p>
        <h2 id="puente-titulo" className="v-display mt-6 max-w-[15ch] text-[clamp(2.6rem,7vw,7rem)]">
          Un estudio que hace <span className="v-serif text-[var(--cream-60)]">cosas reales, con obsesión.</span>
        </h2>
        <p className="mt-8 max-w-[34rem] text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-[var(--cream-60)]">
          allok también diseña y construye webs, plataformas y agentes a medida. Cada pieza de abajo está viva: puedes abrirla.
        </p>
      </div>
    </section>
  );
}

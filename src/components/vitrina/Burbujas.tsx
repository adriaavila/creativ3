import type { Burbuja, Chat } from "@/lib/agente-vitrina";

/** Un color por inicial: el muro se lee como gente distinta sin fotos de nadie. */
const TINTES = ["#f3c9a8", "#b9d8f5", "#c8e6b8", "#e9c2e2", "#f5e3a3", "#c4c8f2", "#a8e3d6", "#f2b8b8"];

function tinte(nombre: string): string {
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return TINTES[h % TINTES.length]!;
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
}

/** Las barras de una nota de voz: siempre las mismas para el mismo audio. */
function barras(semilla: string, n = 22): number[] {
  let x = 0;
  for (const ch of semilla) x = (x * 33 + ch.charCodeAt(0)) % 9973;
  return Array.from({ length: n }, (_, i) => {
    x = (x * 1103 + 12345 + i) % 9973;
    return 4 + (x % 14);
  });
}

export function VistaBurbuja({ b }: { b: Burbuja }) {
  if (b.de === "escribiendo") {
    return (
      <span className="v-dots" aria-label="Escribiendo">
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (b.de === "voz") {
    return (
      <div className="v-b v-b-c">
        <div className="flex items-center gap-2 text-[var(--cream)]">
          <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[9px]">
            ▶
          </span>
          <span className="v-wave" aria-hidden="true">
            {barras(b.transcripcion).map((h, i) => (
              <i key={i} style={{ height: h }} />
            ))}
          </span>
          <span className="v-mono text-[9px] opacity-60">{b.dura}</span>
        </div>
        <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[0.92em] italic opacity-75">
          <span className="v-mono mr-1 not-italic text-[8.5px] text-[var(--live)]">Transcrito</span>«{b.transcripcion}»
        </p>
      </div>
    );
  }
  if (b.de === "foto") {
    return (
      <div className="v-b v-b-c">
        <div
          aria-hidden="true"
          className="mb-1.5 h-16 w-40 max-w-full rounded-[7px]"
          style={{ background: "linear-gradient(135deg,#4a5260 0%,#2a2f37 55%,#8c6a52 100%)" }}
        />
        <p className="text-[0.92em] italic opacity-75">
          <span className="v-mono mr-1 not-italic text-[8.5px] text-[var(--live)]">Vio</span>
          {b.descripcion}
        </p>
      </div>
    );
  }
  return (
    <p className={`v-b ${b.de === "agente" ? "v-b-a" : "v-b-c"}`}>
      {b.texto}
      {b.hora ? <time>{b.hora}</time> : null}
    </p>
  );
}

/** Una conversación del muro: quién, de qué negocio, en qué quedó. */
export function TarjetaChat({ chat }: { chat: Chat }) {
  return (
    <div className="v-chat" data-focos={chat.focos.join(" ")}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="v-chat-av" style={{ background: tinte(chat.nombre) }} aria-hidden="true">
          {iniciales(chat.nombre)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{chat.nombre}</span>
          <span className="block truncate text-[10.5px] text-[var(--cream-35)]">{chat.rubro}</span>
        </span>
        <span className="v-tag" data-tono={chat.etiqueta.tono}>
          {chat.etiqueta.texto}
        </span>
      </div>
      {chat.burbujas.map((b, i) => (
        <VistaBurbuja key={i} b={b} />
      ))}
    </div>
  );
}

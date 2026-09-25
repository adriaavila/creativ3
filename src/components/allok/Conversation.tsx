"use client";

import { useEffect, useRef, useState } from "react";
import { STATES } from "@/lib/brand";

/**
 * El producto, mostrado en vez de descrito.
 *
 * Es el WhatsApp del negocio a las 3:14 de la madrugada, y se ve pasar: Carla
 * escribe (arriba dice «escribiendo…»), su pregunta entra, allok redacta la
 * respuesta en la caja de texto, la manda, y los vistos pasan de gris a azul
 * porque Carla la leyó. Todo lo demás de esta página argumenta; esto lo
 * demuestra.
 *
 * El servidor pinta la conversación completa. Con JS y movimiento, la deja
 * leer unos segundos y la vuelve a contar en bucle, sólo mientras se ve. Con
 * menos movimiento se queda quieta y completa.
 *
 * Los mensajes son un ejemplo, no la conversación de ningún cliente.
 */

export type Turn = { from: "them" | "us"; text: string; at: string };

export const DEFAULT_THREAD: Turn[] = [
  { from: "them", text: "Hola, ¿tienen cupo para el curso de los sábados?", at: "3:14" },
  {
    from: "us",
    text: "Sí, quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Son 8 clases, empiezan el 4 de octubre.",
    at: "3:14",
  },
  { from: "them", text: "El de 9. ¿Cómo hago para reservar?", at: "3:15" },
  {
    from: "us",
    text: "Te reservé el cupo a tu nombre hasta mañana a las 18:00. Para confirmarlo va el 50%: te paso el link. ¿Te queda bien?",
    at: "3:15",
  },
];

type Scene = {
  shown: number;
  typing: boolean;
  draft: string;
  /** Por mensaje nuestro: 0 enviado, 1 entregado, 2 leído. */
  ticks: number[];
  clock: string;
  fading: boolean;
  /** La primera pasada es la del servidor, en cascada; las siguientes, en vivo. */
  live: boolean;
  sent: number;
};

const done = (thread: Turn[]): Scene => ({
  shown: thread.length,
  typing: false,
  draft: "",
  ticks: thread.map(() => 2),
  clock: thread[thread.length - 1].at,
  fading: false,
  live: false,
  sent: 0,
});

function Ticks({ n }: { n: number }) {
  return (
    <span className={`ml-0.5 transition-colors duration-200 ${n === 2 ? "text-[#53bdeb]" : "text-[rgba(17,27,33,.4)]"}`}>
      {n === 0 ? "✓" : "✓✓"}
    </span>
  );
}

function Bubble({ turn, delay, ticks, live }: { turn: Turn; delay: number; ticks: number; live: boolean }) {
  const ours = turn.from === "us";
  return (
    // En vivo, la fila crece desde cero y empuja el hilo hacia arriba, como en el teléfono.
    <div className={live ? "allok-msg" : "allok-bubble"} style={live ? undefined : { animationDelay: `${delay}ms` }}>
      <div className={`flex items-start ${ours ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative max-w-[86%] rounded-[13px] px-2.5 pb-4 pt-2 text-[13.5px] leading-[1.4] shadow-[0_1px_1px_rgba(0,0,0,.12)] ${
            ours ? "bg-[#d9fdd3] text-[#111b21]" : "bg-white text-[#111b21]"
          } ${live ? (ours ? "allok-msg-send" : "allok-msg-pop") : ""}`}
        >
          {turn.text}
          <span className="absolute bottom-1 right-2.5 text-[10px] text-[rgba(17,27,33,.45)]">
            {turn.at}
            {ours ? <Ticks n={ticks} /> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Conversation({
  thread = DEFAULT_THREAD,
  contact = "Carla M.",
}: {
  thread?: Turn[];
  contact?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(() => done(thread));

  useEffect(() => {
    const el = host.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    let visible = false;
    let wake: (() => void) | null = null;
    const timers = new Set<number>();
    // Fuera de pantalla el guion espera en el paso donde iba.
    const gate = () => (visible ? Promise.resolve() : new Promise<void>((res) => (wake = res)));
    const sleep = async (ms: number) => {
      await gate();
      await new Promise<void>((res) => {
        const id = window.setTimeout(() => (timers.delete(id), res()), ms);
        timers.add(id);
      });
    };
    const set = (patch: (s: Scene) => Partial<Scene>) => alive && setScene((s) => ({ ...s, ...patch(s) }));
    const tick = (i: number, n: number) => set((s) => ({ ticks: s.ticks.map((v, j) => (j === i ? n : v)) }));

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && wake) {
        wake();
        wake = null;
      }
    });
    io.observe(el);

    (async () => {
      await gate();
      await sleep(4800); // la cascada del servidor, y tiempo para leerla
      while (alive) {
        await gate();
        set(() => ({ fading: true }));
        await sleep(420);
        set(() => ({ ...done(thread), shown: 0, ticks: thread.map(() => 0), clock: thread[0].at, live: true }));
        await sleep(700);

        for (let i = 0; i < thread.length && alive; i++) {
          const turn = thread[i];
          await gate();
          if (turn.from === "them") {
            set(() => ({ typing: true, clock: turn.at }));
            await sleep(1500);
            set(() => ({ typing: false, shown: i + 1 }));
            await sleep(650);
          } else {
            for (let n = 2; n < turn.text.length && alive; n += 2) {
              set(() => ({ draft: turn.text.slice(0, n) }));
              await sleep(26);
            }
            set(() => ({ draft: turn.text }));
            await sleep(320);
            set((s) => ({ draft: "", shown: i + 1, sent: s.sent + 1 }));
            await sleep(520);
            tick(i, 1);
            await sleep(900);
            tick(i, 2);
            await sleep(1000);
          }
        }
        await sleep(5200);
      }
    })();

    return () => {
      alive = false;
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [thread]);

  const { shown, typing, draft, ticks, clock, fading, live, sent } = scene;

  return (
    <div ref={host} className="allok-device">
      <div className="allok-device-screen">
        {/* La barra de estado del teléfono. Es lo que separa «captura de
            pantalla» de «dibujo de una pantalla». */}
        <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between px-6 pt-[11px] text-[11px] font-semibold text-white">
          <span className="tabular-nums">{clock}</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <svg viewBox="0 0 18 12" className="h-[10px] w-[15px]" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx=".6" /><rect x="4.5" y="5.5" width="3" height="6.5" rx=".6" />
              <rect x="9" y="3" width="3" height="9" rx=".6" /><rect x="13.5" y="0" width="3" height="12" rx=".6" />
            </svg>
            <svg viewBox="0 0 16 12" className="h-[10px] w-[13px]" fill="currentColor">
              <path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0L8 11.2Zm0-5.1a6 6 0 0 0-4.2 1.7L2.1 6.1a8.4 8.4 0 0 1 11.8 0l-1.7 1.7A6 6 0 0 0 8 6.1Z" />
            </svg>
            <span className="ml-0.5 inline-flex h-[11px] w-[22px] items-center rounded-[3px] border border-white/55 p-[1.5px]">
              <span className="h-full w-[72%] rounded-[1px] bg-white" />
            </span>
          </span>
        </div>

        {/* La barra del chat, en el verde de WhatsApp — es el único lugar del
            sitio donde aparece, porque aquí no es decoración: es dónde vive
            el producto. El verde de allok nunca pinta esto. */}
        <div className="flex items-center gap-2.5 bg-[#008069] px-3.5 pb-2.5 pt-[38px] text-white">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,.22)] text-[13px] font-semibold">
            {contact.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-tight">{contact}</p>
            <p key={String(typing)} className="allok-text-in text-[11px] leading-tight opacity-80">
              {typing ? "escribiendo…" : "en línea"}
            </p>
          </div>
        </div>

        {/* Como en WhatsApp: el hilo se apoya abajo, junto a la caja de texto,
            y lo nuevo asoma por detrás de ella (de ahí el overflow-hidden). */}
        <div
          className={`flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-2.5 py-3 transition-opacity duration-[400ms] ${
            fading ? "opacity-0" : ""
          }`}
        >
          <p className="mx-auto mb-1 rounded-md bg-[rgba(255,255,255,.75)] px-2 py-0.5 text-[10.5px] font-medium text-[rgba(17,27,33,.5)]">
            HOY
          </p>
          {thread.slice(0, shown).map((turn, i) => (
            <Bubble key={turn.text} turn={turn} delay={220 + i * 520} ticks={ticks[i]} live={live} />
          ))}
        </div>

        <div className="flex items-center gap-2 px-2.5 pb-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px]">
            {draft ? (
              <>
                {/* Quién está escribiendo: allok, en el azul de «trabajando». */}
                <span className="allok-text-in flex shrink-0 items-center gap-1 text-[11px] font-semibold" style={{ color: STATES.atendiendo.ink }}>
                  <span className="allok-breathe size-1.5 rounded-full" style={{ background: STATES.atendiendo.dot }} />
                  allok
                </span>
                {/* En rtl, lo que no cabe se corta por la izquierda: se ve lo último que se escribió. */}
                <span className="block min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left text-[#111b21] [direction:rtl]">
                  <bdi dir="ltr">
                    {draft}
                    <span className="allok-caret" />
                  </bdi>
                </span>
              </>
            ) : (
              <span className="block text-[rgba(17,27,33,.38)]">Escribe un mensaje</span>
            )}
          </div>
          <div
            key={sent}
            className={`grid size-8 shrink-0 place-items-center rounded-full bg-[#008069] text-white ${sent ? "allok-press" : ""}`}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

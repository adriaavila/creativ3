/**
 * El producto, mostrado en vez de descrito.
 *
 * Es un hilo de WhatsApp real en un teléfono real: la pregunta entra a las
 * 3:14 de la madrugada y la respuesta sale en cuatro segundos, con el dato
 * verdadero del negocio dentro. Todo lo demás de esta página argumenta; esto
 * lo demuestra.
 *
 * Los mensajes son un ejemplo, no la conversación de ningún cliente.
 */

export type Turn = { from: "them" | "us"; text: string; at: string };

export const DEFAULT_THREAD: Turn[] = [
  { from: "them", text: "Hola, ¿tienen cupo para el curso de los sábados?", at: "3:14" },
  {
    from: "us",
    text: "Sí — quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Son 8 clases, empiezan el 4 de octubre.",
    at: "3:14",
  },
  { from: "them", text: "El de 9. ¿Cómo hago para reservar?", at: "3:15" },
  {
    from: "us",
    text: "Te reservé el cupo a tu nombre hasta mañana a las 18:00. Para confirmarlo va el 50%: te paso el link. ¿Te queda bien?",
    at: "3:15",
  },
];

function Bubble({ turn, delay }: { turn: Turn; delay: number }) {
  const ours = turn.from === "us";
  return (
    <div
      className={`allok-bubble flex ${ours ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`relative max-w-[86%] rounded-[13px] px-2.5 pb-4 pt-2 text-[13.5px] leading-[1.4] shadow-[0_1px_1px_rgba(0,0,0,.12)] ${
          ours ? "bg-[#d9fdd3] text-[#111b21]" : "bg-white text-[#111b21]"
        }`}
      >
        {turn.text}
        <span className="absolute bottom-1 right-2.5 text-[10px] text-[rgba(17,27,33,.45)]">
          {turn.at}
          {ours ? <span className="ml-0.5 text-[#53bdeb]">✓✓</span> : null}
        </span>
      </div>
    </div>
  );
}

export default function Conversation({
  thread = DEFAULT_THREAD,
  business = "Academia Norte",
}: {
  thread?: Turn[];
  business?: string;
}) {
  return (
    <div className="allok-device">
      <div className="allok-device-screen">
        {/* La barra del chat, en el verde de WhatsApp — es el único lugar del
            sitio donde aparece, porque aquí no es decoración: es dónde vive
            el producto. */}
        <div className="flex items-center gap-2.5 bg-[#008069] px-3.5 pb-2.5 pt-[38px] text-white">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,.22)] text-[13px] font-semibold">
            {business.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-tight">{business}</p>
            <p className="text-[11px] leading-tight opacity-80">en línea</p>
          </div>
        </div>

        <div className="grid gap-1.5 px-2.5 py-3">
          <p className="mx-auto mb-1 rounded-md bg-[rgba(255,255,255,.75)] px-2 py-0.5 text-[10.5px] font-medium text-[rgba(17,27,33,.5)]">
            HOY
          </p>
          {thread.map((turn, i) => (
            <Bubble key={turn.text} turn={turn} delay={220 + i * 520} />
          ))}
        </div>

        <div className="flex items-center gap-2 px-2.5 pb-3.5">
          <div className="flex-1 rounded-full bg-white px-3.5 py-2 text-[13px] text-[rgba(17,27,33,.38)]">
            Escribe un mensaje
          </div>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#008069] text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

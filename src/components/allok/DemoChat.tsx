"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CHAT_MAX_CHARS, CHAT_MAX_MESSAGES, CHAT_SESSION_TURNS, FALLBACK_REPLY } from "@/lib/demo-agent";

/**
 * El chat de `/demo/<slug>`: un WhatsApp de verdad, no un dibujo. El
 * visitante escribe (o toca una sugerencia), el agente «escribe…» y contesta
 * con lo que sabe de la web del negocio.
 *
 * Verde y beige de WhatsApp solo aquí: es donde vive el producto. Las burbujas
 * propias van a la derecha en verde, como en el teléfono de quien escribe.
 */

type Msg = { id: number; role: "user" | "assistant"; content: string; at: string };

const clock = () => new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

function initials(name: string): string {
  const words = name
    .replace(/^(cl[ií]nica|consultorio|academia|instituto|escuela|centro)\s+/i, "")
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w));
  return ((words[0]?.[0] ?? name[0] ?? "?") + (words[1]?.[0] ?? "")).toUpperCase();
}

export default function DemoChat({
  slug,
  businessName,
  greeting,
  suggestions,
  website,
}: {
  slug: string;
  businessName: string;
  greeting: string;
  suggestions: string[];
  website: string | null;
}) {
  const [messages, setMessages] = useState<Msg[]>(() => [{ id: 0, role: "assistant", content: greeting, at: clock() }]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const showChips = userTurns === 0 && suggestions.length > 0;

  // El hilo baja solo; se mueve el contenedor, no la página (en el teléfono
  // un scrollIntoView arrastra todo con el teclado abierto).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const content = text.trim().slice(0, CHAT_MAX_CHARS);
    if (!content || pending || closed) return;
    const mine: Msg = { id: nextId.current++, role: "user", content, at: clock() };
    // El saludo no viaja: el servidor no lo necesita y el último mensaje debe ser del visitante.
    const history = [...messages.slice(1), mine].slice(-CHAT_MAX_MESSAGES).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, mine]);
    setDraft("");
    setPending(true);

    let reply = FALLBACK_REPLY;
    let limited = false;
    try {
      const res = await fetch(`/api/demo/${slug}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: unknown; limited?: unknown } | null;
      if (typeof data?.reply === "string" && data.reply.trim()) reply = data.reply;
      limited = data?.limited === true;
    } catch {
      // Sin red: la línea de respaldo, nunca un error.
    }
    // Una pausa mínima: una respuesta instantánea no se lee como alguien escribiendo.
    await new Promise((r) => setTimeout(r, 450));
    setMessages((m) => [...m, { id: nextId.current++, role: "assistant", content: reply, at: clock() }]);
    setPending(false);
    if (limited || userTurns + 1 >= CHAT_SESSION_TURNS) setClosed(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  let host = "";
  try {
    host = website ? new URL(website).hostname.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }

  return (
    <div className="flex h-[min(74svh,640px)] min-h-[460px] w-full flex-col overflow-hidden rounded-[22px] bg-[#efeae2] text-[#111b21] shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] ring-1 ring-black/10">
      {/* La barra del chat, en el verde de WhatsApp. */}
      <div className="flex shrink-0 items-center gap-3 bg-[#008069] px-4 py-3 text-white">
        <div
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,.22)] text-[14px] font-semibold tracking-wide"
        >
          {initials(businessName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-medium leading-tight">{businessName}</p>
          <p key={String(pending)} className="allok-text-in text-[12.5px] leading-tight opacity-85">
            {pending ? "escribiendo…" : "en línea"}
          </p>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
        style={{
          backgroundImage:
            "radial-gradient(rgba(17,27,33,.045) 1px, transparent 1.2px), radial-gradient(rgba(17,27,33,.035) 1px, transparent 1.2px)",
          backgroundSize: "22px 22px, 22px 22px",
          backgroundPosition: "0 0, 11px 11px",
        }}
      >
        <p className="mx-auto mb-1 rounded-md bg-[rgba(255,255,255,.85)] px-2 py-0.5 text-[11px] font-medium text-[rgba(17,27,33,.62)]">
          HOY
        </p>
        {/* El aviso amarillo de WhatsApp, aquí para decir la verdad: es una demo. */}
        <p className="mx-auto mb-2 max-w-[92%] rounded-lg bg-[#fff3c4] px-3 py-2 text-center text-[12px] leading-snug text-[#54471a]">
          Demo de allok, armada con la web pública{host ? ` de ${host}` : ""}. No está conectada al WhatsApp del negocio: nada de lo
          que escriba aquí le llega a nadie.
        </p>

        <div aria-live="polite" className="flex flex-col gap-1.5">
          {messages.map((m) => (
            <div key={m.id} className={`allok-msg ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`relative max-w-[84%] whitespace-pre-wrap break-words rounded-[12px] px-3 pb-[18px] pt-2 text-[15px] leading-[1.38] shadow-[0_1px_1px_rgba(0,0,0,.12)] ${
                    m.role === "user" ? "allok-msg-send rounded-tr-[4px] bg-[#d9fdd3]" : "allok-msg-pop rounded-tl-[4px] bg-white"
                  }`}
                >
                  <span className="sr-only">{m.role === "user" ? "Tú: " : `${businessName}: `}</span>
                  {m.content}
                  <span suppressHydrationWarning className="absolute bottom-1 right-2.5 text-[10.5px] text-[rgba(17,27,33,.55)]">
                    {m.at}
                    {m.role === "user" ? <span className="ml-1 text-[#53bdeb]">✓✓</span> : null}
                  </span>
                </p>
              </div>
            </div>
          ))}
          {pending ? (
            <div className="flex justify-start">
              <p className="allok-msg-pop flex items-center gap-1 rounded-[12px] rounded-tl-[4px] bg-white px-3.5 py-3 shadow-[0_1px_1px_rgba(0,0,0,.12)]">
                <span className="sr-only">{businessName} está escribiendo</span>
                {[0, 160, 320].map((d) => (
                  <span
                    key={d}
                    aria-hidden="true"
                    className="size-[7px] animate-bounce rounded-full bg-[rgba(17,27,33,.38)]"
                    style={{ animationDelay: `${d}ms`, animationDuration: "1s" }}
                  />
                ))}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {showChips ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-3 pb-2 pt-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-4">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              disabled={pending}
              className="min-h-11 shrink-0 rounded-full border border-[#008069]/25 bg-white px-3.5 py-2 text-[14px] font-medium text-[#00684f] shadow-[0_1px_1px_rgba(0,0,0,.08)] transition-transform active:scale-[.96] disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {closed ? (
        <p className="shrink-0 bg-[#f0f2f5] px-4 py-3.5 text-center text-[13.5px] text-[rgba(17,27,33,.7)]">
          Hasta aquí la demo. Si le gustó, el agente puede ser suyo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 bg-[#f0f2f5] px-2.5 py-2.5 sm:px-3">
          <label htmlFor="demo-input" className="sr-only">
            Escribe un mensaje a {businessName}
          </label>
          <input
            id="demo-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={CHAT_MAX_CHARS}
            autoComplete="off"
            enterKeyHint="send"
            placeholder="Escribe un mensaje"
            className="min-h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[16px] text-[#111b21] outline-none placeholder:text-[rgba(17,27,33,.5)] focus-visible:ring-2 focus-visible:ring-[#008069]/40"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="Enviar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#008069] text-white transition-[transform,opacity] active:scale-[.92] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

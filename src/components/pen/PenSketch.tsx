"use client";

import { useObject } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { whatsappUrl } from "@/lib/contact";
import { SKETCH_MAX, SKETCH_MIN, clip, sketchSchema, sketchWhatsappMessage } from "@/lib/pen-sketch";

/**
 * «Your turn»: quien visita escribe qué le quita tiempo y la ficha llega en
 * streaming (`useObject`, AI SDK de Vercel). Mientras llega es texto; cuando
 * termina, sus tres partes se vuelven gestos (`data-pen`) y la MISMA línea
 * de la página tacha el problema, lo dibuja y subraya el resultado.
 *
 * Si la ruta no puede contestar (límite, sin credencial, modelo caído), la
 * salida es WhatsApp con lo que la persona ya escribió: nadie se queda con
 * un error en la mano.
 */
export default function PenSketch({ examples }: { examples: readonly string[] }) {
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<"limited" | "unavailable" | null>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const { object, submit, isLoading } = useObject({
    api: "/api/pen",
    schema: sketchSchema,
    onFinish: ({ object: finished }) => {
      if (finished) setDone(true);
      else setFailed("unavailable");
    },
    onError: (error) => setFailed(error.message === "limited" ? "limited" : "unavailable"),
  });

  // Cuando la ficha queda entera (o se va), la línea vuelve a medir la página.
  useEffect(() => {
    const root = sheet.current?.closest(".pen") ?? document.querySelector(".pen");
    root?.dispatchEvent(new CustomEvent("pen:redraw", { detail: done ? sheet.current : null }));
  }, [done, asked]);

  const ready = text.trim().length >= SKETCH_MIN;
  const problem = clip(object?.problem, 220);
  const result = clip(object?.result, 90);
  const steps = (object?.steps ?? []).map((s) => clip(s, 140)).filter(Boolean);
  const showSheet = Boolean(asked) && !failed && (isLoading || done);

  return (
    <div className="pen-turn-work">
      <form
        className="pen-form"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (value.length < SKETCH_MIN || isLoading) return;
          setAsked(value);
          setDone(false);
          setFailed(null);
          submit({ text: value });
        }}
      >
        <div className="pen-field" data-pen="rule">
          <label className="pen-label" htmlFor="pen-text">
            In a sentence or two
          </label>
          <textarea
            id="pen-text"
            name="text"
            rows={3}
            maxLength={SKETCH_MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I answer the same questions on WhatsApp all day…"
          />
        </div>
        <div className="pen-form-row">
          <ul className="pen-examples" aria-label="Examples to start from">
            {examples.map((example) => (
              <li key={example}>
                <button type="button" onClick={() => setText(example)}>
                  {example}
                </button>
              </li>
            ))}
          </ul>
          <button className="pen-btn" type="submit" disabled={!ready || isLoading}>
            {isLoading ? "Sketching…" : "Sketch it"}
          </button>
        </div>
      </form>

      {failed ? (
        <div className="pen-sheet" role="status">
          <p className="pen-label">{failed === "limited" ? "That is enough sketches for now" : "The pen ran dry"}</p>
          <p className="pen-sheet-note">
            {failed === "limited" ? "Let’s talk about the real thing instead." : "It could not sketch this one. Send it to me as you wrote it."}
          </p>
          <a className="pen-btn" href={whatsappUrl(sketchWhatsappMessage(asked))} target="_blank" rel="noopener noreferrer">
            Send it on WhatsApp
          </a>
        </div>
      ) : null}

      {!failed && !showSheet ? (
        <div className="pen-sheet is-empty" aria-hidden="true">
          <p className="pen-label">Nothing sketched yet</p>
          <p className="pen-sheet-note">Your problem, crossed out. What replaces it, underlined. Three first steps.</p>
        </div>
      ) : null}

      {showSheet ? (
        <div className="pen-sheet" ref={sheet} aria-live="polite" aria-busy={isLoading}>
          <p className="pen-label">{done ? "Sketched for you" : "Sketching"}</p>
          <p className="pen-before is-small">
            <span data-pen={done ? "strike" : undefined}>{problem || "…"}</span>
          </p>
          <div className="pen-after">
            <span className="pen-glyph" data-pen={done ? "draw" : undefined} data-glyph={done ? object?.glyph : undefined} />
            <h3 className="pen-result is-small">
              <span data-pen={done ? "underline" : undefined}>{result}</span>
            </h3>
            {steps.length > 0 ? (
              <>
                <p className="pen-label pen-steps-label">How I would start</p>
                <ol className="pen-steps">
                  {steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </>
            ) : null}
            {done ? (
              <a className="pen-btn" href={whatsappUrl(sketchWhatsappMessage(asked, result))} target="_blank" rel="noopener noreferrer">
                Send this sketch to Adrián
              </a>
            ) : null}
            <p className="pen-fine">Drawn live by an AI model. A real plan starts with a conversation.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

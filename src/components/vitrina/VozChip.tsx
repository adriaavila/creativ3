"use client";

import { useRef, useState } from "react";

/**
 * La nota de voz de Adrián, al final de la fila de «Te contesto yo». Solo
 * existe si el archivo está en public/ al construir (lo decide Estado). Nunca
 * suena sola ni se descarga antes del toque (preload="none"); la muestra el
 * CSS cuando el lazo se cierra, sin estado de React. Su transcripción, el
 * día que llegue la nota, va en /trabajo#sobre-mi.
 */
export default function VozChip({ src, duracion }: { src: string; duracion: string | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);

  const tocar = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setSonando(false));
    else a.pause();
  };

  return (
    <>
      {/* El nombre accesible incluye lo que se ve (la duración), para quien la dice en voz alta. */}
      <button
        type="button"
        className="voz"
        aria-label={duracion ? `Escuchar a Adrián, ${duracion}` : "Escuchar a Adrián"}
        aria-pressed={sonando}
        onClick={tocar}
      >
        {/* Dibujados: el ▶ de texto se vuelve emoji en algunos celulares. */}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          {sonando ? <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" /> : <path d="M3 1.2 10.5 6 3 10.8z" />}
        </svg>
        {duracion}
      </button>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
      />
    </>
  );
}

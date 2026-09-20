/**
 * La marca allok, en un solo archivo.
 *
 * La idea entera: **el color es el estado de la operación**, no decoración. La
 * marca dice literalmente "all ok" cuando todo funciona, y el mismo punto verde
 * que va detrás del logotipo va en el favicon, en la barra lateral, junto al
 * número de WhatsApp y en el tablero. Si algo se cae, el punto cambia — y la
 * marca deja de decir que todo está bien.
 *
 * Dos reglas que salen de medir, no de opinar:
 *
 * 1. **El verde de marca es relleno, nunca texto sobre papel.** `#22C36E` da
 *    2,15:1 sobre `#f7f7f5`. Por eso cada estado trae dos valores: `dot` (el
 *    relleno y el texto sobre negro) e `ink` (el texto sobre papel). Los cuatro
 *    pasan AA en las dos superficies.
 *
 * 2. **El verde de allok no es el verde de WhatsApp.** 149° contra 142°: siete
 *    grados. Se distinguen mal, así que se separan por uso: el verde de allok
 *    es estado de sistema y nunca pinta una burbuja de chat. Las burbujas usan
 *    el verde real de WhatsApp (`--wa-out`), que no es un token de marca.
 */

export const BRAND = {
  name: "allok",
  tagline: "AUTOMATIZA TU CRECIMIENTO",
  /** Qué es, para quien nunca lo vio. */
  positioning: "allok conecta tu WhatsApp con agentes que atienden tu negocio.",
  /** Lo que va en la portada y en los anuncios. */
  promise: "Conecta tu WhatsApp. allok se encarga de tus clientes.",
} as const;

export type SystemState = "activo" | "atendiendo" | "atencion" | "pausado";

export type StateDef = {
  /** Lo que se le dice al cliente. Nunca jerga. */
  label: string;
  /** Relleno del punto, y texto sobre negro. */
  dot: string;
  /** El mismo estado como TEXTO sobre papel. */
  ink: string;
  /** Fondo suave para una píldora sobre papel. */
  soft: string;
};

/**
 * Los cuatro estados que el cliente puede ver. No hay un quinto: cada cosa que
 * pase por dentro —un webhook caído, un modelo lento, una cola llena— tiene que
 * aterrizar en uno de estos, porque son los únicos que significan algo para
 * quien tiene un taller.
 */
export const STATES: Record<SystemState, StateDef> = {
  activo:     { label: "allok activo",      dot: "#3FE38F", ink: "#0F7A45", soft: "#e3f8ed" },
  atendiendo: { label: "Atendiendo",        dot: "#5BB0FF", ink: "#0B5FA8", soft: "#e4f1fd" },
  atencion:   { label: "Requiere atención", dot: "#FFC043", ink: "#7A5600", soft: "#fdf1da" },
  pausado:    { label: "Pausado",           dot: "#8B9096", ink: "#5C5E61", soft: "#eceded" },
};

/** El acento de marca. Relleno y superficies oscuras; jamás texto sobre papel. */
export const ACCENT = "#22C36E";
export const ACCENT_LIT = "#6FEFB2";

/* ── El símbolo ───────────────────────────────────────────────────────────
 *
 * Una señal que se pone de pie y se vuelve una A. Entra por la izquierda como
 * onda, sube al vértice, y sale por la derecha en línea recta: lo que llegaba
 * como ruido sale como algo que sigue adelante. Es asimétrica a propósito —
 * simétrica se leía como una A con bigote, y la onda dejaba de significar.
 *
 * Verificado a 64, 32 y 20 px, en verde sobre negro y en tinta sobre papel:
 * a 20 px se sigue leyendo A, que es el suelo (el favicon vive ahí).
 */
export const MARK_PATH =
  "M8 46 Q11 46 13 42 Q15 37 17 42 Q19 47 22 44 L32 13 L42 46 H55";
export const MARK_BAR = "M24.5 40 H39.5";
export const MARK_STROKE = 5.4;

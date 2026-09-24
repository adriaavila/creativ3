/**
 * La marca allok, en un solo archivo.
 *
 * **allok = all systems OK.** La marca no vende "IA para WhatsApp": vende que
 * la operación está funcionando. Por eso el logo no es un símbolo abstracto —
 * una «A» geométrica es el idioma de cualquier SaaS de IA y no dice nada — sino
 * el logotipo con el estado dentro:
 *
 *     all ● k        la `o` de allok ES el punto de estado
 *
 * Eso obliga a que el logo diga la verdad: si el sistema se cae, la letra
 * cambia de color. Un punto verde decorativo miente la primera vez que algo
 * falle, así que `state` no tiene valor por defecto.
 *
 * El símbolo es el mismo punto con su contexto: **un círculo que el punto
 * cierra.** El círculo es la conversación (y el «all»: todo); abierto, es un
 * cliente esperando respuesta. El punto es la respuesta que lo cierra (el
 * «ok»), en el color del estado. Va a 130° (abajo a la derecha, donde sale
 * la cola de un mensaje enviado), y es el mismo hueco que viaja en el tramo
 * «procesando» del Lottie, ya aterrizado. Geometría: `MARK`, abajo.
 *
 * Dos reglas medidas, no opinadas:
 *
 * 1. **El verde es relleno, nunca texto sobre Cloud** (1,56:1). Cada estado
 *    trae `dot` —pinta, y se lee sobre Ink— e `ink`, el mismo estado como
 *    texto sobre papel. Los cuatro pasan AA en las dos superficies.
 * 2. **Signal Blue da 3,81:1 sobre Ink**: vale para relleno y titular grande,
 *    no para texto corrido en oscuro. Sobre Cloud sí (4,81:1).
 *
 * El degradado azul-violeta no es protagonista. Verde = OK es la asociación
 * que construye marca; el azul aparece cuando el sistema está trabajando.
 */

export const BRAND = {
  name: "allok",
  /** Registro de marca, en inglés. No es copy de landing. */
  positioning: "The AI harness for WhatsApp.",
  /** Lo que sí ve un cliente que tiene un taller. Nada de «harness». */
  promise: "Tu negocio sigue funcionando.",
  /** Las tres frases operacionales. Cortas, seguras, sin épica. */
  voice: ["Cada lead, atendido.", "Todo conectado. Todo bajo control.", "Siempre encendido."],
} as const;

/** La paleta. Casi monocromática: el color que queda es el que significa algo. */
export const PALETTE = {
  ink: "#0B0D0E",
  cloud: "#F7F8F8",
  signal: "#315CFF",
  ok: "#20E58D",
} as const;

export type SystemState = "activo" | "atendiendo" | "atencion" | "pausado";

export type StateDef = {
  /** Lo que se le dice al cliente. Nunca jerga. */
  label: string;
  /** Relleno del punto, y texto sobre Ink. */
  dot: string;
  /** El mismo estado como TEXTO sobre Cloud. */
  ink: string;
  /** Fondo suave de una píldora sobre Cloud. */
  soft: string;
  /** Qué tramo del Lottie le toca. */
  motion: "esperando" | "procesando" | "resuelto";
};

export const STATES: Record<SystemState, StateDef> = {
  activo:     { label: "all ok",            dot: "#20E58D", ink: "#0A7A48", soft: "#e2f9ee", motion: "resuelto" },
  atendiendo: { label: "Atendiendo",        dot: "#5B8CFF", ink: "#2348CC", soft: "#e7edff", motion: "procesando" },
  atencion:   { label: "Requiere atención", dot: "#FFB020", ink: "#7A5600", soft: "#fdf0db", motion: "esperando" },
  pausado:    { label: "Pausado",           dot: "#8A9097", ink: "#5A6066", soft: "#ededee", motion: "esperando" },
};

/**
 * El símbolo, en una caja de 64. Anillo r16, trazo 6,5 con puntas redondas;
 * punto r6,5 sobre el anillo a 130°, con 2,5 de aire a cada lado.
 * `src/app/icon.svg` y `public/logo.svg` copian estos números: si cambia uno,
 * cambian los tres.
 */
export const MARK = {
  ring: "M33.39 47.94A16 16 0 1 1 47.94 30.6",
  stroke: 6.5,
  dot: { cx: 44.26, cy: 42.28, r: 6.5 },
} as const;

/** Los tramos del Lottie, en fotogramas. Espejo de scripts/ok-dot-lottie.mjs. */
export const DOT_SEGMENTS: Record<StateDef["motion"], [number, number]> = {
  esperando: [0, 60],
  procesando: [60, 120],
  resuelto: [120, 165],
};

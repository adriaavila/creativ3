// Two hands reaching: a human one and a machine. This module puts them
// together for the scene (built in a worker, manos-obra.ts) and for the
// pencil sketch (scripts/manos-trazo.ts); each hand is built in its own
// module, and what both share (the buffers, the framing) is in manos-base.ts.
import { humanHand } from "./manos-humana";
import { machineHand } from "./manos-maquina";
import type { Manos } from "./manos-base";

export {
  AIM,
  FOV,
  GIRO_HUMANA,
  GIRO_MAQUINA,
  KIND,
  LAZO,
  TIRAS,
  VISTA,
  VISTA_COMPACTA,
  encuadre,
  ojoLocal,
  type Encuadre,
  type Estilo,
  type Lines,
  type Manos,
  type Solido,
} from "./manos-base";

/**
 * Both hands, the same on every visit (they are seeded), lighter on a phone:
 * the lines to draw, the machine's pads, and each hand's body for the depth
 * buffer.
 */
export function construirManos(small: boolean): Manos {
  const human = humanHand(small);
  const machine = machineHand(small);
  return { human: human.lines, machine: machine.lines, pads: machine.pads, cuerpos: { human: human.solid, machine: machine.solid } };
}

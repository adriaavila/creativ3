// The machine hand. Placeholder: the circuit traces of the first version,
// until the realistic machine replaces them.
import { Builder, Cuerpo, lerp, type Estilo, type Lines, type Solido, type V3, rng } from "./manos-base";
import { MAQUINA, onSurface, pick, sampleAt, skeleton, tube, backOfPalm, type Pose, type Sample } from "./manos-esqueleto";

/**
 * The machine hand: traces that run along the surface in lanes, bundled by
 * finger in the forearm like a bus, turning at 45° with a pad at every turn;
 * chips on the back of the hand that the traces run into, rings at the
 * joints and a cuff at the wrist.
 */
function pistas(pose: Pose, traces: number, seed: number, estilo: Estilo, mirror = true): { lines: Lines; pads: Lines } {
  const rand = rng(seed);
  const { chains, xf, inv } = skeleton(pose);
  const tubes = chains.map((c) => tube(c, 14));
  const lines = new Builder(mirror);
  const pads = new Builder(mirror);
  const mid = tubes[1]!;
  const palmS = sampleAt(mid, 3.5).s;

  // Chips on the back of the hand: [center x, center y, width, height], before the tilt.
  const chips: [number, number, number, number][] = [
    [0.22, 0.03, 0.15, 0.11],
    [0.06, -0.09, 0.08, 0.06],
    [0.08, 0.09, 0.06, 0.045],
  ];
  const PIN = 0.014;
  const inChip = (h: V3) => chips.some(([cx, cy, w, hh]) => Math.abs(h[0] - cx) < w / 2 + PIN && Math.abs(h[1] - cy) < hh / 2 + PIN);
  // A trace on the back of the hand that reaches a chip ends at its pin;
  // along the hand's edges it runs on underneath, like an inner layer.
  const onChip = (q: V3) => {
    const h = inv(q);
    return h[2] >= 0.02 && inChip(h);
  };
  // But no pad ever sits inside a chip's outline.
  const pad = (q: V3, s: number, id: number) => {
    if (!inChip(inv(q))) pads.point(q, s, id);
  };

  const LANES = 14;
  // Lanes cover the half that faces the viewer and wrap a little past the edges.
  const laneAngle = (k: number) => -0.12 * Math.PI + ((k + 0.5) / LANES) * 1.24 * Math.PI;
  for (let t = 0; t < traces; t++) {
    const ci = pick(chains, rand());
    const chain = chains[ci]!;
    const samples = tubes[ci]!;
    // In the forearm a finger's traces run together near its band; in the palm they spread out.
    const bandAngle = ((1 - chain.band) / 2) * Math.PI;
    const angle = (lane: number, palm: number) => lerp(bandAngle + (laneAngle(lane) - Math.PI / 2) * 0.3, laneAngle(lane), palm);
    let lane = Math.floor(rand() * LANES);
    const start = Math.floor(rand() * samples.length * 0.5);
    const end = rand() < 0.4 ? Math.floor((samples.length - 1) * (0.62 + rand() * 0.36)) : samples.length - 1;
    // Turns: where they start, and how many lanes each one crosses (one lane per step: 45°).
    const turns = new Map<number, number>();
    const nTurns = 2 + Math.floor(rand() * 3);
    for (let j = 0; j < nTurns; j++) {
      const s = 0.3 + rand() * 0.65;
      let i = 0;
      while (i < samples.length - 1 && samples[i]!.s < s) i++;
      turns.set(i, (rand() < 0.5 ? -1 : 1) * (1 + Math.floor(rand() * 2)));
    }
    const id = rand();
    const first = samples[start]!;
    let prev = onSurface(first, angle(lane, first.palm), 1.01);
    if (onChip(prev)) continue;
    let ps = first.s;
    pad(prev, ps, id);
    let steer = 0;
    for (let i = start + 1; i <= end; i++) {
      const p = samples[i]!;
      const turn = turns.get(i);
      if (turn) steer += turn;
      let bent = false;
      if (steer !== 0) {
        const next = Math.min(LANES - 1, Math.max(0, lane + Math.sign(steer)));
        steer = next === lane ? 0 : steer - Math.sign(steer);
        bent = next !== lane;
        lane = next;
      }
      const q = onSurface(p, angle(lane, p.palm), 1.01);
      // A trace that reaches a chip ends at its pin.
      if (onChip(q)) break;
      lines.seg(prev, q, ps, p.s, id);
      if (bent && steer === 0) pad(q, p.s, id);
      prev = q;
      ps = p.s;
    }
    pad(prev, ps, id);
  }

  // A ring at every joint: a band open at the back, where nobody looks.
  const ring = (p: Sample, k: number, from: number, to: number, id: number) => {
    const N = 22;
    let prev = onSurface(p, from, k);
    for (let j = 1; j <= N; j++) {
      const q = onSurface(p, from + ((to - from) * j) / N, k);
      lines.seg(prev, q, p.s, p.s, id);
      prev = q;
    }
  };
  chains.forEach((chain, ci) => {
    for (const j of chain.joints) {
      ring(sampleAt(tubes[ci]!, j - 0.04), 1.07, -0.2 * Math.PI, 1.2 * Math.PI, 0.5 + rand() * 0.5);
      ring(sampleAt(tubes[ci]!, j + 0.04), 1.07, -0.2 * Math.PI, 1.2 * Math.PI, 0.5 + rand() * 0.5);
    }
  });
  // The cuff: two bands around the wrist.
  for (const node of [1.96, 1.9]) ring(sampleAt(mid, node), 1.12, -0.25 * Math.PI, 1.25 * Math.PI, 0.5 + rand() * 0.5);

  // The chips: an outline, the die inside it and the pins, in the other color.
  const back = (x: number, y: number) => xf(backOfPalm(x, y));
  const rect = (x0: number, y0: number, x1: number, y1: number, id: number) => {
    const edge = (ax: number, ay: number, bx: number, by: number) => {
      const N = 6;
      let prev = back(ax, ay);
      for (let j = 1; j <= N; j++) {
        const q = back(lerp(ax, bx, j / N), lerp(ay, by, j / N));
        lines.seg(prev, q, palmS, palmS, id, 1);
        prev = q;
      }
    };
    edge(x0, y0, x1, y0);
    edge(x1, y0, x1, y1);
    edge(x1, y1, x0, y1);
    edge(x0, y1, x0, y0);
  };
  for (const [cx, cy, w, h] of chips) {
    const id = 0.5 + rand() * 0.5;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const y0 = cy - h / 2;
    const y1 = cy + h / 2;
    rect(x0, y0, x1, y1, id);
    rect(cx - w * 0.22, cy - h * 0.22, cx + w * 0.22, cy + h * 0.22, id);
    const STEP = 0.016;
    for (let x = x0 + STEP / 2; x < x1; x += STEP) {
      lines.seg(back(x, y0), back(x, y0 - PIN), palmS, palmS, id, 1);
      lines.seg(back(x, y1), back(x, y1 + PIN), palmS, palmS, id, 1);
    }
    for (let y = y0 + STEP / 2; y < y1; y += STEP) {
      lines.seg(back(x0, y), back(x0 - PIN, y), palmS, palmS, id, 1);
      lines.seg(back(x1, y), back(x1 + PIN, y), palmS, palmS, id, 1);
    }
  }
  const wrist = sampleAt(mid, 2).s;
  return { lines: lines.done(wrist, estilo), pads: pads.done(wrist, estilo) };
}

/** The machine hand for a phone (`small`) or a wide screen: its lines, its pads and its body (mirrored: a left hand). */
export function machineHand(small: boolean): { lines: Lines; pads: Lines; solid: Solido } {
  const estilo: Estilo = { alfa: 0.5, contorno: 0.8, sombra: 1, punta: 0 };
  return { ...pistas(MAQUINA, small ? 170 : 340, 11, estilo), solid: new Cuerpo(true).done() };
}

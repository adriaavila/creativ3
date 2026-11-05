// The human hand. Placeholder: the fibers of the first version, until the
// realistic hand replaces them.
import { Builder, Cuerpo, add, lerp, mul, rng, type Estilo, type Lines, type Solido, type V3 } from "./manos-base";
import { HUMANA, HUMANA_COMPACTA, pick, sampleAt, skeleton, tube, backOfPalm, type Pose } from "./manos-esqueleto";

/**
 * The human hand: long fibers that run from the forearm to the fingertips,
 * bundled by finger in the arm and fanning out in the palm, each one waving a
 * little, like the tracts of a brain scan.
 */
function fibras(pose: Pose, fibers: number, seed: number, estilo: Estilo, mirror = false): Lines {
  const rand = rng(seed);
  const { chains, xf } = skeleton(pose);
  const tubes = chains.map((c) => tube(c, 9));
  const out = new Builder(mirror);
  for (let f = 0; f < fibers; f++) {
    const ci = pick(chains, rand());
    const chain = chains[ci]!;
    const samples = tubes[ci]!;
    // Where the fiber lands in its finger: denser toward the surface, so the outline reads.
    const r = Math.pow(rand(), 0.4);
    const th = rand() * Math.PI * 2;
    const a = r * Math.cos(th);
    const b = r * Math.sin(th);
    // Where it runs in the forearm, apart from that: fibers braid at the wrist.
    const r2 = Math.sqrt(rand());
    const th2 = rand() * Math.PI * 2;
    const a2 = r2 * Math.cos(th2);
    const b2 = r2 * Math.sin(th2);
    const freq = 5 + rand() * 9;
    const freq2 = 13 + rand() * 14;
    const ph = rand() * Math.PI * 2;
    const ph2 = rand() * Math.PI * 2;
    const amp = 0.08 + rand() * 0.16;
    const amp2 = 0.02 + rand() * 0.05;
    const id = rand();
    const begin = rand() < 0.45 ? 0.15 + rand() * 0.3 : 0;
    const end = rand() < 0.3 ? 0.55 + rand() * 0.4 : 1;
    let prev: V3 | null = null;
    let ps = 0;
    for (const p of samples) {
      if (p.s < begin) continue;
      if (p.s > end) break;
      const wave = amp * Math.sin(p.s * freq + ph) + amp2 * Math.sin(p.s * freq2 + ph2);
      const u = (0.55 * a2 + 0.45 * chain.band) * (1 - p.palm) + a * p.palm + wave;
      const v = 0.85 * b2 * (1 - p.palm) + b * p.palm + amp * Math.cos(p.s * freq * 1.3 + ph);
      const q = add(add(p.c, mul(p.A, u * p.ra)), mul(p.B, v * p.rb));
      if (prev) out.seg(prev, q, ps, p.s, id);
      prev = q;
      ps = p.s;
    }
  }
  // A few fibers cross the back of the hand on a slant, from the base of the
  // thumb toward the little finger, like a second tract over the first.
  const palmS = sampleAt(tubes[1]!, 3.5).s;
  const across = Math.round(fibers * 0.05);
  for (let f = 0; f < across; f++) {
    const x0 = 0.02 + rand() * 0.2;
    const x1 = x0 + 0.08 + rand() * 0.16;
    const bow = (rand() - 0.5) * 0.06;
    const id = 0.3 + rand() * 0.7;
    const N = 18;
    // Near the wrist the hand is narrower: start and end inside its outline.
    const top = Math.min(0.15, 0.1 + 0.4 * x0);
    const bottom = -Math.min(0.15, 0.1 + 0.4 * x1);
    let prev = xf(backOfPalm(x0, top, 0.004));
    for (let j = 1; j <= N; j++) {
      const t = j / N;
      const y = lerp(top, bottom, t);
      const q = xf(backOfPalm(lerp(x0, x1, t) + bow * Math.sin(Math.PI * t), y, 0.004));
      out.seg(prev, q, palmS, palmS, id);
      prev = q;
    }
  }
  return out.done(sampleAt(tubes[1]!, 2).s, estilo);
}

/** The human hand for a phone (`small`) or a wide screen: its lines and its body. */
export function humanHand(small: boolean): { lines: Lines; solid: Solido } {
  const estilo: Estilo = { alfa: small ? 0.22 : 0.14, contorno: 0.6, sombra: 1, punta: small ? 0.3 : 0.45 };
  return { lines: fibras(small ? HUMANA_COMPACTA : HUMANA, small ? 300 : 560, 7, estilo), solid: new Cuerpo(false).done() };
}

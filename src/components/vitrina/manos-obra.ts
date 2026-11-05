import { construirManos } from "./manos-geometria";

// A worker that builds both hands off the main thread: tens of thousands of
// segments take tens of milliseconds on a laptop and several hundred on a
// throttled phone, and none of it should stand between a visitor and their
// first tap. It says it's ready first, so the request can't arrive before it
// listens, and the buffers travel back without being copied.

self.onmessage = (e: MessageEvent<{ small: boolean }>) => {
  const manos = construirManos(e.data.small);
  const transfer = [
    ...[manos.human, manos.machine, manos.pads].flatMap((l) => [l.pos.buffer, l.s.buffer, l.rnd.buffer, l.kind.buffer, l.nrm.buffer]),
    ...[manos.cuerpos.human, manos.cuerpos.machine].flatMap((c) => [c.pos.buffer, c.idx.buffer]),
  ];
  self.postMessage(manos, { transfer });
};
self.postMessage("listo");

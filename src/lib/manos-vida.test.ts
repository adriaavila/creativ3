import { test } from "node:test";
import assert from "node:assert/strict";
import { LATIDO, crearLatidos, duracion, latido, respuesta } from "../components/vitrina/manos-vida";

// Where the wrists sit in the hands the scene builds (Lines.wrist, about 0.514 on both).
const munecas = { humana: 0.514, maquina: 0.514 };
const muestras = (desde: number, hasta: number, n = 400) => Array.from({ length: n + 1 }, (_, i) => desde + ((hasta - desde) * i) / n);
const TAMANOS = [true, false] as const;
const clave = (compacta: boolean) => (compacta ? "compacta" : "amplia");
const nombre = (compacta: boolean) => (compacta ? "celular" : "escritorio");

test("la señal de la respuesta es la de siempre", () => {
  // The answer's band before it moved here (manos-escena.ts at 38d5a4d), written out again.
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
  const envelope = (p: number) => {
    if (p <= 0 || p >= 1) return 0;
    const i = clamp01(p / 0.12);
    const o = clamp01((1 - p) / 0.2);
    return i * i * (3 - 2 * i) * o * o * (3 - 2 * o);
  };
  const w = { humana: 0.5125806654340653, maquina: 0.514171043111641 };
  for (const p of muestras(0, 1)) {
    const v = respuesta(p, p, w);
    assert.equal(v.humana.s, w.humana - 0.3 + (1.12 - (w.humana - 0.3)) * easeInOut(p));
    assert.equal(v.maquina.s, 1.12 + (w.maquina - 0.3 - 1.12) * easeInOut(p));
    assert.equal(v.humana.amp, envelope(p));
    assert.equal(v.maquina.amp, envelope(p));
  }
});

test("un latido empieza y termina en reposo: fuera de él, las manos son las de siempre", () => {
  for (const compacta of TAMANOS)
    for (const t of [-1, 0, duracion(compacta), duracion(compacta) + 1]) {
      const v = latido(t, munecas, compacta);
      assert.equal(v.humana.amp, 0, `${nombre(compacta)}: humana a ${t} s`);
      assert.equal(v.maquina.amp, 0, `${nombre(compacta)}: máquina a ${t} s`);
    }
});

test("cada carrera va solo sobre la mano que se ve, a un paso que se sigue con la vista", () => {
  for (const compacta of TAMANOS) {
    const k = clave(compacta);
    const sube = LATIDO.sube[k];
    const h0 = latido(LATIDO.baja[0], munecas, compacta).humana.s;
    const h1 = latido(LATIDO.baja[1], munecas, compacta).humana.s;
    const m0 = latido(sube[0], munecas, compacta).maquina.s;
    const m1 = latido(sube[1], munecas, compacta).maquina.s;
    // From just before the wrist (where the forearm has faded) to the fingertip, and back up the other hand to where it ends.
    assert.ok(Math.abs(h0 - (munecas.humana - 0.12)) < 1e-9 && h1 === 1, `${nombre(compacta)}: humana de ${h0} a ${h1}`);
    assert.ok(m0 === 1 && Math.abs(m1 - (munecas.maquina + LATIDO.fin[k])) < 1e-9, `${nombre(compacta)}: máquina de ${m0} a ${m1}`);
    // One pace (ease-linear) on both hands: the answer's band peaks at about 2.3 aS/s over the hand; this one stays near 0.5.
    const dt = 1 / 600;
    for (const [lado, [a, b]] of [["humana", LATIDO.baja], ["maquina", sube]] as const) {
      for (const t of muestras(a + 0.01, b - 0.01, 100)) {
        const v = Math.abs(latido(t + dt, munecas, compacta)[lado].s - latido(t, munecas, compacta)[lado].s) / dt;
        assert.ok(v > 0.45 && v < 0.55, `${nombre(compacta)}: ${lado} a ${v.toFixed(2)} aS/s en ${t.toFixed(2)} s`);
      }
      // Each run is one move of the system's scale at most (duration-story, 1.2 s).
      assert.ok(b - a <= 1.2 + 1e-9, `${nombre(compacta)}: ${lado} ${b - a} s`);
    }
  }
  // On a desktop the machine's run ends past its wrist, on the forearm; on a phone the strip's edge cuts its palm, and it ends there.
  assert.ok(LATIDO.fin.amplia < 0 && LATIDO.fin.compacta > 0);
});

test("las dos carreras son una sola señal: la máquina la toma cuando llega a la yema, sin un hueco quieto", () => {
  for (const compacta of TAMANOS) {
    const k = clave(compacta);
    const sube = LATIDO.sube[k];
    assert.ok(sube[0] < LATIDO.baja[1], "la máquina empieza después de que la humana se apaga");
    assert.ok(latido(sube[0], munecas, compacta).humana.s > 0.9, "la humana aún no llega a la yema");
    const aH = LATIDO.amp.humana[k];
    let peor = Infinity;
    for (const t of muestras(0.3, duracion(compacta) - 0.3)) {
      const v = latido(t, munecas, compacta);
      peor = Math.min(peor, Math.max(v.humana.amp / aH, v.maquina.amp / LATIDO.amp.maquina));
    }
    assert.ok(peor > 0.2, `${nombre(compacta)}: la señal cae a ${peor.toFixed(2)} en el relevo`);
    // Frames stop when both bands are back at 0: no sooner, no later.
    assert.equal(duracion(compacta), sube[1]);
  }
});

test("un latido es la señal de la respuesta más tenue: la marca sigue siendo lo más brillante", () => {
  for (const compacta of TAMANOS) {
    let pico = 0;
    for (const t of muestras(0, duracion(compacta))) {
      const v = latido(t, munecas, compacta);
      pico = Math.max(pico, v.humana.amp, v.maquina.amp);
    }
    assert.ok(pico > 0.3, `apenas se ve: ${pico}`);
    // The answer's band runs at 1 over the fingertips while the mark draws; the beat, at two thirds of that at most.
    assert.ok(pico <= 2 / 3, `pico ${pico}`);
  }
  // On a desktop the human fingertip under the band already rivals the mark: it takes less than on a phone.
  assert.ok(LATIDO.amp.humana.amplia < LATIDO.amp.humana.compacta);
});

/** A clock of our own for the beat's timers: `correr` moves it on, firing what falls due, in order. */
function relojFalso() {
  let ahora = 0;
  let sig = 1;
  const pend = new Map<number, { cuando: number; f: () => void }>();
  return {
    poner: (f: () => void, ms: number) => {
      const id = sig++;
      pend.set(id, { cuando: ahora + ms, f });
      return id;
    },
    quitar: (id: number) => void pend.delete(id),
    correr(ms: number) {
      const fin = ahora + ms;
      for (;;) {
        let prox: [number, { cuando: number; f: () => void }] | null = null;
        for (const x of pend) if (x[1].cuando <= fin && (!prox || x[1].cuando < prox[1].cuando)) prox = x;
        if (!prox) break;
        pend.delete(prox[0]);
        ahora = prox[1].cuando;
        prox[1].f();
      }
      ahora = fin;
    },
    pendientes: () => pend.size,
    ahora: () => ahora,
  };
}

/** A scene that plays the beat: what it lets through, and when each beat started (ms on the clock). */
function escena() {
  const r = relojFalso();
  const s = { cerrada: false, ve: true, ficha: false, compacta: false };
  const empezados: number[] = [];
  const l = crearLatidos({
    puede: () => s.cerrada && s.ve,
    tapado: () => s.ficha,
    compacta: () => s.compacta,
    empezar: () => empezados.push(r.ahora()),
    poner: r.poner,
    quitar: r.quitar,
  });
  /** The beat that started, frame by frame at 60 Hz, to its end: how many frames it took. */
  const latir = () => {
    let n = 0;
    while (l.tiempo() !== null && n < 10000) {
      l.avanzar(1 / 60);
      n++;
    }
    return n;
  };
  return { r, s, l, empezados, latir };
}
const Q = LATIDO.primero * 1000;

test("antes de cerrarse no se arma nada: la entrada y la respuesta son otras", () => {
  const { r, l, empezados } = escena();
  l.mirar();
  l.armar();
  assert.equal(r.pendientes(), 0);
  r.correr(60_000);
  assert.deepEqual(empezados, []);
});

test("cerrada, un latido tras la quietud, y nada más en esa mirada", () => {
  const { r, s, l, empezados, latir } = escena();
  s.cerrada = true;
  l.armar();
  assert.equal(r.pendientes(), 1);
  r.correr(Q - 1);
  assert.deepEqual(empezados, []);
  r.correr(1);
  assert.deepEqual(empezados, [Q]);
  assert.equal(l.tiempo(), 0);
  const n = latir();
  assert.ok(Math.abs(n - duracion(false) * 60) <= 1, `${n} cuadros`);
  assert.equal(r.pendientes(), 0, "otro latido armado en la misma mirada");
  l.armar();
  r.correr(10 * 60_000);
  assert.deepEqual(empezados, [Q]);
});

test("en un celular el latido termina antes, donde la tira corta la mano de la máquina", () => {
  const { r, s, l, empezados, latir } = escena();
  s.cerrada = true;
  s.compacta = true;
  l.armar();
  r.correr(Q);
  assert.deepEqual(empezados, [Q]);
  const n = latir();
  assert.ok(duracion(true) < duracion(false));
  assert.ok(Math.abs(n - duracion(true) * 60) <= 1, `${n} cuadros`);
});

test("una mirada nueva (la tira vuelve, la pestaña se muestra) trae su latido", () => {
  const { r, s, l, empezados, latir } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(Q);
  latir();
  l.callar();
  r.correr(5000);
  l.mirar();
  r.correr(Q);
  assert.deepEqual(empezados, [Q, 2 * Q + 5000]);
});

test("bajo una ficha espera sin un cuadro, y late cuando se va", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  s.ficha = true;
  l.armar();
  r.correr(3 * Q);
  assert.deepEqual(empezados, []);
  assert.equal(r.pendientes(), 0, "un temporizador esperando bajo la ficha");
  s.ficha = false;
  l.destapar();
  r.correr(Q);
  assert.deepEqual(empezados, [4 * Q]);
});

test("al irse la ficha la quietud empieza de nuevo: el latido llega una quietud entera después", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(3000);
  // The sheet opens: the scene cuts, and no timer waits under it.
  s.ficha = true;
  assert.equal(l.cortar(), false, "no sonaba ningún latido");
  assert.equal(r.pendientes(), 0, "un temporizador esperando bajo la ficha");
  r.correr(17_000);
  assert.deepEqual(empezados, []);
  s.ficha = false;
  l.destapar();
  r.correr(Q - 1);
  assert.deepEqual(empezados, [], "llegó antes de una quietud entera");
  r.correr(1);
  assert.deepEqual(empezados, [20_000 + Q]);
});

test("un temporizador de antes de la ficha nunca dispara antes de tiempo", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  // Armed at 0, it was due at 7 s; the sheet comes and goes before that, and nobody told the beat it opened.
  l.armar();
  r.correr(1000);
  s.ficha = true;
  r.correr(3000);
  s.ficha = false;
  l.destapar();
  assert.equal(r.pendientes(), 1);
  r.correr(Q - 1);
  assert.deepEqual(empezados, [], "latió con el temporizador de antes de la ficha");
  r.correr(1);
  assert.deepEqual(empezados, [4000 + Q]);
});

test("al irse la ficha no llega nada si la mirada ya tuvo su latido", () => {
  const { r, s, l, empezados, latir } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(Q);
  latir();
  s.ficha = true;
  assert.equal(l.cortar(), false);
  r.correr(5000);
  s.ficha = false;
  l.destapar();
  assert.equal(r.pendientes(), 0);
  r.correr(10 * 60_000);
  assert.deepEqual(empezados, [Q]);
});

test("al irse la ficha no se arma nada si no puede latir (la tira fuera de la pantalla): la mirada siguiente lo arma", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(2000);
  s.ficha = true;
  l.cortar();
  s.ve = false;
  r.correr(5000);
  s.ficha = false;
  l.destapar();
  assert.equal(r.pendientes(), 0);
  r.correr(60_000);
  assert.deepEqual(empezados, []);
  s.ve = true;
  l.mirar();
  r.correr(Q);
  assert.deepEqual(empezados, [67_000 + Q]);
});

test("destapar con un latido sonando lo deja terminar, y no arma otro", () => {
  const { r, s, l, empezados, latir } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(Q);
  l.avanzar(0.5);
  l.destapar();
  assert.equal(l.tiempo(), 0.5);
  assert.equal(r.pendientes(), 0);
  latir();
  r.correr(10 * 60_000);
  assert.deepEqual(empezados, [Q]);
});

test("callar a medio latido lo termina, y no queda nada armado", () => {
  const { r, s, l } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(Q);
  l.avanzar(0.5);
  assert.equal(l.callar(), true);
  assert.equal(l.tiempo(), null);
  assert.equal(r.pendientes(), 0);
  assert.equal(l.callar(), false);
});

test("una ficha sobre un latido lo corta, y la mirada lo tiene tras otra quietud", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  l.armar();
  r.correr(Q);
  l.avanzar(0.5);
  s.ficha = true;
  assert.equal(l.cortar(), true);
  assert.equal(l.tiempo(), null);
  assert.equal(r.pendientes(), 0, "un temporizador esperando bajo la ficha");
  r.correr(3 * Q);
  assert.deepEqual(empezados, [Q]);
  // Cut, it was never counted: the look still has it coming, a whole still after the sheet goes.
  s.ficha = false;
  l.destapar();
  r.correr(Q);
  assert.deepEqual(empezados, [Q, 5 * Q]);
});

test("si al vencer ya no puede (fuera de la pantalla, otra pestaña), ni late ni lo intenta otra vez", () => {
  const { r, s, l, empezados } = escena();
  s.cerrada = true;
  l.armar();
  s.ve = false;
  r.correr(Q);
  assert.deepEqual(empezados, []);
  assert.equal(r.pendientes(), 0);
});

test("nunca hay más de un temporizador, y posar no arma ninguno", () => {
  const { r, s, l } = escena();
  s.cerrada = true;
  for (let i = 0; i < 5; i++) {
    l.armar();
    l.mirar();
  }
  assert.equal(r.pendientes(), 1);
  l.posar(1);
  assert.equal(l.tiempo(), 1);
  assert.equal(r.pendientes(), 0);
});

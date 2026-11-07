// The hero's renderer, by hand on WebGL2: the few things three.js did for
// «Te toca» (manos-escena.ts), done the way three.js 0.186 did them, so not a
// pixel changes. The matrices are built with the same arithmetic in the same
// order (the same doubles, so the same floats reach the GPU); each draw sets
// the GL state three.js set for it (blending, depth, culling, line width); the
// transparent pieces go back to front by the same rule; the canvas and the
// viewport take the same sizes. Everything else three.js carries stays out.
//
// Ported from three.js r186, line by line where the numbers must come out the
// same: multiplicar (Matrix4.multiplyMatrices), cuaternion
// (Quaternion.setFromEuler, order XYZ), componer (Matrix4.compose),
// perspectiva (PerspectiveCamera.updateProjectionMatrix with
// Matrix4.makePerspective), lejos (the depth WebGLRenderer's projectObject
// sorts by), atras (reversePainterSortStable, in WebGLRenderLists), medir
// (WebGLRenderer's setPixelRatio and setSize: the canvas floors, the viewport
// rounds) and, in crearMotor, the GL state of a frame: the clear, the blend
// functions of WebGLState's setBlending (NormalBlending and AdditiveBlending,
// without premultiplied alpha), each material's depth and culling, and
// «position» bound to attribute 0 as WebGLProgram binds it. mirada is what
// Matrix4.lookAt and matrixWorldInverse leave for this one camera, written
// out. Those portions keep three.js's license (the rest of this file is
// allok's own); its notice, as node_modules/three/LICENSE has it:
//
// The MIT License
//
// Copyright © 2010-2026 three.js authors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** A 4x4 matrix, column-major like three's Matrix4.elements, in doubles like them. */
export type M4 = Float64Array;
/** A turn as three's Quaternion holds it: x, y, z, w. */
export type Cuaternion = readonly [number, number, number, number];

/** A uniform's value: a float, or a vec2, vec3 or vec4. */
export type Valor = number | readonly number[];
export type Uniformes = Record<string, Valor>;

export const identidad = (): M4 => {
  const m = new Float64Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
};

/** a × b into `te` (three's Matrix4.multiplyMatrices: the same products, summed in the same order). */
export function multiplicar(a: M4, b: M4, te: M4): M4 {
  const a11 = a[0]!, a12 = a[4]!, a13 = a[8]!, a14 = a[12]!;
  const a21 = a[1]!, a22 = a[5]!, a23 = a[9]!, a24 = a[13]!;
  const a31 = a[2]!, a32 = a[6]!, a33 = a[10]!, a34 = a[14]!;
  const a41 = a[3]!, a42 = a[7]!, a43 = a[11]!, a44 = a[15]!;
  const b11 = b[0]!, b12 = b[4]!, b13 = b[8]!, b14 = b[12]!;
  const b21 = b[1]!, b22 = b[5]!, b23 = b[9]!, b24 = b[13]!;
  const b31 = b[2]!, b32 = b[6]!, b33 = b[10]!, b34 = b[14]!;
  const b41 = b[3]!, b42 = b[7]!, b43 = b[11]!, b44 = b[15]!;
  te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
  te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
  te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
  te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
  te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
  te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
  te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
  te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
  te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
  te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
  te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
  te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
  te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
  te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
  te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
  te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
  return te;
}

/** A turn about x, then y, then z, in radians (an Euler 'XYZ' as three's Quaternion.setFromEuler reads it). */
export function cuaternion(x: number, y: number, z: number): Cuaternion {
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3];
}

/** An object's matrix from its place, its turn and its size, the same in every axis (three's Matrix4.compose). */
export function componer(te: M4, [x, y, z, w]: Cuaternion, px: number, py: number, pz: number, s = 1): M4 {
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  te[0] = (1 - (yy + zz)) * s;
  te[1] = (xy + wz) * s;
  te[2] = (xz - wy) * s;
  te[3] = 0;
  te[4] = (xy - wz) * s;
  te[5] = (1 - (xx + zz)) * s;
  te[6] = (yz + wx) * s;
  te[7] = 0;
  te[8] = (xz + wy) * s;
  te[9] = (yz - wx) * s;
  te[10] = (1 - (xx + yy)) * s;
  te[11] = 0;
  te[12] = px;
  te[13] = py;
  te[14] = pz;
  te[15] = 1;
  return te;
}

const DEG2RAD = Math.PI / 180;

/** three's PerspectiveCamera.updateProjectionMatrix (no zoom, view or film offset), with its makePerspective. */
export function perspectiva(te: M4, fov: number, aspect: number, near: number, far: number): M4 {
  const top = near * Math.tan(DEG2RAD * 0.5 * fov);
  const height = 2 * top;
  const width = aspect * height;
  const left = -0.5 * width;
  const right = left + width;
  const bottom = top - height;
  te.fill(0);
  te[0] = (2 * near) / (right - left);
  te[5] = (2 * near) / (top - bottom);
  te[8] = (right + left) / (right - left);
  te[9] = (top + bottom) / (top - bottom);
  te[10] = -(far + near) / (far - near);
  te[14] = (-2 * far * near) / (far - near);
  te[11] = -1;
  return te;
}

/**
 * The view of a camera at (0, y, z) looking at (0, y, 0): what three's lookAt
 * and matrixWorldInverse leave for it, exactly (no turn, so the inverse is only
 * the move back).
 */
export function mirada(te: M4, y: number, z: number): M4 {
  te.fill(0);
  te[0] = te[5] = te[10] = te[15] = 1;
  te[13] = -y;
  te[14] = -z;
  return te;
}

/**
 * How far back a piece sits, to sort it: its bounding sphere's centre through
 * its world matrix and then the camera's (the clip-space z, before the divide),
 * one product after the other, as three's projectObject does.
 */
function lejos(mundo: M4, pantalla: M4, [x, y, z]: readonly [number, number, number]): number {
  const m = mundo;
  const x1 = m[0]! * x + m[4]! * y + m[8]! * z + m[12]! * 1;
  const y1 = m[1]! * x + m[5]! * y + m[9]! * z + m[13]! * 1;
  const z1 = m[2]! * x + m[6]! * y + m[10]! * z + m[14]! * 1;
  const w1 = m[3]! * x + m[7]! * y + m[11]! * z + m[15]! * 1;
  const p = pantalla;
  return p[2]! * x1 + p[6]! * y1 + p[10]! * z1 + p[14]! * w1;
}

type Programa = {
  fuentes: readonly [string, string];
  p: WebGLProgram | null;
  shaders: WebGLShader[];
  /** LINK_STATUS, once asked; null until then. */
  ok: boolean | null;
  lugares: Map<string, WebGLUniformLocation | null>;
};

/**
 * Something the scene draws: one program, one draw call. `u` holds its
 * uniforms: change a value and the next frame draws it (a new uniform is one
 * more key here and one more line in the shader).
 */
export type Pieza<U extends Uniformes = Uniformes> = {
  u: U;
  /** Its world matrix: the scene sets it before each frame. */
  mundo: M4;
};

type Interna = Pieza & {
  programa: Programa;
  modo: number;
  atributos: [string, Float32Array, number][];
  indices: Uint16Array | null;
  cuenta: number;
  suma: boolean;
  profundidad: boolean;
  orden: number;
  id: number;
  centro: readonly [number, number, number];
  vao: WebGLVertexArrayObject | null;
  buffers: WebGLBuffer[];
};

type Opciones<K extends string, U extends Uniformes> = {
  programa: K;
  modo: "lineas" | "puntos" | "triangulos";
  /** Each attribute's floats and how many make a vertex (`position` 3, a float 1, `uv` 2). */
  atributos: Record<string, readonly [Float32Array, number]>;
  indices?: Uint16Array;
  u: U;
  /** On a dark ground the lines add up (three's AdditiveBlending); elsewhere NormalBlending. */
  suma: boolean;
  /** three's depthTest (nothing writes depth: depthWrite is false everywhere). */
  profundidad: boolean;
  /** three's renderOrder: higher draws later. */
  orden: number;
  /** The centre of its bounding sphere, in its own space. */
  centro: readonly [number, number, number];
};

export type Motor<K extends string> = {
  /** A piece to draw with program `programa`; its vertices reach the GPU with `subir`. */
  pieza<U extends Uniformes>(o: Opciones<K, U>): Pieza<U>;
  /**
   * Whether every program has finished compiling: true at once where the
   * browser can't tell (no KHR_parallel_shader_compile), and wherever its
   * answer is anything but a plain «not yet».
   */
  listos(): boolean;
  /**
   * Whether the program linked, asked once (where the browser can't tell when
   * it's ready, or hasn't said so in time, this is where it waits for it); null
   * while the context is lost.
   */
  enlazado(programa: K): boolean | null;
  /** Puts a piece's vertices on the GPU, once per context. */
  subir(p: Pieza): void;
  /** The canvas for a strip of `ancho` × `alto` CSS pixels at `dpr` (three's setPixelRatio and setSize). */
  medir(ancho: number, alto: number, dpr: number): void;
  /** Clears and draws the pieces, back to front, through projection `p` and view `v` (three's render). */
  dibujar(piezas: readonly Pieza[], p: M4, v: M4): void;
  /** The context was lost and everything on the GPU with it; `compilar` starts again on the one restored. */
  olvidar(): void;
  compilar(): boolean;
  /** Frees the GPU's side and the context. */
  borrar(): void;
};

const MODOS = { lineas: 0x0001, puntos: 0x0000, triangulos: 0x0004 } as const; // gl.LINES, gl.POINTS, gl.TRIANGLES

/**
 * The renderer on the context Manos.tsx asked for (`gl`, on `canvas`), with one
 * program per entry of `fuentes` (vertex and fragment GLSL ES 3.00), compiling
 * from the moment it's made: or null when the context can't start one.
 */
export function crearMotor<K extends string>(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, fuentes: Record<K, readonly [string, string]>): Motor<K> | null {
  // KHR_parallel_shader_compile, asked for by `compilar` on each context.
  let paralelo: KHR_parallel_shader_compile | null = null;
  const programas = {} as Record<K, Programa>;
  for (const k of Object.keys(fuentes) as K[]) programas[k] = { fuentes: fuentes[k], p: null, shaders: [], ok: null, lugares: new Map() };
  const piezas: Interna[] = [];
  let dpr = 1;
  let vista: [number, number] = [0, 0];
  const pantalla = identidad();
  const mv = identidad();
  const f32 = new Float32Array(16);

  // Compiles and links without asking how it went: the GPU's process does it
  // while the page goes on, and `enlazado` asks once the hands are here.
  const compilar = () => {
    if (gl.isContextLost()) return false;
    // Asked for before each context's first compile: Chrome only compiles in
    // parallel once it's on, and a restored context comes back with every
    // extension off (the old object's enum then answers null, with an error)
    // until it is asked for again, as three.js does by building its table of
    // extensions anew on every restore.
    paralelo = gl.getExtension("KHR_parallel_shader_compile");
    for (const prog of Object.values<Programa>(programas)) {
      const p = gl.createProgram();
      const vs = gl.createShader(gl.VERTEX_SHADER);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      if (!p || !vs || !fs) return false;
      gl.shaderSource(vs, prog.fuentes[0]);
      gl.compileShader(vs);
      gl.shaderSource(fs, prog.fuentes[1]);
      gl.compileShader(fs);
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      // As three.js does: the position is attribute 0, always an array.
      gl.bindAttribLocation(p, 0, "position");
      gl.linkProgram(p);
      Object.assign(prog, { p, shaders: [vs, fs], ok: null });
      prog.lugares.clear();
    }
    return true;
  };
  if (!compilar()) return null;

  const enlazado = (k: K) => {
    const prog = programas[k];
    // A lost context answers every question with null: that is no verdict on the program.
    if (gl.isContextLost() || !prog.p) return null;
    if (prog.ok === null) {
      prog.ok = gl.getProgramParameter(prog.p, gl.LINK_STATUS) === true;
      if (!prog.ok && process.env.NODE_ENV !== "production") {
        const [vs, fs] = prog.shaders;
        console.error(`manos-gl: «${k}» no enlazó`, gl.getProgramInfoLog(prog.p), vs && gl.getShaderInfoLog(vs), fs && gl.getShaderInfoLog(fs));
      }
      for (const s of prog.shaders) gl.deleteShader(s);
      prog.shaders = [];
    }
    return prog.ok === true;
  };

  const poner = (prog: Programa, nombre: string, v: Valor | M4) => {
    let l = prog.lugares.get(nombre);
    if (l === undefined) {
      l = prog.p && gl.getUniformLocation(prog.p, nombre);
      prog.lugares.set(nombre, l);
    }
    if (!l) return;
    if (typeof v === "number") gl.uniform1f(l, v);
    else if (v instanceof Float64Array) {
      f32.set(v);
      gl.uniformMatrix4fv(l, false, f32);
    } else if (v.length === 2) gl.uniform2f(l, v[0]!, v[1]!);
    else if (v.length === 3) gl.uniform3f(l, v[0]!, v[1]!, v[2]!);
    else if (v.length === 4) gl.uniform4f(l, v[0]!, v[1]!, v[2]!, v[3]!);
  };

  // three's reversePainterSortStable: render order first, then back to front, then the order they were made in.
  const atras = (a: { p: Interna; z: number }, b: { p: Interna; z: number }) =>
    a.p.orden !== b.p.orden ? a.p.orden - b.p.orden : a.z !== b.z ? b.z - a.z : a.p.id - b.p.id;

  const olvidar = () => {
    for (const prog of Object.values<Programa>(programas)) Object.assign(prog, { p: null, shaders: [], ok: null });
    for (const p of piezas) Object.assign(p, { vao: null, buffers: [] });
  };

  return {
    pieza<U extends Uniformes>(o: Opciones<K, U>) {
      const p: Interna = {
        u: o.u,
        mundo: identidad(),
        programa: programas[o.programa],
        modo: MODOS[o.modo],
        atributos: Object.entries(o.atributos).map(([n, [datos, k]]) => [n, datos, k]),
        indices: o.indices ?? null,
        cuenta: o.indices ? o.indices.length : (o.atributos.position?.[0].length ?? 0) / 3,
        suma: o.suma,
        profundidad: o.profundidad,
        orden: o.orden,
        id: piezas.length,
        centro: o.centro,
        vao: null,
        buffers: [],
      };
      piezas.push(p);
      return p as unknown as Pieza<U>;
    },
    listos() {
      const ext = paralelo;
      // Only a plain «not yet» (false) waits. Anything else, such as a context
      // lost meanwhile or a driver's odd answer, goes on to `enlazado`, whose
      // LINK_STATUS waits for the link and is always right.
      return !ext || Object.values<Programa>(programas).every((prog) => !prog.p || gl.getProgramParameter(prog.p, ext.COMPLETION_STATUS_KHR) !== false);
    },
    enlazado,
    subir(pieza) {
      const p = pieza as Interna;
      if (p.vao || !p.programa.p) return;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      for (const [nombre, datos, k] of p.atributos) {
        const lugar = gl.getAttribLocation(p.programa.p, nombre);
        if (lugar < 0) continue;
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(lugar);
        gl.vertexAttribPointer(lugar, k, gl.FLOAT, false, 0, 0);
        p.buffers.push(b);
      }
      if (p.indices) {
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, p.indices, gl.STATIC_DRAW);
        p.buffers.push(b);
      }
      gl.bindVertexArray(null);
      p.vao = vao;
    },
    medir(ancho, alto, r) {
      // three's setSize: the canvas floors, the viewport rounds.
      dpr = r;
      canvas.width = Math.floor(ancho * r);
      canvas.height = Math.floor(alto * r);
      vista = [Math.round(ancho * r), Math.round(alto * r)];
    },
    dibujar(lista, proyeccion, v) {
      multiplicar(proyeccion, v, pantalla);
      const orden = (lista as Interna[]).map((p) => ({ p, z: lejos(p.mundo, pantalla, p.centro) })).sort(atras);
      gl.viewport(0, 0, vista[0], vista[1]);
      // Transparent black, every buffer (three's autoClear with no background).
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.colorMask(true, true, true, true);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      // Every material: transparent, depthWrite false, depthFunc LessEqual, FrontSide (back faces culled).
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
      for (const { p } of orden) {
        if (!p.vao || !p.programa.p) continue;
        gl.useProgram(p.programa.p);
        poner(p.programa, "projectionMatrix", proyeccion);
        poner(p.programa, "modelViewMatrix", multiplicar(v, p.mundo, mv));
        for (const nombre in p.u) poner(p.programa, nombre, p.u[nombre]!);
        // Without premultiplied alpha, as three's materials blend by default.
        if (p.suma) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        if (p.profundidad) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);
        // A line's width is one pixel times the pixel ratio, where the browser allows more than one.
        if (p.modo === gl.LINES) gl.lineWidth(dpr);
        gl.bindVertexArray(p.vao);
        if (p.indices) gl.drawElements(p.modo, p.cuenta, gl.UNSIGNED_SHORT, 0);
        else gl.drawArrays(p.modo, 0, p.cuenta);
      }
      gl.bindVertexArray(null);
    },
    olvidar,
    compilar,
    borrar() {
      if (!gl.isContextLost()) {
        for (const p of piezas) {
          for (const b of p.buffers) gl.deleteBuffer(b);
          if (p.vao) gl.deleteVertexArray(p.vao);
        }
        for (const prog of Object.values<Programa>(programas)) {
          for (const s of prog.shaders) gl.deleteShader(s);
          if (prog.p) gl.deleteProgram(prog.p);
        }
      }
      olvidar();
      // Frees the context now instead of at garbage collection: browsers only allow a few at once.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

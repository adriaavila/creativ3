# El sistema de diseño de allok.fun

Actualizado 2026-09-15.

El sitio tiene **dos sistemas visuales**, a propósito, y no se mezclan:

| | `.allok` | `.rig` |
|---|---|---|
| Dónde | `/`, `/rei`, `/vocero`, `/agencia` | `/portfolio`, `/work`, `/lab`, `/writing` |
| Qué es | la cara comercial — lo que se contrata | el portafolio — la prueba de que funciona |
| Voz | Comfortaa sobre Geist, degradado, esquinas de 22px | Archivo Black, reglas duras, nada redondeado |
| Fondo | papel cálido `#f5f4f0`, roto por el cielo | papel, con el cielo sólo en el pie |

Los dos comparten el **cielo**: el mismo degradado, los mismos anclajes de
color. Es lo que hace que salte de una zona a otra sin que parezcan dos sitios.

Ambos bloques viven en `src/app/globals.css`, cada uno bajo su clase raíz. Una
página elige uno poniendo `className="allok"` o `className="rig"` en su div
exterior. Nunca los dos.

---

## El cielo

Un degradado de amanecer a anochecer, más dos resplandores desenfocados. Es el
único objeto de la marca que se repite en todas partes: portada, pie, botón
destacado, correo del pie, y el logo.

```css
linear-gradient(96deg,
  rgb(3 18 63)    0%,    /* noche */
  rgb(27 63 150)  26%,   /* azul */
  #67277d         58%,   /* violeta */
  rgb(180 16 101) 82%,   /* magenta — este es --dusk */
  #8f4a58         100%)  /* rescoldo */
```

Encima, dos `radial-gradient` con `filter: blur(42px)`: `--lit-dawn`
(`rgb(255 154 61)`, naranja, a la izquierda, opacidad .7) y `--lit-dusk`
(`rgb(255 227 194)`, crema, a la derecha, opacidad .5). El desenfoque es lo que
lo separa de un degradado de plantilla — sin él se ve plano.

Los mismos anclajes están en `src/lib/sky.ts` y en `.sky-plate` del sistema
`.rig`. **Si cambias uno, cambia los tres.**

### Piezas

| Clase | Qué hace |
|---|---|
| `.allok-sky` | el degradado + los dos resplandores. Pone `color: var(--on-sky)` y sube sus hijos a `z-index: 1` |
| `.allok-sky-text` | el mismo degradado recortado al texto (`background-clip: text`) — sólo para el correo del pie |
| `.allok-sky-rule` | una regla de 2px con el degradado, para cerrar el pie |
| `.allok-btn-sky` | el degradado como fondo de botón |

`.allok-sky` no es sólo para la portada: la sección final de `/agencia` lo usa
como tarjeta con `rounded-[26px]`. Funciona en cualquier caja, porque los
resplandores se posicionan en porcentajes.

---

## Tokens

Definidos en `.allok`:

| Token | Valor | Para qué |
|---|---|---|
| `--paper` | `#f5f4f0` | el fondo de todo lo que no es cielo |
| `--paper-2` | `#f1efeb` | un escalón más hondo — columnas del tablero |
| `--ink` | `#101112` | texto, y el fondo de las tarjetas destacadas |
| `--ink-60` | `#6b6d70` | texto de apoyo. **Es el color de casi todo el cuerpo** |
| `--ink-40` | `#9a9c9f` | etiquetas, metadatos |
| `--line` | `rgba(16,17,18,.1)` | bordes y separadores |
| `--dusk` | `#b41065` | el acento. Numeración, viñetas, enlaces dentro de texto |
| `--lit-dawn` | `rgb(255 154 61)` | el acento **sobre fondo oscuro** (`--dusk` no contrasta ahí) |
| `--lit-dusk` | `rgb(255 227 194)` | títulos de columna del pie |
| `--on-sky` | `rgb(247 244 239)` | texto sobre el cielo |

Regla de reparto: ~80% papel y tinta, ~15% cielo, ~5% `--dusk`. Si el magenta
aparece en más de un puñado de sitios por pantalla, deja de leerse como acento.

---

## Tipografía

Tres caras, ya cargadas por `next/font` en `src/app/layout.tsx`:

- **Comfortaa** (`--font-comfortaa`) — la voz de la marca. Sólo `.display` y
  `.display-sm`. Redonda y geométrica; por debajo de ~15px deja de leerse, así
  que **nunca en cuerpo de texto**.
- **Geist** (`--font-grotesk`) — todo el cuerpo, en toda la casa.
- **JetBrains Mono** (`--font-jetbrains`) — `.mono`: 11px, `letter-spacing:.14em`,
  mayúsculas. Etiquetas, numeración, navegación del pie. Nunca frases largas.

| Clase | Uso |
|---|---|
| `.display` | h1 y h2 de sección. `font-weight: 700`, `letter-spacing: -.03em`, `line-height: 1.03` |
| `.display-sm` | h3, nombres de plan, nombres de tarjeta. `600` |
| `.mono` | etiquetas |

Los tamaños van en `clamp()` sobre `vw`, no en escalones de breakpoint: el h1
de portada es `clamp(42px,7vw,92px)`, el h2 de sección `clamp(30px,4vw,50px)`.

---

## Movimiento

Poco, y siempre con una señal estática al lado — nunca el movimiento como
único aviso.

- **Pulsación**: `scale(0.96)` en `:active`. Es la única respuesta táctil de un
  botón, y está en `.allok-btn`. Las tarjetas-enlace usan `.98` porque son
  grandes.
- **Curva**: `cubic-bezier(.23, 1, .32, 1)` en todo.
- **Duración**: 160ms en botones, 200ms en tarjetas y en el `+` del FAQ. Nada
  por encima de 300ms.
- **`transition-property` siempre nombrada.** Nunca `transition: all`.
- **Hover sólo con ratón**: todo lo que cambie en hover va dentro de
  `@media (hover: hover) and (pointer: fine)`, para que un dedo no deje un
  estado pegado.

---

## El gesto que estructura las páginas

Las cuatro páginas comerciales usan el mismo movimiento: **el contenido rompe
el borde inferior del cielo**.

```tsx
<div className="allok-sky pb-[150px]"> …portada… </div>
<div className="relative z-[3] -mt-[130px] px-5 sm:px-10"> …el objeto… </div>
```

El `pb` del cielo y el `-mt` del objeto se mueven juntos: el `pb` siempre ~20px
mayor, para que quede un respiro de cielo bajo la tarjeta. Qué objeto rompe el
borde es lo que diferencia cada página:

| Página | Objeto |
|---|---|
| `/` | las tres puertas — REI, Vocero, Agencia |
| `/rei` | el tablero de etapas, con tarjetas de prospectos |
| `/vocero` | un hilo de WhatsApp, porque Vocero vive en la conversación |
| `/agencia` | las tres tarjetas de servicio |

---

## Las marcas

`src/components/allok/Marks.tsx`. Las tres son **el mismo trazo**: la onda de
voz de allok, con el degradado del cielo.

- `AllokMark` — la onda sola, sin contenedor. La casa.
- `ReiMark` — la onda dentro de un globo de conversación, que decae hasta una
  línea recta y termina en un punto. Ruido que se resuelve en respuesta.
- `VoceroMark` — la onda entre corchetes. La misma voz, recortada a la medida
  de un negocio.

`<Lockup>` es la firma. Sin `product` dice sólo **allok** — así va la portada.
Con `product` dice **allok × rei**, con la casa en peso bajo y el producto
mandando. Es la regla de toda marca con submarcas: quien compra REI compra a
allok, pero en esa página quien habla es REI.

El favicon del sitio es `src/app/icon.svg`, que Next resuelve solo.
`public/logo.svg` (la misma onda, en blanco → lima `#c5f04a`) es la versión
anterior de la marca; ninguna página la usa y se queda sólo para contextos
fuera del sitio.

---

## La estructura del sitio

```
/               allok — la casa. Tres puertas, y el portafolio como prueba.
├── /rei        producto. CRM de WhatsApp para inmobiliarias. $29/59/99 al mes.
├── /vocero     a medida. Agente de WhatsApp sobre tus sistemas. Se cotiza.
├── /agencia    todo lo demás: web, automatización, producto. USD 199/499/699.
└── /portfolio  la prueba —— y desde aquí manda el sistema `.rig`
    ├── /work       índice de sistemas, con capturas reales
    ├── /lab        experimentos
    └── /writing    notas
```

**Agencia y portafolio no son lo mismo, y el pie lo dice en columnas
separadas**: *Agencia* es lo que se contrata, *Portafolio* es la prueba de que
funciona. Confundirlos fue el problema del sitio anterior, donde `/work` hacía
las dos cosas y ninguna bien.

Las tres páginas comerciales se mandan tráfico entre ellas a propósito: `/rei`
manda a `/vocero` a quien no entra en un plan, `/vocero` compara los dos casos
de frente, y `/agencia` manda a los dos cuando lo que piden es atender
WhatsApp. Nadie queda sin salida.

### Los tres precios y por qué no se contradicen

El sitio anterior llegó a tener cuatro escalas de precio a la vez. Ahora son
tres, y cada una responde una pregunta distinta:

| | Qué se compra | Cómo se cobra |
|---|---|---|
| **REI** | software que ya existe | mensualidad fija. Los mensajes los factura Meta a la empresa del cliente, al costo |
| **Vocero** | un proyecto de integración | cotizado, con alcance y precio cerrados por escrito |
| **Agencia** | un entregable definido | precio cerrado por pieza, 50% al arrancar y 50% contra entrega |

La regla que las une, y que se repite en las tres páginas: **allok cobra el
software, no las conversaciones.**

---

## Antes de dar algo por terminado

- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Móvil a 375px: sin scroll horizontal, la navegación del encabezado
  desaparece por debajo de `md` y queda logo + acción.
- Un dato inventado en una página de producto es un error, no un marcador de
  posición. El tablero de `/rei` y el hilo de `/vocero` van rotulados como
  ilustración, y el número de sistemas sale de `PORTFOLIO_PROJECTS.length`, no
  de una constante escrita a mano.

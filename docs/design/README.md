# El sistema de diseño de allok.fun

Actualizado 2026-09-15.

El sitio tiene **dos sistemas visuales**, a propósito, y no se mezclan:

| | `.allok` | `.rig` |
|---|---|---|
| Dónde | `/`, `/rei`, `/vocero`, `/agencia` | `/portfolio`, `/work`, `/lab`, `/writing` |
| Qué es | la cara comercial — lo que se contrata | el portafolio — la prueba de que funciona |
| Voz | Comfortaa sobre Geist, esquinas de 22-30px | Archivo Black, reglas duras, nada redondeado |
| Fondo | negro `#08090a` arriba, papel `#f5f4f0` abajo | papel, con el cielo sólo en el pie |

Los dos comparten el **cielo**: el mismo degradado, los mismos anclajes de
color. Es lo que hace que salte de una zona a otra sin que parezcan dos sitios.

Ambos bloques viven en `src/app/globals.css`, cada uno bajo su clase raíz. Una
página elige uno poniendo `className="allok"` o `className="rig"` en su div
exterior. Nunca los dos.

---

## La regla: negro para abrir, cielo para cerrar

El cielo dejó de ser papel tapiz. Cuando el degradado llenaba todas las
portadas competía con lo único que importa —el producto— y al repetirse en
cuatro páginas dejaba de ser un momento para volverse fondo.

Ahora:

- **Las portadas son negras** (`.allok-void`, `#08090a`). El titular a tamaño
  de cartel y, debajo, el producto encendido.
- **El cielo vuelve al final**, una vez por página, en el bloque de cierre.
- **Entre medio manda el papel**, con mucho aire y reglas de pelo.

El degradado sigue vivo en el pie, en el botón destacado, en el correo y en el
logo. Lo que cambió es cuánta superficie ocupa.

## El cielo

Un degradado de amanecer a anochecer, más dos resplandores desenfocados.

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
| `.allok-void` | el negro de las portadas, con sus tokens `--on-void*` |
| `.allok-bloom` | **el resplandor detrás del producto** — se coloca respecto al objeto que ilumina, nunca respecto a la sección, para que no dependa de cuánto contenido haya arriba |

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
- **La frase que se enciende al bajar** (`Reveal.tsx`, una sola por página):
  cada palabra pasa de `--ink-40` a `--ink` conforme el párrafo sube por la
  pantalla, y cada una abre su ventana un poco más tarde que la anterior. Es
  `animation-timeline: view()` sobre el propio párrafo — el avance lo manda el
  scroll, no un reloj; el escalonado son dos custom properties por palabra
  (`--from`/`--to`) que calcula el componente. En escritorio el relleno arranca
  cuando el párrafo va por la mitad de la pantalla y termina justo cuando llega
  arriba.
  **El apagado vive en el fotograma `from`, nunca en la regla base**: si el
  navegador no trae `animation-timeline`, si el usuario pidió menos movimiento,
  o si la línea de tiempo queda inactiva, la frase sale entera en tinta plena
  en vez de quedarse gris.
- **Los deslizantes y la barra del navegador son cielo**: la pista de
  `input[type="range"]` y el pulgar del scrollbar en las páginas de allok
  llevan el mismo degradado del cierre (`--sky-stops`, declarado una sola vez
  en `:root`; el ángulo lo pone quien lo usa). Reemplazaron al lima del diseño
  anterior.

---

## El gesto que estructura las páginas

Cada página comercial enseña **un objeto propio** debajo de su titular. Es lo
que la diferencia de las demás, y en todos los casos es el producto, no una
ilustración:

| Página | Objeto |
|---|---|
| `/` | un teléfono con la conversación completa: la pregunta entra a las 3:14 y la respuesta sale con el cupo, la fecha y el precio |
| `/rei` | el tablero de etapas de una corredora |
| `/vocero` | un hilo con tres consultas al sistema del cliente dentro de una sola respuesta |
| `/agencia` | las tres tarjetas de servicio |

En `/` el objeto va dentro de un `.allok-bloom`, sobre negro. En las demás
todavía rompe el borde inferior de la portada:

```tsx
<div className="allok-void pb-[150px]"> …portada… </div>
<div className="relative z-[3] -mt-[130px] px-5 sm:px-10"> …el objeto… </div>
```

El `pb` de la portada y el `-mt` del objeto se mueven juntos, con el `pb` unos
20px mayor para que quede un respiro debajo de la tarjeta.

## La escala tipográfica de portada

| Clase | Dónde |
|---|---|
| `.hero` | el titular de portada — `clamp(2.75rem, 7.4vw, 6.5rem)`, tracking `-0.042em` |
| `.statement` | una frase que ocupa una sección entera — `clamp(1.9rem, 4.6vw, 4rem)` |
| `.lede` | el párrafo bajo el titular — `clamp(1.0625rem, 1.35vw, 1.3125rem)`, interlineado 1.55 |

Comfortaa a tamaño de cartel pide el tracking más cerrado que aguanta antes de
que las panzas de las letras se toquen; por eso `-0.042em` y no el `-0.03em`
de `.display`.

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

La portada **vende el CRM directamente**, genérico, para negocios de
servicios: clínicas, academias, legales, talleres, turismo, tiendas. REI no es
otro producto ni otro precio — es el mismo, con el vocabulario de una
corredora. Eso mantiene una sola historia de precio para el mismo software.

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
| **allok** (y REI) | software que ya existe | mensualidad fija. Los mensajes los factura Meta a la empresa del cliente, al costo |
| **Vocero** | un proyecto de integración | cotizado, con alcance y precio cerrados por escrito |
| **Agencia** | un entregable definido | precio cerrado por pieza, 50% al arrancar y 50% contra entrega |

La regla que las une, y que se repite en las tres páginas: **allok cobra el
software, no las conversaciones.**

Cómo se cobra cada una, con su estado real en Stripe, está en
[`docs/cobros.md`](../cobros.md).

---

## Antes de dar algo por terminado

- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Móvil a 375px: sin scroll horizontal, la navegación del encabezado
  desaparece por debajo de `md` y queda logo + acción.
- Un dato inventado en una página de producto es un error, no un marcador de
  posición. El tablero de `/rei` y el hilo de `/vocero` van rotulados como
  ilustración, y el número de sistemas sale de `PORTFOLIO_PROJECTS.length`, no
  de una constante escrita a mano.

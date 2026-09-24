# El sistema de diseño de allok.fun

Actualizado 2026-09-23.

El sitio tiene **dos voces** y **tres superficies**, y ninguna se mezcla con
otra dentro de la misma página:

| | `.allok` | `.allok-ops` | `.rig` |
|---|---|---|---|
| Dónde | `/`, `/rei`, `/vocero`, `/agencia` | `/ops/*`, `/ops-login` | `/portfolio`, `/work`, `/lab`, `/writing` |
| Qué es | la cara comercial — lo que se contrata | la herramienta interna | el portafolio — la prueba de que funciona |
| Voz | Geist por peso y tracking, esquinas de 22-30px | Geist, densidad de herramienta, esquinas de 8-20px | Archivo Black, reglas duras, nada redondeado |
| Fondo | negro `#08090a` arriba, papel `#f5f4f0` abajo | Cloud `#f7f8f8`, un escalón por debajo de las tarjetas | papel, con el cielo sólo en el pie |

`.allok-ops` no es un sistema aparte: es `.allok` con los escalones de
superficie y los estados que una herramienta de trabajo necesita y una landing
no. Usa **los mismos nombres de token que la app del cliente**
(`vocero-crm`, bloque `[data-saas="true"]`), a propósito: marketing, ops y
producto tienen que poder copiarse una clase entre sí.

Desde el 2026-09-24 Ops también tiene **los mismos valores** que el CRM: Cloud
y tinta, la acción principal en tinta (en Cloud dentro de `.on-ink`) y el color
sólo para estado, con los `--st-*` del bloque de marca. El lima de antes se
fue: en allok el verde dice «todo bien», y un botón no es un estado.

Antes de esto, Ops tenía su propia paleta azul grisácea y, dentro de ella,
dos: el panel de clientes en gris claro y el de conversaciones en negro. 823
colores escritos a mano, 218 valores distintos para unos quince papeles. Hoy
no queda ninguno.

**Dos reglas que el compilador no hace cumplir:**

- **`.allok-ops` no pinta.** Tailwind v4 mete sus utilidades en
  `@layer utilities`, y una regla fuera de capa le gana a cualquier regla
  dentro sin importar el orden del archivo. Un `background` en el ámbito
  ganaría sobre el `bg-[…]` del mismo elemento y la página saldría del color
  equivocado sin que nada fallara. El fondo lo pone quien usa el ámbito.
- **`--assist` es la acción, no un estado.** Es tinta (Cloud en `.on-ink`) y
  pinta botones y lo destacado. Lo que dice cómo está algo (en línea, listo,
  habilitado, hecho) va en `--st-activo*`; lo que espera por una persona, en
  `--st-atencion*`. `--ink-60` pasa AA en los cuatro escalones (4,82 en el más
  hondo).

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

**Texto chico sobre el cielo.** Los resplandores se posicionan en porcentajes
de la caja, así que caen sobre otras palabras según el ancho y el tamaño de la
tarjeta: la calculadora de `/rei` pasaba a 375 y 1440 y bajaba a 3,9:1 a 768,
cuando la tarjeta ocupa todo el ancho y la línea de 13,5 px queda debajo del
naranja. Por eso **cada tarjeta de cielo con texto chico se mide por su cuenta**,
en píxeles reales (el peor píxel de cada palabra, con el texto transparente) y
en toda la barrida: 320, 360, 375, 390, 412, 430, 768, 820, 1024, 1280 y 1440.
Los valores que salen de esa medida son de esa tarjeta; no se copian a otra sin
medirla.

Hoy hay dos:

- La calculadora de `/rei` lleva `.allok-sky-quiet` (naranja a .5, crema a .38)
  y `.allok-sky-panel` detrás de las filas de valores. Peor píxel: 4,8:1.
- El cierre de `/agencia` lleva `.allok-sky-hush` (naranja a .5, crema a .25):
  un párrafo de 17 px en una tarjeta ancha pide menos crema que la calculadora.
  Peor píxel: 4,6:1.

Los mismos anclajes están en `src/lib/sky.ts`, en `.sky-plate` del sistema
`.rig` y, sueltos, en los tokens `--sky-night`, `--dusk`, `--lit-dawn` y
`--lit-dusk` de `.allok`. **Si cambias uno, cambia todos.**

### Piezas

| Clase | Qué hace |
|---|---|
| `.allok-sky` | el degradado + los dos resplandores. Pone `color: var(--on-sky)` y sube sus hijos a `z-index: 1` |
| `.allok-sky-quiet` | se suma a `.allok-sky`: naranja a .5, crema a .38. Valores medidos en la calculadora de `/rei`; otra tarjeta se mide por su cuenta antes de usarla. Va fuera de capa, como `.allok-sky::before/::after` |
| `.allok-sky-hush` | se suma a `.allok-sky`: naranja a .5, crema a .25. Valores medidos en el cierre de `/agencia` (párrafo de 17 px). Fuera de capa, igual que `quiet` |
| `.allok-sky-panel` | una capa en la noche del cielo (`--sky-night`) al 30%, detrás de filas de texto chico que caen sobre un resplandor. Sólo pinta: el borde, el radio y el aire los pone quien la usa. En la calculadora de `/rei` sube los valores de 4,2:1 a más de 6:1 |
| `.allok-sky-text` | el mismo degradado recortado al texto (`background-clip: text`) — sólo para el correo del pie |
| `.allok-sky-rule` | una regla de 2px con el degradado, para cerrar el pie |
| `.allok-btn-sky` | el degradado como fondo de botón |
| `.allok-void` | el negro de las portadas, con sus tokens `--on-void*` |
| `.allok-on-ink` | marca una tarjeta negra dentro de una página de papel: el plan destacado de `/`, `/rei` y `/agencia`, el cierre de `/` y la columna oscura de `/vocero`. Sólo cambia el anillo de foco a `--on-void` (ver «Foco»); el fondo y el texto los pone la tarjeta |
| `.allok-bloom` | **el resplandor detrás del producto** — se coloca respecto al objeto que ilumina, nunca respecto a la sección, para que no dependa de cuánto contenido haya arriba |

`.allok-sky` no es sólo para la portada: la sección final de `/agencia` lo usa
como tarjeta con `rounded-[26px]`. Funciona en cualquier caja, porque los
resplandores se posicionan en porcentajes.

---

## Tokens

Definidos en `.allok` (`src/app/globals.css`). Los contrastes son sobre blanco
salvo que se diga otra cosa.

| Token | Valor | Para qué |
|---|---|---|
| `--paper` | `#f7f8f8` | el fondo de todo lo que no es cielo |
| `--paper-2` | `#f1f2f2` | un escalón más hondo — columnas del tablero |
| `--ink` | `#0b0d0e` | texto, y el fondo de las tarjetas destacadas |
| `--ink-60` | `#5b6167` | texto de apoyo y etiquetas chicas (6,27:1). **Es el color de casi todo el cuerpo** |
| `--ink-40` | `#8a9097` | relleno, texto grande y el gris de partida de la frase que se enciende. **No es tinta de texto chico**: 3,22:1 |
| `--line` | `rgba(11,13,14,.1)` | bordes y separadores |
| `--sky-night` | `rgb(3 18 63)` | el primer anclaje del cielo («noche»). Base de `.allok-sky-panel` |
| `--dusk` | `#b41065` | el acento. Numeración, viñetas, enlaces dentro de texto (6,56:1). Sobre fondo oscuro no: 2,88:1 sobre `#101112` |
| `--lit-dawn` | `rgb(255 154 61)` | el acento **sobre fondo oscuro** (8,95:1 sobre `#101112`) |
| `--lit-dusk` | `rgb(255 227 194)` | títulos de columna del pie, y el valor destacado sobre el cielo |
| `--on-sky` | `rgb(247 244 239)` | texto sobre el cielo |

Y en el bloque de marca (el segundo `.allok`, espejo de `src/lib/brand.ts`):

| Token | Valor | Para qué |
|---|---|---|
| `--cloud` | `#f7f8f8` | el papel de `/`, y su texto sobre `--ink` |
| `--signal` | `#315cff` | «trabajando». El anillo de foco sobre papel (5,12:1 sobre blanco, 4,81:1 sobre Cloud) |
| `--signal-ink` | `#2348cc` | el mismo estado como texto sobre papel |
| `--ok` / `--ok-ink` | `#20e58d` / `#0a7a48` | «resuelto». `--ok` pinta y se lee sobre negro; como texto sobre papel va `--ok-ink` |
| `--st-*` | ver `brand.ts` | los cuatro estados, cada uno con `dot`, `ink` y `soft` |
| `--wa-out` | `#25d366` | las burbujas de WhatsApp. **No es un token de marca** |
| `--void` / `--void-2` | `#0b0d0e` / `#101315` | el negro de las portadas |
| `--on-void` | `#f5f4f0` | texto sobre negro, y el anillo de foco en las portadas y el pie |
| `--on-void-60` | `rgba(245,244,240,.62)` | texto de apoyo sobre negro (7,10:1) |
| `--on-void-40` | `rgba(245,244,240,.38)` | sólo relleno o texto grande sobre negro |
| `--hair-void` | `rgba(245,244,240,.12)` | bordes sobre negro |

Regla de reparto: ~80% papel y tinta, ~15% cielo, ~5% `--dusk`. Si el magenta
aparece en más de un puñado de sitios por pantalla, deja de leerse como acento.

---

## Foco y áreas táctiles

**El anillo.** 2 px, separado 3 px de la caja (la regla global
`:focus-visible`). Dentro de `.allok` cambia sólo el color, según la superficie
(`src/app/globals.css`, junto al deslizante):

| Superficie | Regla | Color | Medido |
|---|---|---|---|
| papel y blanco | `.allok :focus-visible` | `--signal` | 5,12:1 blanco, 4,81:1 Cloud |
| portada negra | `.allok .allok-void :focus-visible` | `--on-void` | la navegación va a .85: 12,79:1 (en `--signal` era 3,04:1) |
| tarjeta negra sobre papel | `.allok .allok-on-ink :focus-visible` | `--on-void` | 17,70:1 sobre `--ink`, 17,18:1 sobre `#101112` (en `--signal` era 3,81 y 3,70:1, pegado al botón de cielo) |
| cielo | `.allok .allok-sky :focus-visible` | `--on-sky` | 5,8 a 16:1 sobre los anclajes (`--signal` da 1,25-1,9:1) |
| pie | `.allok footer :focus-visible` | `--on-void` | los enlaces van a .7: 8,83:1 (en `--signal` era 2,40:1) |
| deslizante | `.allok input[type="range"]:focus-visible` | sin outline; el anillo va en el pulgar, `--dusk` a 2 px | 6,56:1 sobre blanco |

Tres reglas:

- **El anillo se mide con la opacidad heredada.** Un enlace a .7 pinta su anillo
  a .7. Por eso el pie y las portadas negras llevan `--on-void` y no el azul.
- **Toda superficie oscura lleva su clase.** Una tarjeta negra nueva dentro de
  una página de papel se marca con `.allok-on-ink`; si no, su anillo sale azul
  a 3,7:1, justo al lado del botón de cielo, que también es azul.
- **Un control, un anillo.** Si el anillo va en un pseudo-elemento (el pulgar
  del deslizante), el control lleva `outline: none` en `:focus-visible`. Si no,
  salen dos, y el del control de 44 px cruza la etiqueta de arriba.
- **El anillo no pisa texto vecino.** Ocupa 5 px fuera de la caja (separación
  más grosor). En una pila de enlaces deja al menos 4 px entre la caja y el
  texto de al lado: el título de columna del pie lleva `mb-1` y la fila legal
  `gap-y-1`, que sólo se nota cuando se parte en dos líneas.

**Áreas táctiles de 44 px.** Un enlace dentro de una frase no cuenta; todo lo
demás mide al menos 44 px de alto:

| Patrón | Cómo | Dónde |
|---|---|---|
| enlace de texto suelto | `inline-flex min-h-11 items-center`, y se recorta el margen de arriba (`mt-6` → `mt-3`) para que el texto no se mueva | WhatsApp y fila legal del pie, «Ver allok» en `/vocero`, acciones de las tarjetas de `/agencia` |
| enlaces apilados | `py-3.5` en cada enlace y sin `gap`: 44,5 px cada uno, parejos | columnas del pie |
| cabecera | logo `inline-flex min-h-11 min-w-11 items-center`, navegación `py-3`, acción `!py-3` (46 px) | `SiteHeader` |
| deslizante | el `input[type="range"]` mide 44 px de alto; la pista pinta 6 px | calculadora de `/rei` |
| botón | `.allok-btn` ya pasa de 44 px con su relleno | todo el sitio |

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

### Los gráficos que se mueven (`/`)

La regla de los 300ms es para la interfaz: lo que responde a un toque. Los
gráficos de fondo son otra cosa y tienen sus propias reglas.

**Una gramática.** Todo sale del anillo y el punto: un círculo abierto es
alguien esperando; el punto que lo cierra es la respuesta. **Ámbar llega, verde
sale.** Nada de ilustraciones, robots ni íconos de catálogo: cada pieza es la
marca a otra escala, o el producto mismo en marcha.

**Un objeto que se mueve por sección**, y el movimiento cuenta algo del
producto:

| Sección | Pieza | Qué cuenta |
|---|---|---|
| portada | `Conversation.tsx` | el WhatsApp del negocio, en bucle: Carla escribe («escribiendo…» en la barra), su pregunta entra, allok redacta en la caja de texto (etiqueta azul «allok»), manda, y los vistos pasan de ✓ a ✓✓ azul |
| portada | `NightOrbit.tsx`, detrás del teléfono | los mensajes de la noche: suben ámbar por la izquierda, pasan por detrás del aparato y bajan verdes por la derecha. El color cambia siempre tapado: es el teléfono el que contesta |
| `#control`, arriba | `NightTicker` | «Mientras dormías»: dos filas de preguntas con su hora, que se cruzan con el scroll |
| `#control` | `ControlCenter.tsx` | el tablero en vivo: alguien llega (azul, escribiendo), se resuelve (verde) o te lo pasa (ámbar), y los contadores suben. Corre el guion una vez y se queda |
| cómo funciona | `StepGlyph` | acción a la izquierda (teléfono, globo, interruptor), resultado a la derecha: el anillo que se cierra |
| para quién | `CloseMark` | la viñeta de cada sector se cierra cuando la fila sube por la pantalla |
| cierre | `NightSky` | estrellas que se encienden ámbar y quedan verdes, y el amanecer que sube con el scroll |

Reglas:

- **El estado final vive en la regla base.** Sin JS, sin línea de tiempo de
  scroll o con `prefers-reduced-motion: reduce`, cada pieza sale completa y
  quieta: el hilo entero, el tablero lleno, los anillos cerrados.
- **Lo que corre con un reloj se para fuera de pantalla** (`IntersectionObserver`
  en la órbita, el hilo y el tablero). Lo que corre con el scroll sólo se
  mueve si quien lee se mueve.
- **Nunca un punto vivo junto a texto chico.** La órbita desvanece su punta
  izquierda donde empieza la columna del texto; las estrellas del cierre bajan
  al 25% donde va el texto, que además es gris opaco (`#919292`, el
  `white/55` de antes ya mezclado): uno translúcido deja ver la estrella a
  través de la letra.
- **El teléfono tiene las proporciones de uno real** (`aspect-ratio: 71.6 /
  146.6`, 320 px de ancho). El hilo se apoya abajo y lo nuevo asoma por
  detrás de la caja de texto. Las órbitas miden menos que medio teléfono de
  alto (ry < 327) para que arriba y abajo queden siempre detrás.
- **El papel tapiz del chat es de noche**: luna, visto, destello y globo al
  4,5%. El símbolo no va de garabato: sigue la regla de «donde no cabe una
  palabra».

---

## El gesto que estructura las páginas

Cada página comercial enseña **un objeto propio** debajo de su titular. Es lo
que la diferencia de las demás, y en todos los casos es el producto, no una
ilustración:

| Página | Objeto |
|---|---|
| `/` | el WhatsApp del negocio a las 3:14, contándose en bucle: la pregunta entra y allok escribe la respuesta con el cupo, la fecha y el precio. Alrededor, las órbitas de la noche |
| `/rei` | el tablero de etapas de una corredora |
| `/vocero` | un hilo con tres consultas al sistema del cliente dentro de una sola respuesta |
| `/agencia` | las tres tarjetas de servicio |

En `/` el objeto va sobre Cloud, centrado en su columna y dentro de sus
órbitas (`NightOrbit`); la portada lleva `overflow-x-clip` para que las
órbitas no abran scroll horizontal. En las demás
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

Dos piezas, un solo punto. El punto es el estado del sistema (`STATES` en
`src/lib/brand.ts`): verde cuando todo está bien, azul atendiendo, ámbar pide
atención, gris en pausa. Por eso ninguna de las dos se pinta sin `state`.

- **El logotipo, `all ● k`** (`AllokLogo variant="wordmark"`). El punto ocupa
  el sitio de la `o`; en verde se lee «all ok».
- **El símbolo: un círculo que el punto cierra** (`AllokLogo variant="mark"`,
  geometría en `MARK`). El círculo es la conversación, y es «all»: todo.
  Abierto, es un cliente esperando. El punto es la respuesta que lo cierra, el
  «ok». Va a 130°, abajo a la derecha, donde sale la cola de un mensaje
  enviado. Es el hueco que viaja en el tramo «procesando» del Lottie, ya
  aterrizado. Anillo r16, trazo 6,5 con puntas redondas, punto r6,5, 2,5 de
  aire a cada lado, en una caja de 64 con esquina 17.

Reglas:

- El símbolo va donde no cabe una palabra: favicon, avatar de WhatsApp,
  ícono de app, barra lateral plegada. **Nunca junto al logotipo**: serían dos
  puntos de estado diciendo lo mismo.
- El anillo es Cloud sobre Ink. El color es sólo del punto.
- El verde nunca pinta un globo de conversación: es el territorio de WhatsApp.
- Al ángulo se le dice 130°, no «4:20».

`<Lockup>` (`src/components/allok/Marks.tsx`) es la firma. Sin `product` dice
sólo **allok**; así va la portada. Con `product` dice **allok × rei**, con la
casa en peso bajo y el producto mandando: quien compra REI le compra a allok,
pero en esa página quien habla es REI.

El favicon es `src/app/icon.svg`, que Next resuelve solo, y `public/logo.svg`
es el mismo ícono para usos fuera del sitio. Los dos copian `MARK`.

**El CRM también lo copia.** `vocero-crm` (app.allok.fun, crm.allok.fun y cada
negocio) lo tiene en `ALLOK_MARK` (`src/lib/favicon.ts`), con `icon.svg`, el
`apple-icon` y los PNG de la app instalable. Si cambia `MARK`, se cambian allá
en el mismo día; la lista está en `vocero-crm/design/SOURCE.md`.

**El brief del símbolo**, en inglés para generadores de imagen:

> Design a logo for allok with a symbolic mark that represents a business that
> never leaves a customer on read: every WhatsApp conversation answered, day or
> night, and one light that tells the owner all is ok. Keep it simple enough to
> be recognized at a glance, but meaningful enough to tell a story.

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
- Tres columnas desde `md` dejan 163 px de contenido por tarjeta a 768. Una
  fila nombre + etiqueta sin `flex-wrap` no se parte, y como la tarjeta es un
  `grid`, estira todo lo demás hasta su ancho: en `/agencia` «Más elegido», el
  botón y dos viñetas se salían de la tarjeta negra entre 768 y 796. Ahí la
  fila va con `flex-wrap gap-x-3 gap-y-1` (la etiqueta baja debajo del nombre
  cuando no cabe) y la tarjeta con `min-w-0`. En `/` y `/rei` la fila cabe hoy;
  un nombre de plan más largo pide lo mismo. Se barre de 320 a 1440 de 4 en
  4 px buscando texto fuera de su tarjeta.
- Un hijo de `grid` o `flex` no baja del ancho de su contenido
  (`min-width: auto`). Dos casos que ya pasaron: en el centro de control de
  `/`, cada fila de actividad lleva un texto `truncate` y, sin `min-w-0`, la
  pista medía 318 px dentro de una tarjeta de 278 a 320: la tarjeta es
  `overflow-hidden` y cortaba las horas («3:» por «3:16») hasta 332. En la
  calculadora de `/rei`, la tarjeta de cielo tenía `min-w-[260px]` fijo y a
  320-324 empujaba los deslizantes 5 px fuera de la tarjeta blanca; ahora es
  `sm:min-w-[260px]`. La barrida cuenta también las tarjetas con
  `overflow-hidden`, donde lo que sobra no se ve fuera: se corta. Sólo el texto
  cortado por su propia caja con elipsis (`truncate`) no cuenta.
- Un aviso de error que aparece debajo de un botón se trae a la vista al
  aparecer: en `/pago/juanete` a 320x640 el botón termina en 631 px y el aviso
  nacía en 647-687, fuera de pantalla. `ProjectCheckout` lo lleva con
  `scrollIntoView({ block: "nearest" })` y `scroll-mb-4`. Se prueba con la API
  de pago interceptada, no contra Stripe.
- Un dato inventado en una página de producto es un error, no un marcador de
  posición. El tablero de `/rei` y el hilo de `/vocero` van rotulados como
  ilustración, y el número de sistemas sale de `PORTFOLIO_PROJECTS.length`, no
  de una constante escrita a mano.

# Servicios Creativos — Landing Editorial

La agencia que automatiza LATAM. Landing page con estética editorial, mucho silencio visual y animaciones cinemáticas usando Next.js 14, TailwindCSS y GSAP.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS 4
- TypeScript
- Tipografía: Fraunces (Display), Italiana (Editorial), JetBrains Mono (Metadata)
- Animaciones: GSAP + ScrollTrigger
- Smooth Scroll: Lenis

## Cómo correrlo

Instalá las dependencias y corré el servidor de desarrollo:

```bash
pnpm install
pnpm dev
```

Visitá `http://localhost:3000`.

## Organización del código

- `src/app/page.tsx`: Es el archivo principal que renderiza todas las secciones en orden.
- `src/app/globals.css`: Contiene las variables del design system (`--noche`, `--cobalto`, etc.), las texturas (grain, vignette) y animaciones nativas clave (como `animate-reveal-char`).
- `src/app/layout.tsx`: Configuración de fuentes y metadata (SEO).
- `src/app/opengraph-image.tsx`: Genera la imagen OG dinámicamente con `@vercel/og`.
- `src/components/landing/*.tsx`: Componentes para cada sección, modularizados para separar la lógica de animación.

## Dónde ajustar...

### 1. El Copy
El texto vive directamente en los componentes dentro de `src/components/landing/`:
- **Hero (`Hero.tsx`)**: Modificá el título desestructurado y la metadata editorial.
- **Tesis (`Tesis.tsx`)**: Los párrafos del manifiesto.
- **Productos (`Productos.tsx`)**: En el arreglo constante `PRODUCTS` en la parte superior del componente.
- **Marquee (`Marquee.tsx`)**: En la lista de `items`.
- **Principios (`Principios.tsx`)**: En la constante `PRINCIPIOS`.
- **Método (`Metodo.tsx`)**: Los párrafos del ensayo.
- **Puertas (`Puertas.tsx`)**: Los enlaces (mailto, links externos) y textos en la constante `PUERTAS`.

### 2. Las Animaciones
Las animaciones cinemáticas se manejan con `gsap` y `ScrollTrigger` dentro del `useEffect` de cada componente.
- **Tiempos y Easing**: Editá el objeto de configuración en los llamados `gsap.to()` / `gsap.fromTo()`.
- **Sticky Scroll (Productos)**: Revisá el mapeo matemático en la propiedad `onUpdate` de `ScrollTrigger` dentro de `Productos.tsx`.
- **Animaciones CSS**: `globals.css` maneja keyframes nativos y utilidades globales. Las transiciones de hover se realizan con las clases de Tailwind (`duration-500`, `transition-all`, etc).

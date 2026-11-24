import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkSvg, Rise, WordmarkSvg, vars } from "@/components/ak/Brand";
import Shell from "@/components/ak/Shell";
import Escribeme from "@/components/vitrina/Escribeme";
import { APUESTAS, apuesta } from "@/lib/apuestas";

// Las páginas de prueba de la semana del 24 de noviembre (src/lib/apuestas.ts):
// una por cliente posible, en español, fuera del menú, del sitemap y de Google.
// Una sola salida, WhatsApp, con la frase que dice de qué página viene.

export const dynamicParams = false;

export function generateStaticParams() {
  return APUESTAS.map((a) => ({ apuesta: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/para/[apuesta]">): Promise<Metadata> {
  const a = apuesta((await params).apuesta);
  if (!a) return {};
  const url = `/para/${a.slug}`;
  return {
    title: { absolute: a.titulo },
    description: a.descripcion,
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: { title: a.titulo, description: a.descripcion, url, siteName: "allok", type: "website", locale: "es", images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title: a.titulo, description: a.descripcion, images: ["/opengraph-image"] },
  };
}

export default async function PaginaApuesta({ params }: PageProps<"/para/[apuesta]">) {
  const a = apuesta((await params).apuesta);
  if (!a) notFound();

  return (
    <Shell>
      <div lang="es">
        <header className="header header-portada" data-theme="ink">
          <a className="btn btn-primary saltar" href="#contenido">
            Saltar al contenido
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> simple, sin JS de next/link */}
          <a className="wordmark" href="/" aria-label="allok, inicio">
            <WordmarkSvg />
          </a>
          <Escribeme className="agente-enlace" flecha={false} mensaje={a.mensaje}>
            WhatsApp
          </Escribeme>
        </header>

        <main id="contenido">
          <section className="section-intro archivo-intro" data-theme="ink" data-stagger aria-labelledby="apuesta-titulo">
            <p className="label" data-reveal="fade">
              {a.para}
            </p>
            <h1 id="apuesta-titulo" className="display" data-reveal="rise" style={vars({ "--d": "120ms" })}>
              <Rise>{a.promesa[0]}</Rise>
              <Rise line={1}>{a.promesa[1]}</Rise>
            </h1>
            <p className="lead" data-reveal style={vars({ "--d": "320ms" })}>
              {a.bajada}
            </p>
            <div className="para-acciones" data-reveal style={vars({ "--d": "420ms" })}>
              <Escribeme mensaje={a.mensaje}>{a.boton}</Escribeme>
            </div>
          </section>

          <section className="section section-stack" data-theme="cloud" data-stagger aria-labelledby="te-llevas-titulo">
            <div className="section-title">
              <p className="label" data-reveal="fade">
                Lo que te llevas
              </p>
              <h2 id="te-llevas-titulo" className="headline" data-reveal="rise">
                <Rise>Lo que queda</Rise>
                <Rise line={1}>funcionando.</Rise>
              </h2>
            </div>
            <ul className="principles para-lista" data-reading data-stagger>
              {a.teLlevas.map((t) => (
                <li key={t} data-reveal="row">
                  <MarkSvg />
                  <b>{t}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="section section-stack" data-theme="ink" data-stagger aria-labelledby="prueba-titulo">
            <div className="section-title">
              <p className="label" data-reveal="fade">
                La prueba
              </p>
              <h2 id="prueba-titulo" className="headline" data-reveal="rise">
                <Rise>{a.prueba.titulo}</Rise>
              </h2>
            </div>
            <div className="sobre-mi">
              {a.prueba.texto.map((t) => (
                <p key={t} className="body" data-reveal>
                  {t}
                </p>
              ))}
              {a.prueba.enlace ? (
                <a className="btn btn-link" href={a.prueba.enlace.href} data-reveal>
                  {a.prueba.enlace.texto} <span className="arw arw-r" aria-hidden="true">→</span>
                </a>
              ) : null}
            </div>
          </section>

          <section className="section section-stack" data-theme="cloud" data-stagger aria-labelledby="como-titulo">
            <div className="section-title">
              <p className="label" data-reveal="fade">
                Cómo empezamos
              </p>
              <h2 id="como-titulo" className="headline" data-reveal="rise">
                <Rise>Precio cerrado</Rise>
                <Rise line={1}>antes de empezar.</Rise>
              </h2>
            </div>
            <div>
              <ol className="principles" data-reading data-stagger>
                {a.pasos.map((p) => (
                  <li key={p.n} data-reveal="row">
                    <b>
                      {p.n} {p.titulo}
                    </b>
                    <span>{p.texto}</span>
                  </li>
                ))}
              </ol>
              <div className="empezar-pie">
                <p className="body" data-reveal>
                  Soy Adrián Avila, ingeniero industrial y AI engineer. Trabajo solo, con agentes de IA que escriben buena parte del
                  código, así que desde la primera conversación hasta la entrega hablas conmigo.
                </p>
                <Escribeme mensaje={a.mensaje} data-reveal>
                  {a.boton}
                </Escribeme>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Shell>
  );
}

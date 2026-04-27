import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./mistica.css";

export const metadata: Metadata = {
  title: "Mística · Escuela de natación, ordenada en una app",
  description:
    "Mística organiza tu escuela de natación: alumnos, asistencia y cobros en bolívares y divisa. Sin Excel, sin cuadernos.",
};

const FEATURES = [
  {
    n: "01",
    title: (
      <>
        Tu día, en <em>una pantalla</em>
      </>
    ),
    desc:
      "Saludo, alertas de mora, próximos vencimientos y horario de hoy. Llegas a la piscina y ya sabes qué clase toca, cuántos alumnos vienen y a quién recordarle el pago.",
    img: "home.png",
    alt: "Pantalla de inicio de Mística con saludo y horario del día",
  },
  {
    n: "02",
    title: (
      <>
        Métricas que <em>importan</em>
      </>
    ),
    desc:
      "Alumnos activos, cobrado del mes, en mora y ventas de productos. Tasa de cobranza con anillo, ingresos de los últimos 6 meses. Dejas de adivinar cómo va el negocio.",
    img: "dashboard.png",
    alt: "Dashboard de Mística con métricas y gráfico de ingresos",
  },
  {
    n: "03",
    title: (
      <>
        Alumnos <em>ordenados</em>
      </>
    ),
    desc:
      "Buscas, filtras por activos o suspendidos, ves al toque quién está al día y quién en mora. Cada alumno con su clase y horario asignado. Adiós cuaderno, adiós lista de WhatsApp.",
    img: "alumnos.png",
    alt: "Listado de alumnos con estado de pago y clase",
  },
  {
    n: "04",
    title: (
      <>
        Cobros que <em>se cobran solos</em>
      </>
    ),
    desc:
      "Inscripciones y mensualidades por mes, filtradas por estado. Botón de pagado, contador de mora, recordatorio masivo a los 39 que deben. Tu efectivo deja de perderse.",
    img: "cobros.png",
    alt: "Pantalla de cobros con lista de pagos pendientes",
  },
];

export default function MisticaPage() {
  return (
    <div className="mistica-page">
      <nav className="m-nav">
        <Link href="/" className="logo">
          Mís<em>tica</em>
          <span className="logo-dot" />
        </Link>
        <ul>
          <li>
            <a href="#vs">Por qué</a>
          </li>
          <li>
            <a href="#features">Funciones</a>
          </li>
          <li>
            <a href="#quien">Para quién</a>
          </li>
        </ul>
        <a
          href="https://mistica-app-fawn.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="cta"
        >
          Ver demo
        </a>
      </nav>

      {/* HERO */}
      <header className="m-hero">
        <div className="m-hero-text">
          <div className="m-tag">
            <span className="pulse" />
            Caso · Escuela de natación
          </div>
          <h1>
            Tu escuela de <em>natación</em>,
            <br />
            ordenada en{" "}
            <span className="underline">
              una app.
              <svg viewBox="0 0 300 14" fill="none" preserveAspectRatio="none">
                <path
                  d="M2 10 Q 75 2, 150 8 T 298 6"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="m-hero-sub">
            <strong>Mística</strong> reemplaza el cuaderno, el Excel y los grupos
            de WhatsApp por un <em>panel claro</em>: alumnos, asistencia, cobros
            en bolívares y divisa, productos. Construido para escuelas pequeñas
            que quieren verse <em>profesionales</em> sin contratar contador.
          </p>
          <div className="m-hero-actions">
            <a
              href="https://mistica-app-fawn.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="m-cta"
            >
              Probar la demo
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 11L11 3M11 3H5M11 3V9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#features" className="m-secondary">
              Ver funciones
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 1.5L9 6L3 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="m-phone">
          <Image
            src="/projects/mistica/home.png"
            alt="Pantalla de inicio de la app Mística"
            width={640}
            height={1280}
            priority
          />
          <div className="m-phone-label">
            ↖ así lo ve el profe
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="m-marquee">
        <div className="m-marquee-track">
          <span>
            Cobros en Bs y divisa <span className="star">✦</span>
            Sin Excel ni cuadernos <span className="star">✦</span>
            Asistencia con un toque <span className="star">✦</span>
            Dashboard en tiempo real <span className="star">✦</span>
            Recordatorio masivo a morosos <span className="star">✦</span>
            Alumnos activos y suspendidos <span className="star">✦</span>
            Tasa del día automática <span className="star">✦</span>
            Cobros en Bs y divisa <span className="star">✦</span>
            Sin Excel ni cuadernos <span className="star">✦</span>
            Asistencia con un toque <span className="star">✦</span>
            Dashboard en tiempo real <span className="star">✦</span>
            Recordatorio masivo a morosos <span className="star">✦</span>
            Alumnos activos y suspendidos <span className="star">✦</span>
            Tasa del día automática <span className="star">✦</span>
          </span>
        </div>
      </div>

      {/* VS */}
      <section className="m-vs" id="vs">
        <div className="m-section-label">Te sonará familiar</div>
        <h2 className="m-section-title">
          Si llevas la escuela en <em>cuaderno y WhatsApp</em>, ya sabes el
          ruido.
        </h2>
        <div className="m-vs-grid">
          <div className="m-vs-box m-vs-before">
            <span className="m-vs-label">Antes · cuaderno + Excel</span>
            <h3 className="m-vs-title">
              La vida <em>complicada.</em>
            </h3>
            <div className="m-vs-items">
              <Item negative>Listas de alumnos en hojas sueltas y un Excel.</Item>
              <Item negative>“¿Pagaste?” veinte veces al mes por WhatsApp.</Item>
              <Item negative>Asistencia en un cuaderno que se moja en piscina.</Item>
              <Item negative>Mensualidades vencidas que se te olvidan cobrar.</Item>
              <Item negative>Tasa del día que sumas a mano. Otra vez.</Item>
            </div>
          </div>
          <div className="m-vs-box m-vs-after">
            <span className="m-vs-label">Ahora · con Mística</span>
            <h3 className="m-vs-title">
              La vida <em>en orden.</em>
            </h3>
            <div className="m-vs-items">
              <Item>Alumnos, clases y horarios en un solo lugar.</Item>
              <Item>Cobros con estado: pagado, pendiente, en mora.</Item>
              <Item>Asistencia con un toque desde el celular.</Item>
              <Item>Botón de “recordar 39” y tus moras se reducen.</Item>
              <Item>Precios en Bs y divisa, productos y dashboard.</Item>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="m-features" id="features">
        <div className="m-features-inner">
          <div className="m-section-label">Lo que hace</div>
          <h2 className="m-section-title">
            Cuatro pantallas. <em>Toda</em> la operación.
          </h2>
          <div className="m-feat-grid">
            {FEATURES.map((f) => (
              <article className="m-feat" key={f.n}>
                <div>
                  <div className="m-feat-num">{f.n}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
                <div className="m-feat-img">
                  <Image
                    src={`/projects/mistica/${f.img}`}
                    alt={f.alt}
                    width={480}
                    height={960}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHO */}
      <section className="m-who" id="quien">
        <div className="m-section-label">Para quién</div>
        <h2>
          Hecho para <em>escuelas pequeñas</em> que se toman su negocio en
          serio.
        </h2>
        <p>
          Si llevas entre 30 y 300 alumnos, cobras en Bs y divisa, y el caos del
          mes te quita más horas que las clases mismas, esto es para ti.
        </p>
        <div className="m-who-chips">
          <span className="m-who-chip">
            <strong>Natación</strong> · piletas y clubes
          </span>
          <span className="m-who-chip">
            <strong>Aqua gym</strong> · grupos 3x y 5x
          </span>
          <span className="m-who-chip">
            <strong>Academias</strong> · LMV y MJ
          </span>
          <span className="m-who-chip">
            <strong>Profes independientes</strong>
          </span>
        </div>
      </section>

      {/* QUOTE */}
      <section className="m-quote">
        <div className="m-quote-mark">”</div>
        <p>
          Antes vivía con un <em>cuaderno mojado</em> y un Excel que nadie
          entendía. Ahora abro la app, veo quién debe, mando recordatorio y
          marco la asistencia <em>desde el borde de la piscina</em>.
        </p>
      </section>

      {/* FINAL */}
      <section className="m-final">
        <div className="m-final-inner">
          <div className="m-scribble">¿lo vemos en vivo?</div>
          <h2>
            Tu próxima temporada <em>cabe en una app.</em>
          </h2>
          <a
            href="https://mistica-app-fawn.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="m-final-cta"
          >
            Abrir la demo
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <p className="m-final-meta">
            Demo pública · datos de prueba · sin login
          </p>
        </div>
      </section>

      <footer className="m-footer">
        <div className="wordmark">
          Mís<em>tica</em>.
        </div>
        <div className="m-footer-links">
          <Link href="/">Servicios Creativos</Link>
          <Link href="/shopea">Shopea</Link>
          <a
            href="https://mistica-app-fawn.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            App en vivo
          </a>
        </div>
        <div>© 2026 Servicios Creativos · Caso de estudio</div>
      </footer>
    </div>
  );
}

function Item({
  children,
  negative,
}: {
  children: React.ReactNode;
  negative?: boolean;
}) {
  return (
    <div className="m-vs-item">
      <span className="mark">
        {negative ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 2L8 8M8 2L2 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </div>
  );
}

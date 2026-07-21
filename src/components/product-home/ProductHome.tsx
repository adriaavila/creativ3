import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Mail, MessageCircle } from "lucide-react";
import CreativvLogo from "@/components/landing/CreativvLogo";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";
import CinematicStage from "./CinematicStage";
import { FAQS } from "./content";
import ProjectProof, { type ProjectProofItem } from "./ProjectProof";
import ProductFaq from "./ProductFaq";
import ProductHeader from "./ProductHeader";
import styles from "./ProductHome.module.css";

const CONTACT_URL = whatsappUrl(
  "Hola, quiero mejorar una parte de mi negocio. El resultado que estoy buscando es:",
);

const PROPOSAL_URL = whatsappUrl(
  "Hola, quiero solicitar una propuesta. Mi negocio, objetivo y presupuesto inicial son:",
);

const PROOF_PROJECT_IDS = ["rei-fm", "frontai-landing", "mistica", "soapy", "shopea"] as const;

const PROJECT_CONTEXT: Record<
  (typeof PROOF_PROJECT_IDS)[number],
  Pick<ProjectProofItem, "service" | "before" | "description">
> = {
  shopea: {
    service: "WhatsApp Sales",
    before: "Catálogo, precios, cobro y pedidos dependían de mensajes separados y cálculos manuales.",
    description: "Una tienda que conecta selección, moneda, checkout y pedido final por WhatsApp.",
  },
  "rei-fm": {
    service: "App Prototype",
    before: "Propiedades, contratos y cobros repartidos entre hojas y seguimiento manual.",
    description: "Una plataforma para administrar cartera, contratos, propietarios e ingresos en un solo lugar.",
  },
  "frontai-landing": {
    service: "FrontIA",
    before: "Llamadas, citas y oportunidades dependían de seguimiento manual entre conversaciones.",
    description: "Un agente que atiende, califica oportunidades, agenda citas y registra cada seguimiento.",
  },
  mistica: {
    service: "Wellness SaaS",
    before: "Alumnos, horarios, asistencias y cobros se repartían entre cuadernos y grupos de WhatsApp.",
    description: "Un SaaS que reúne la operación diaria de la escuela para profesores y administración.",
  },
  soapy: {
    service: "Operations platform",
    before: "Cada orden pasaba por mostrador, taller y reparto sin un estado compartido ni un responsable visible.",
    description: "Una plataforma que sigue cada prenda, ruta y notificación desde la recepción hasta la entrega.",
  },
};

const PROOF_PROJECTS = PROOF_PROJECT_IDS.reduce<ProjectProofItem[]>((items, id) => {
  const project = PORTFOLIO_PROJECTS.find((candidate) => candidate.id === id);
  if (!project || project.images.length === 0) return items;
  const context = PROJECT_CONTEXT[id];

  items.push({
    id: project.id,
    name: project.name,
    kind: project.kind,
    service: context.service,
    before: context.before,
    description: context.description,
    outcome: project.businessOutcome,
    images: project.images,
    ...(project.caseStudyUrl || project.liveUrl ? { href: project.caseStudyUrl ?? project.liveUrl } : {}),
  });

  return items;
}, []);

const COMPLEMENTARY_SERVICES = [
  {
    index: "05",
    title: "Cotizador Interactivo",
    subtitle: "Ayuda al cliente a entender qué necesita antes de hablar contigo.",
    body: "Transformamos formularios largos en una experiencia guiada que pregunta, recomienda y prepara una cotización o solicitud.",
    examples: ["Configurador de servicios", "Calculadora de planes", "Simulador inmobiliario"],
    cta: "Crear un cotizador",
    href: whatsappUrl("Hola, quiero crear un cotizador interactivo para mi negocio."),
  },
  {
    index: "06",
    title: "Video Menu Experience",
    subtitle: "Un menú que muestra, recomienda y recibe pedidos.",
    body: "Creamos menús visuales para móvil que permiten descubrir productos, elegir combinaciones y enviar el pedido directamente por WhatsApp.",
    examples: ["Menú mediante QR", "Combos y recomendaciones", "Pedidos por WhatsApp"],
    cta: "Mejorar mi menú",
    href: whatsappUrl("Hola, quiero mejorar el menú digital de mi negocio."),
  },
] as const;

const PROCESS = [
  {
    title: "Enfocamos",
    description: "Identificamos el problema, el usuario y la acción que queremos conseguir.",
  },
  {
    title: "Diseñamos",
    description: "Creamos una experiencia clara alrededor del objetivo, no alrededor de funciones innecesarias.",
  },
  {
    title: "Construimos",
    description: "Desarrollamos una primera versión funcional con herramientas modernas y una base que pueda crecer.",
  },
  {
    title: "Lanzamos",
    description: "Publicamos, medimos el uso real y definimos cuáles mejoras tienen mayor impacto.",
  },
] as const;

const STARTING_POINTS = [
  "Proyectos piloto desde $250.",
  "Alcance y entregables definidos antes de comenzar.",
  "Primera versión funcional en días o pocas semanas.",
  "Ampliación únicamente después de validar.",
  "Sin contratos largos obligatorios.",
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      name: "Creativv",
      url: "https://www.servicioscreativos.online",
      email: CONTACT_EMAIL,
      description:
        "Estudio independiente de websites, aplicaciones, automatización e inteligencia artificial para negocios.",
      areaServed: "VE",
    },
    {
      "@type": "ItemList",
      name: "Servicios principales de Creativv",
      itemListElement: [
        "WhatsApp Sales Experience",
        "Cinematic Launch Page",
        "App Prototype Sprint",
        "FrontIA",
      ].map((name, index) => ({ "@type": "ListItem", position: index + 1, name })),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function ProductHome() {
  return (
    <div className={styles.site}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductHeader evaluationUrl={CONTACT_URL} />

      <main>
        <CinematicStage contactUrl={CONTACT_URL} />

        <ProjectProof projects={PROOF_PROJECTS} evaluationUrl={CONTACT_URL} />

        <section className={styles.complementarySection} aria-labelledby="complementary-title">
          <div className={styles.container}>
            <header className={styles.sectionHeaderSplit}>
              <div>
                <p className={styles.eyebrow}>Servicios complementarios</p>
                <h2 id="complementary-title">Dos maneras de reducir fricción antes de la conversación.</h2>
              </div>
              <p>Experiencias pequeñas, concretas y conectadas al momento en que una persona necesita decidir.</p>
            </header>

            <div className={styles.complementaryGrid}>
              {COMPLEMENTARY_SERVICES.map((service) => (
                <article key={service.index}>
                  <div className={styles.complementaryNumber}>{service.index}</div>
                  <div>
                    <h3>{service.title}</h3>
                    <p className={styles.complementarySubtitle}>{service.subtitle}</p>
                    <p>{service.body}</p>
                    <ul>
                      {service.examples.map((example) => (
                        <li key={example}><Check aria-hidden="true" /> {example}</li>
                      ))}
                    </ul>
                    <a href={service.href} target="_blank" rel="noopener noreferrer">
                      {service.cta} <ArrowUpRight aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proceso" className={styles.processSection} aria-labelledby="process-title">
          <div className={styles.container}>
            <header className={styles.sectionHeaderSplit}>
              <div>
                <p className={styles.eyebrow}>Cómo trabajamos</p>
                <h2 id="process-title">De la necesidad a una primera versión funcional.</h2>
              </div>
              <p>Cuatro decisiones concretas. Sin una cadena interminable de reuniones.</p>
            </header>

            <ol className={styles.processRail}>
              {PROCESS.map((step, index) => (
                <li key={step.title}>
                  <div><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.startSection} aria-labelledby="start-title">
          <div className={styles.container}>
            <div className={styles.startPanel}>
              <div className={styles.startCopy}>
                <p className={styles.eyebrow}>Una forma más simple de empezar</p>
                <h2 id="start-title">Empieza pequeño. Valida rápido. Escala con evidencia.</h2>
                <p>
                  No necesitas financiar un proyecto enorme antes de saber si funcionará. Comenzamos por la parte
                  capaz de producir el mayor resultado.
                </p>
                <a href={PROPOSAL_URL} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
                  Cuéntanos tu objetivo y presupuesto <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
              <ul className={styles.startList}>
                {STARTING_POINTS.map((item, index) => (
                  <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.studioSection} aria-labelledby="studio-title">
          <div className={styles.container}>
            <div className={styles.studioGrid}>
              <p className={styles.eyebrow}>Por qué Creativv</p>
              <div>
                <h2 id="studio-title">Un estudio independiente para negocios que necesitan avanzar.</h2>
                <p>
                  Trabajamos directamente contigo para entender el problema, proponer una solución realista y
                  construir una primera versión con rapidez.
                </p>
              </div>
              <ul>
                <li>Menos intermediarios.</li>
                <li>Más claridad.</li>
                <li>Más velocidad.</li>
                <li>Una solución alrededor de tu negocio.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="preguntas" className={styles.faqSection} aria-labelledby="faq-title">
          <div className={styles.container}>
            <div className={styles.faqLayout}>
              <header>
                <p className={styles.eyebrow}>Preguntas frecuentes</p>
                <h2 id="faq-title">Antes de construir, despejamos las dudas importantes.</h2>
                <p>No necesitas tener la tecnología definida. Empieza contándonos el problema.</p>
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                  Hacer otra pregunta <ArrowUpRight aria-hidden="true" />
                </a>
              </header>
              <ProductFaq />
            </div>
          </div>
        </section>

        <section id="contacto" className={styles.finalCtaSection} aria-labelledby="contact-title">
          <div className={styles.container}>
            <div className={styles.finalCta}>
              <p className={styles.eyebrow}>La siguiente mejora empieza aquí</p>
              <h2 id="contact-title">¿Qué parte de tu negocio debería funcionar mejor?</h2>
              <p>
                Cuéntanos qué quieres vender, automatizar, validar o mejorar. Te responderemos con una primera fase
                y una estimación realista.
              </p>
              <div>
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
                  Hablemos por WhatsApp <MessageCircle aria-hidden="true" />
                </a>
                <a href={PROPOSAL_URL} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>
                  Solicitar una propuesta <ArrowRight aria-hidden="true" />
                </a>
              </div>
              <small>No necesitas saber exactamente qué tecnología utilizar.</small>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <CreativvLogo variant="mark-bare" className={styles.brandMark} />
              <span>creativv</span>
            </div>
            <nav aria-label="Navegación del pie de página">
              <a href="#servicios">Servicios</a>
              <a href="#proceso">Proceso</a>
              <a href="#proyectos">Proyectos</a>
              <a href="#preguntas">Preguntas</a>
            </nav>
            <div className={styles.footerContact}>
              <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" /> WhatsApp
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`}><Mail aria-hidden="true" /> {CONTACT_EMAIL}</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Creativv</span>
            <div><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link></div>
            <span>ServiciosCreativos.online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

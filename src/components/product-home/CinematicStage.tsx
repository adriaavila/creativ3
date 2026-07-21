"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ProductHome.module.css";

type CinematicStageProps = {
  contactUrl: string;
};

type ServiceOffer = {
  name: string;
  promise: string;
  result: string;
};

const SERVICES: ServiceOffer[] = [
  {
    name: "WhatsApp Sales Experience",
    promise: "De conversación a compra.",
    result: "Catálogo, selección, pago y pedido conectados en un recorrido que el cliente ya sabe usar.",
  },
  {
    name: "Cinematic Launch Page",
    promise: "Una oferta difícil de ignorar.",
    result: "Narrativa, producto y movimiento puestos al servicio de una sola decisión: avanzar.",
  },
  {
    name: "App Prototype Sprint",
    promise: "La idea se vuelve operable.",
    result: "Una primera versión real para probar el flujo, alinear al equipo y aprender con usuarios.",
  },
  {
    name: "FrontIA",
    promise: "Tu negocio responde aunque tú no estés.",
    result: "Atención, calificación, agenda y seguimiento con inteligencia artificial supervisable.",
  },
];

function ArtDirectedPlate({
  desktop,
  mobile,
  className,
  eager = false,
}: {
  desktop: string;
  mobile: string;
  className: string;
  eager?: boolean;
}) {
  const common = { alt: "", sizes: "100vw", quality: 75 } as const;
  const desktopImage = getImageProps({
    ...common,
    src: desktop,
    width: 1672,
    height: 941,
  });
  const mobileImage = getImageProps({
    ...common,
    src: mobile,
    width: 941,
    height: 1672,
    loading: eager ? "eager" : "lazy",
    fetchPriority: eager ? "high" : "auto",
  });

  return (
    <picture className={className}>
      <source media="(min-width: 901px)" srcSet={desktopImage.props.srcSet} />
      <img {...mobileImage.props} alt="" />
    </picture>
  );
}

export default function CinematicStage({ contactUrl }: CinematicStageProps) {
  const sequenceRef = useRef<HTMLElement>(null);
  const serviceRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sequence = sequenceRef.current;
    if (!sequence) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sequence,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.75,
          },
        });

        timeline
          .to(`.${styles.heroBeat}`, { autoAlpha: 0, yPercent: -16, duration: 9 }, 8)
          .to(`.${styles.scrollCue}`, { autoAlpha: 0, duration: 4 }, 8)
          .to(`.${styles.worldEstablishing}`, { scale: 1.075, duration: 32 }, 8)
          .to(`.${styles.leftWing}`, { xPercent: -88, rotate: -2.5, duration: 15 }, 14)
          .to(`.${styles.rightWing}`, { xPercent: 88, rotate: 2.5, duration: 15 }, 14)
          .fromTo(
            `.${styles.storyBeatA}`,
            { autoAlpha: 0, y: 42 },
            { autoAlpha: 1, y: 0, duration: 7 },
            22,
          )
          .to(`.${styles.storyBeatA}`, { autoAlpha: 0, y: -30, duration: 6 }, 37)
          .to(`.${styles.worldEstablishing}`, { autoAlpha: 0, scale: 1.14, duration: 11 }, 40)
          .fromTo(
            `.${styles.worldPanorama}`,
            { autoAlpha: 0, scale: 1.06 },
            { autoAlpha: 1, scale: 1, duration: 11 },
            40,
          )
          .fromTo(
            `.${styles.storyBeatB}`,
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, y: 0, duration: 8 },
            49,
          )
          .to(`.${styles.storyBeatB}`, { autoAlpha: 0, y: -28, duration: 7 }, 64)
          .to(`.${styles.worldPanorama}`, { scale: 1.045, filter: "brightness(.55)", duration: 11 }, 66)
          .fromTo(
            `.${styles.catalogBeat}`,
            { autoAlpha: 0, y: 54 },
            { autoAlpha: 1, y: 0, duration: 9 },
            72,
          )
          .fromTo(
            `.${styles.catalogControls}`,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 5 },
            90,
          );

        return () => timeline.kill();
      });

      media.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const setWorldX = gsap.quickTo(`.${styles.worldLayer}`, "xPercent", { duration: 1.1, ease: "power3.out" });
        const setWorldY = gsap.quickTo(`.${styles.worldLayer}`, "yPercent", { duration: 1.1, ease: "power3.out" });
        const onPointerMove = (event: PointerEvent) => {
          setWorldX(((event.clientX / window.innerWidth) - 0.5) * -1.2);
          setWorldY(((event.clientY / window.innerHeight) - 0.5) * -0.8);
        };

        sequence.addEventListener("pointermove", onPointerMove);
        return () => sequence.removeEventListener("pointermove", onPointerMove);
      });
    }, sequence);

    return () => context.revert();
  }, []);

  const moveRail = (direction: -1 | 1) => {
    const rail = serviceRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.72, behavior: "smooth" });
  };

  return (
    <section ref={sequenceRef} id="inicio" className={styles.cinematicSequence} aria-label="De una idea dispersa a un producto que mueve el negocio">
      <div className={styles.cinematicStage}>
        <div className={`${styles.worldLayer} ${styles.worldEstablishing}`}>
          <ArtDirectedPlate
            desktop="/cinematic/atelier-establishing-desktop-v2.webp"
            mobile="/cinematic/atelier-establishing-mobile-v2.webp"
            className={styles.worldPlate}
            eager
          />
        </div>
        <div className={`${styles.worldLayer} ${styles.worldPanorama}`}>
          <ArtDirectedPlate
            desktop="/cinematic/atelier-panorama-desktop-v2.webp"
            mobile="/cinematic/atelier-panorama-mobile-v2.webp"
            className={styles.worldPlate}
          />
        </div>

        <div className={styles.stageVignette} aria-hidden="true" />
        <div className={styles.stageGrain} aria-hidden="true" />
        <div className={`${styles.foregroundWing} ${styles.leftWing}`} aria-hidden="true" />
        <div className={`${styles.foregroundWing} ${styles.rightWing}`} aria-hidden="true" />

        <div className={`${styles.sceneBeat} ${styles.heroBeat}`}>
          <p className={styles.heroKicker}>Producto digital · automatización · IA</p>
          <h1>Construimos el producto que tu negocio necesita.</h1>
          <p className={styles.heroLead}>
            Websites, apps y automatización con IA que venden, ordenan y hacen avanzar tu operación.
          </p>
          <div className={styles.heroActions}>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className={styles.cinematicPrimary}>
              Cuéntanos qué debería funcionar mejor <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="#proyectos" className={styles.cinematicSecondary}>
              Ver productos reales <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <p className={styles.heroTrust}>Primera fase clara · Entregas en días o semanas · Pilotos desde $250</p>
        </div>

        <div className={`${styles.sceneBeat} ${styles.storyBeat} ${styles.storyBeatA}`}>
          <p>Cuando todo vive separado</p>
          <h2>Tu negocio no necesita otra herramienta aislada.</h2>
          <span>Necesita que conversaciones, decisiones y tareas se conviertan en un flujo visible.</span>
        </div>

        <div className={`${styles.sceneBeat} ${styles.storyBeat} ${styles.storyBeatB}`}>
          <p>Cuando las piezas encuentran dirección</p>
          <h2>Diseñamos el sistema alrededor del resultado.</h2>
          <span>Primero entendemos qué debe cambiar. Después construimos únicamente lo que lo hace posible.</span>
        </div>

        <div id="servicios" className={`${styles.sceneBeat} ${styles.catalogBeat}`}>
          <div className={styles.catalogHeading}>
            <p>Cuatro formas de avanzar</p>
            <h2>Elige el punto donde tu negocio pierde más energía.</h2>
          </div>
          <div
            ref={serviceRailRef}
            className={styles.serviceRail}
            tabIndex={0}
            aria-label="Servicios principales"
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") moveRail(1);
              if (event.key === "ArrowLeft") moveRail(-1);
              if (event.key === "Home") serviceRailRef.current?.scrollTo({ left: 0, behavior: "smooth" });
              if (event.key === "End") serviceRailRef.current?.scrollTo({ left: serviceRailRef.current.scrollWidth, behavior: "smooth" });
            }}
          >
            {SERVICES.map((service) => (
              <article key={service.name} className={styles.serviceCard}>
                <p>{service.promise}</p>
                <h3>{service.name}</h3>
                <span>{service.result}</span>
                <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                  Explorar esta solución <ArrowUpRight aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
          <div className={styles.catalogControls}>
            <div>
              <button type="button" onClick={() => moveRail(-1)} aria-label="Servicio anterior"><ArrowLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => moveRail(1)} aria-label="Servicio siguiente"><ArrowRight aria-hidden="true" /></button>
            </div>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> Empezar con una conversación
            </a>
          </div>
        </div>

        <div className={styles.scrollCue} aria-hidden="true"><span /> Desplaza para entrar</div>
      </div>
      <noscript>
        <div className={styles.noScriptMessage}>
          <h2>Websites, aplicaciones y sistemas inteligentes para negocios.</h2>
          <p>Diseñamos una primera versión clara, medible y lista para crecer.</p>
          <a href={contactUrl}>Hablemos por WhatsApp</a>
        </div>
      </noscript>
    </section>
  );
}

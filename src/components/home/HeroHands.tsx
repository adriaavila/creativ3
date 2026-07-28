"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * Two hands converging as you scroll — the robot from the left, the human from
 * the right. The thesis of the work made literal: the machine proposes, the
 * person decides.
 *
 * Multi-device animation: sticky runway on both desktop and mobile (`100svh`).
 * Features staggered intro reveals, smooth scroll convergence, energy spark glow
 * at the touchpoint, and subtle interactive parallax on desktop.
 */

export default function HeroHands({ contactUrl }: { contactUrl: string }) {
  const stageRef = useRef<HTMLElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const humanRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLAnchorElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const coreDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    gsap.registerPlugin(ScrollTrigger);

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __gsap?: unknown; __ST?: unknown }).__gsap = gsap;
      (window as unknown as { __gsap?: unknown; __ST?: unknown }).__ST = ScrollTrigger;
    }

    const context = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 1. Initial Entrance Reveal
      if (!prefersReduced) {
        if (headlineRef.current) {
          const elements = Array.from(headlineRef.current.children);
          gsap.fromTo(
            elements,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              stagger: 0.12,
              ease: "power3.out",
              delay: 0.1,
            }
          );
        }

        gsap.fromTo(
          robotRef.current,
          { xPercent: -35, opacity: 0 },
          { xPercent: -15, opacity: 0.85, duration: 1.2, ease: "power3.out", delay: 0.2 }
        );

        gsap.fromTo(
          humanRef.current,
          { xPercent: 35, opacity: 0 },
          { xPercent: 15, opacity: 0.85, duration: 1.2, ease: "power3.out", delay: 0.2 }
        );
      }

      // 2. ScrollTrigger Convergence Timeline (Mobile + Desktop)
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });

        timeline
          .fromTo(robotRef.current, { xPercent: -15 }, { xPercent: 12, duration: 10 }, 0)
          .fromTo(humanRef.current, { xPercent: 15 }, { xPercent: -12, duration: 10 }, 0)
          .fromTo(sparkRef.current, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.25, duration: 4 }, 4)
          .fromTo(coreDotRef.current, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.1, duration: 3 }, 5)
          .to(cueRef.current, { autoAlpha: 0, duration: 2 }, 0)
          .to(headlineRef.current, { autoAlpha: 0.18, y: -16, duration: 4 }, 6);

        return () => timeline.kill();
      });

      // 3. Desktop Interactive Parallax on Mouse Move
      const handleMouseMove = (e: MouseEvent) => {
        if (window.innerWidth < 768) return;
        const { clientX, clientY } = e;
        const moveX = (clientX / window.innerWidth - 0.5) * 18;
        const moveY = (clientY / window.innerHeight - 0.5) * 12;

        gsap.to(robotRef.current, { x: moveX, y: moveY, duration: 0.8, ease: "power2.out" });
        gsap.to(humanRef.current, { x: -moveX, y: -moveY, duration: 0.8, ease: "power2.out" });
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, stage);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={stageRef}
      id="inicio"
      aria-label="Diseño el producto y también lo construyo"
      className="relative h-[170vh] md:h-[220vh]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-5">
        {/* Ambient Top Light Beam Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[30%] z-0 h-[480px] w-[90vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-45 mix-blend-multiply"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.22) 0%, rgba(147, 51, 234, 0.18) 45%, rgba(236, 72, 153, 0.08) 75%, transparent 100%)",
          }}
        />

        {/* Convergence Spark / Multi-layered Energy Glow Node */}
        <div
          ref={sparkRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56%] z-0 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.65) 0%, rgba(139, 92, 246, 0.45) 40%, rgba(236, 72, 153, 0.25) 65%, transparent 85%)",
          }}
        />

        {/* Inner Core Bright Dot & Chromatic Beam */}
        <div
          ref={coreDotRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56%] z-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px] opacity-0"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow:
              "0 0 28px 12px rgba(99, 102, 241, 0.9), 0 0 60px 24px rgba(168, 85, 247, 0.65), 0 0 90px 40px rgba(59, 130, 246, 0.4)",
          }}
        />

        {/* Robot hand — enters from the left */}
        <div
          ref={robotRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[56%] z-0 w-[44vw] max-w-[520px] -translate-y-1/2 opacity-75 sm:w-[38vw] md:w-[34vw] md:opacity-100"
        >
          <Image
            src="/hero/robot-hand.png"
            alt=""
            width={1065}
            height={474}
            priority
            sizes="(max-width: 768px) 44vw, 34vw"
            className="h-auto w-full drop-shadow-md"
          />
        </div>

        {/* Human hand — enters from the right */}
        <div
          ref={humanRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-[56%] z-0 w-[44vw] max-w-[520px] -translate-y-1/2 opacity-75 sm:w-[38vw] md:w-[34vw] md:opacity-100"
        >
          <Image
            src="/hero/human-hand.png"
            alt=""
            width={1094}
            height={474}
            priority
            sizes="(max-width: 768px) 44vw, 34vw"
            className="h-auto w-full drop-shadow-md"
          />
        </div>

        <div
          ref={headlineRef}
          className="relative z-10 flex max-w-[min(54rem,88vw)] flex-col items-center text-center"
        >
          <h1 className="text-balance text-[clamp(2.25rem,4.8vw,4.5rem)] font-bold tracking-tight leading-[1.08]">
            Conecto lo que observo con productos que pueden existir.
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {[
              "Problemas que se repiten.",
              "Comportamientos que cambian.",
              "Tecnologías que abren nuevas posibilidades.",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-4 py-1.5 text-[13px] font-medium backdrop-blur-sm transition-colors hover:border-black/30"
                style={{
                  borderColor: "var(--studio-hairline)",
                  color: "var(--studio-muted-text)",
                  background: "rgba(255, 255, 255, 0.85)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p
            className="mt-6 max-w-xl text-[16px] leading-relaxed sm:text-[18px]"
            style={{ color: "var(--studio-muted-text)", letterSpacing: "-0.01em" }}
          >
            Creativv es el lugar donde convierto esas conexiones en productos digitales, sistemas y experimentos.
          </p>
        </div>

        {/* Scroll indicator */}
        <a
          href="#observar"
          ref={cueRef}
          aria-label="Explorar lo que construyo"
          className="absolute bottom-6 flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span
            className="text-[12px] sm:text-[13px] font-semibold text-black tracking-tight"
          >
            Explorar lo que construyo ↓
          </span>
          <Image
            src="/hero/scroll-down.svg"
            alt=""
            width={18}
            height={18}
            className="animate-bounce"
          />
        </a>
      </div>
    </section>
  );
}


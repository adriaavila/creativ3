"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    document.documentElement.classList.add("cursor-hidden");

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50 });

    const xSetter = gsap.quickSetter(cursor, "x", "px");
    const ySetter = gsap.quickSetter(cursor, "y", "px");
    const ringXSetter = gsap.quickSetter(ring, "x", "px");
    const ringYSetter = gsap.quickSetter(ring, "y", "px");

    const moveCursor = (e: MouseEvent) => {
      xSetter(e.clientX);
      ySetter(e.clientY);
      ringXSetter(e.clientX);
      ringYSetter(e.clientY);
    };

    const handleHover = () => {
      gsap.to(cursor, { scale: 1.5, duration: 0.25, ease: "power2.out" });
      gsap.to(ring, { scale: 2.5, opacity: 1, duration: 0.25, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.25, ease: "power2.out" });
      gsap.to(ring, { scale: 1, opacity: 0.6, duration: 0.25, ease: "power2.out" });
    };

    window.addEventListener("mousemove", moveCursor);

    const attachListeners = () => {
      const interactives = document.querySelectorAll("a, button, input, [role='button'], .hover-target");
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", handleHover);
        el.addEventListener("mouseleave", handleLeave);
      });
    };

    attachListeners();

    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      const interactives = document.querySelectorAll("a, button, input, [role='button'], .hover-target");
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", handleHover);
        el.removeEventListener("mouseleave", handleLeave);
      });
      observer.disconnect();
      document.documentElement.classList.remove("cursor-hidden");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="cc-ring fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border-2 opacity-60 hidden sm:block"
        style={{ width: 40, height: 40 }}
      />
      <div
        ref={cursorRef}
        className="cc-dot fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden sm:block"
        style={{ width: 10, height: 10 }}
      />
    </>
  );
}

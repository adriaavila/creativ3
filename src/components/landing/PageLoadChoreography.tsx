"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageLoadChoreography() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      return;
    }

    const overlay = overlayRef.current;
    
    gsap.to(overlay, {
      scaleY: 0,
      transformOrigin: "center top",
      duration: 1.2,
      ease: "power4.inOut",
      delay: 0.1,
      onComplete: () => {
        if (overlay) overlay.style.display = 'none';
      }
    });
  }, []);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[9000] bg-noche pointer-events-none origin-top"
    />
  );
}

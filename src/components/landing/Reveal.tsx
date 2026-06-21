"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger offset in seconds. Pass index * 0.08 for grids. */
  delay?: number;
  /** Initial vertical offset in px. */
  y?: number;
  className?: string;
};

/**
 * Scroll-reveal wrapper. IntersectionObserver-based (motion whileInView),
 * so it needs no GSAP/Lenis sync. Reduced motion → renders children plain.
 */
export default function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  const reduceRaw = useReducedMotion();

  if (reduceRaw) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

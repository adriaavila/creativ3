"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/*
 * Shared interaction primitives for the ops panel, following the apple-design
 * skill. Three things it buys us over raw Tailwind `transition-*`:
 *
 * 1. Springs, not fixed-duration curves — interruptible and velocity-aware, so a
 *    press that's released mid-animation reverses from where it actually is.
 * 2. Feedback on pointer-DOWN, not on click. The skill's §1: waiting for
 *    touch-up to show state "feels dead".
 * 3. prefers-reduced-motion handled once, here, instead of per component.
 *
 * Colors stay on the existing ops palette — this is a motion/material pass, not
 * a re-skin.
 */

/** Critically damped (bounce 0), response ~0.3s — the default for anything not gesture-driven. */
export const SPRING = { type: "spring" as const, bounce: 0, duration: 0.3 };

/** Slight overshoot, for momentum-carrying interactions only (a flick, a drag release). */
export const SPRING_MOMENTUM = { type: "spring" as const, bounce: 0.2, duration: 0.4 };

/**
 * Translucent chrome: content scrolls underneath instead of being clipped by an
 * opaque strip. The brighter top border is the light catching the material edge.
 */
export const GLASS_SURFACE =
  "bg-[#08090a]/70 backdrop-blur-xl backdrop-saturate-150 border-t border-white/[0.06]";

/** Same material for sticky headers, where the divider belongs on the bottom edge. */
export const GLASS_HEADER =
  "bg-[#08090a]/70 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10";

/** Type scale: tracking is size-specific — tighten as it grows, never one value for all. */
export const DISPLAY_TIGHT = "tracking-[-0.02em]";
export const HEADING_TIGHT = "tracking-[-0.01em]";

type TapButtonProps = ComponentPropsWithoutRef<typeof motion.button> & {
  children: ReactNode;
  /** Scale at the bottom of the press. Smaller controls want a deeper press to read. */
  pressScale?: number;
};

/** A button that acknowledges the press instantly and settles with a spring. */
export function TapButton({ children, pressScale = 0.96, ...props }: TapButtonProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      {...props}
      whileTap={reduceMotion ? undefined : { scale: pressScale }}
      transition={SPRING}
    >
      {children}
    </motion.button>
  );
}

type TapLinkProps = ComponentPropsWithoutRef<typeof motion.a> & {
  children: ReactNode;
  pressScale?: number;
};

export function TapLink({ children, pressScale = 0.96, ...props }: TapLinkProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.a
      {...props}
      whileTap={reduceMotion ? undefined : { scale: pressScale }}
      transition={SPRING}
    >
      {children}
    </motion.a>
  );
}

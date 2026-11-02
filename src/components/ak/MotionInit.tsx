"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    AllokMotion?: { init: (root?: ParentNode) => void; reduced: boolean };
  }
}

/**
 * motion.js starts by itself on a full page load. After a client-side route
 * change into this page the script is already there, so the new markup has
 * to be handed to it (design system, Build §5).
 */
export default function MotionInit() {
  useEffect(() => {
    const root = document.querySelector(".ak");
    if (root && window.AllokMotion) {
      document.documentElement.classList.toggle("motion", !window.AllokMotion.reduced);
      window.AllokMotion.init(root);
    }
  }, []);
  return null;
}

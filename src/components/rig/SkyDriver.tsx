"use client";

import { useEffect } from "react";

/**
 * Writes one number — `--sky-t`, 0 at the top of the document, 1 at the
 * bottom — onto <html>. Every sky plate on the page derives its whole
 * dawn→dusk ramp from it in CSS, so scrolling re-lights the page without a
 * single component subscribing to scroll.
 *
 * ponytail: one rAF-coalesced listener for the entire site. No observer per
 * section, no motion values, nothing to tear down per component.
 */
export default function SkyDriver() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const write = () => {
      frame = 0;
      const travel = root.scrollHeight - root.clientHeight;
      const t = travel > 0 ? root.scrollTop / travel : 0;
      root.style.setProperty("--sky-t", String(t < 0 ? 0 : t > 1 ? 1 : t));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}

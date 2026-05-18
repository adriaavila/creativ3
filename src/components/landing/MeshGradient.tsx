"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  colors?: string[];
  base?: string;
  speed?: number;
  blobRadius?: number;
};

const DEFAULT_COLORS = [
  "rgba(255, 138, 76, 0.55)",
  "rgba(168, 201, 127, 0.50)",
  "rgba(42, 110, 160, 0.45)",
  "rgba(200, 148, 100, 0.40)",
];

export default function MeshGradient({
  className = "",
  colors = DEFAULT_COLORS,
  base = "#f7f1e3",
  speed = 0.45,
  blobRadius = 0.45,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const blobs = colors.map((c) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: blobRadius + Math.random() * 0.18,
      color: c,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w <= 0 || h <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      blobs.forEach((b) => {
        if (!prefersReducedMotion) {
          b.x += b.vx / w;
          b.y += b.vy / h;
          if (b.x < -0.2 || b.x > 1.2) b.vx *= -1;
          if (b.y < -0.2 || b.y > 1.2) b.vy *= -1;
        }
        const radius = Math.max(1, b.r * Math.max(w, h));
        const grd = ctx.createRadialGradient(
          b.x * w,
          b.y * h,
          0,
          b.x * w,
          b.y * h,
          radius,
        );
        grd.addColorStop(0, b.color);
        grd.addColorStop(1, "transparent");
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      });

      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colors, base, speed, blobRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}

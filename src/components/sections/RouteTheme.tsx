"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DARK_ROUTES = ["/projects/mistica"];

export default function RouteTheme() {
  const pathname = usePathname();
  const isDark =
    !!pathname && DARK_ROUTES.some((p) => pathname.startsWith(p));
  const isLight = !isDark;

  useEffect(() => {
    const html = document.documentElement;
    if (isLight) {
      html.classList.add("theme-light");
      html.classList.remove("theme-dark");
    } else {
      html.classList.add("theme-dark");
      html.classList.remove("theme-light");
    }
  }, [isLight]);

  return null;
}

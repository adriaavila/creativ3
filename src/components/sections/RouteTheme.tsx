"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LIGHT_ROUTES = ["/projects/mistica"];

export default function RouteTheme() {
  const pathname = usePathname();
  const isLight =
    pathname && LIGHT_ROUTES.some((p) => pathname.startsWith(p));

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

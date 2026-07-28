"use client";

import { useEffect } from "react";

export default function RouteTheme() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("theme-dark");
    html.classList.remove("theme-light");
  }, []);

  return null;
}


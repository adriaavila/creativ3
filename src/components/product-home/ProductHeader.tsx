"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import CreativvLogo from "@/components/landing/CreativvLogo";
import styles from "./ProductHome.module.css";

type ProductHeaderProps = {
  evaluationUrl: string;
};

const NAVIGATION = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proceso", href: "#proceso" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Preguntas", href: "#preguntas" },
  { label: "Contacto", href: "#contacto" },
];

export default function ProductHeader({ evaluationUrl }: ProductHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <nav className={styles.headerInner} aria-label="Navegación principal">
        <a href="#inicio" className={styles.brand} aria-label="Creativv, ir al inicio">
          <CreativvLogo variant="mark-bare" className={styles.brandMark} />
          <span>creativv</span>
          <span className={styles.brandDot} aria-hidden="true" />
        </a>

        <div className={styles.desktopNav}>
          {NAVIGATION.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </div>

        <div className={styles.headerActions}>
          <a
            href={evaluationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles.buttonPrimary} ${styles.headerCta}`}
          >
            Hablemos de tu negocio <ArrowUpRight aria-hidden="true" />
          </a>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="product-mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div
        id="product-mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        {NAVIGATION.map((item) => (
          <a
            key={item.href}
            href={item.href}
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a
          href={evaluationUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          className={styles.mobileMenuCta}
        >
          Hablemos de tu negocio <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}

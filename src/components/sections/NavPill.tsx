export default function NavPill() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 10px 10px 22px",
        display: "flex",
        alignItems: "center",
        gap: 28,
        zIndex: 50,
        background: "rgba(245,237,224,0.82)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--line)",
        borderRadius: 100,
        whiteSpace: "nowrap",
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: 24,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Shop<em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>ea</em>
        <span
          style={{
            width: 7,
            height: 7,
            background: "var(--terracotta)",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
      </a>

      <ul
        style={{
          display: "flex",
          gap: 24,
          listStyle: "none",
          fontSize: 14,
          margin: 0,
          padding: 0,
        }}
        className="nav-links"
      >
        {[
          { href: "#como", label: "Cómo funciona" },
          { href: "#pagos", label: "Pagos" },
          { href: "#precios", label: "Precios" },
          { href: "#faq", label: "Preguntas" },
        ].map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              style={{
                color: "var(--ink-soft)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <a
        href="#final"
        style={{
          background: "var(--ink)",
          color: "var(--cream)",
          padding: "10px 18px",
          borderRadius: 100,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Empezar gratis
      </a>
    </nav>
  );
}

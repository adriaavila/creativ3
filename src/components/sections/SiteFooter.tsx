export default function SiteFooter() {
  return (
    <footer
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        padding: "0 40px 40px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: "clamp(100px, 22vw, 380px)",
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          padding: "40px 0",
          borderTop: "1px solid rgba(245,237,224,0.15)",
          textAlign: "center",
        }}
      >
        Shop<em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>ea</em>.
      </div>
      <div
        style={{
          paddingTop: 32,
          borderTop: "1px solid rgba(245,237,224,0.15)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          fontSize: 13,
          color: "rgba(245,237,224,0.55)",
        }}
        className="footer-bottom"
      >
        <div>
          {["Términos", "Privacidad", "Contacto"].map((label) => (
            <a
              key={label}
              href="#"
              style={{
                color: "inherit",
                textDecoration: "none",
                marginRight: 20,
              }}
              className="footer-link"
            >
              {label}
            </a>
          ))}
        </div>
        <div>© 2026 Servicios Creativos · Caracas · Hecho con cariño y cafecito</div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--terracotta) !important; }
        @media (max-width: 900px) {
          .footer-bottom { flex-direction: column !important; gap: 12px !important; }
        }
      `}</style>
    </footer>
  );
}

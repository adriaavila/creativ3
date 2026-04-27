export default function FinalCta() {
  return (
    <section
      id="final"
      style={{
        padding: "180px 40px 160px",
        textAlign: "center",
        background: "var(--ink)",
        color: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        zIndex: 1,
      }}
      className="final-section"
    >
      {/* inner glow */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 1200,
          height: 1200,
          background: "radial-gradient(circle, rgba(198,90,58,0.35), transparent 55%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-caveat)",
            color: "var(--terracotta)",
            fontSize: 32,
            marginBottom: 20,
          }}
        >
          ¿listo, listico?
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(56px, 10vw, 180px)",
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            maxWidth: 1200,
            margin: "0 auto 56px",
          }}
        >
          Tu próximo cliente{" "}
          <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>ya te está buscando.</em>
        </h2>
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            background: "var(--terracotta)",
            color: "var(--cream)",
            padding: "26px 40px",
            borderRadius: 100,
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 500,
          }}
          className="final-cta-btn"
        >
          Crear mi tienda gratis
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 11L11 3M11 3H5M11 3V9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <p
          style={{
            marginTop: 40,
            fontSize: 13,
            color: "rgba(245,237,224,0.55)",
          }}
        >
          Sin tarjeta · Sin compromiso · 4 minutos y estás vendiendo
        </p>
      </div>

      <style>{`
        .final-cta-btn { transition: background 0.3s, color 0.3s, transform 0.3s; }
        .final-cta-btn:hover { background: var(--cream) !important; color: var(--ink) !important; transform: scale(1.04); }
        @media (max-width: 900px) {
          .final-section { padding: 120px 20px !important; }
        }
      `}</style>
    </section>
  );
}

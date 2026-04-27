export default function QuoteSection() {
  return (
    <section
      style={{
        padding: "160px 40px 140px",
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
      className="quote-section"
    >
      <div
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontStyle: "italic",
          fontSize: 280,
          lineHeight: 0.7,
          color: "var(--terracotta)",
          opacity: 0.35,
          marginBottom: -60,
          userSelect: "none",
        }}
      >
        &rdquo;
      </div>
      <p
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: "clamp(32px, 4.5vw, 60px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Antes vivía pegada a la{" "}
        <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>calculadora</em> del teléfono. Ahora los pedidos
        me llegan <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>ordenaditos</em>, con el total en Bs
        o en divisa según elija el cliente. Dejé de perder ventas por no contestar rápido.
      </p>
      <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 60,
            height: 60,
            background: "var(--sand)",
            border: "1px solid var(--line)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 28,
          }}
        >
          👩🏽
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.3 }}>
          <strong
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontWeight: 400,
              fontSize: 20,
              display: "block",
              marginBottom: 2,
            }}
          >
            Mariana Pérez
          </strong>
          <span style={{ color: "var(--ink-soft)" }}>Dulces Mariana · Las Mercedes</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .quote-section { padding: 80px 20px !important; }
        }
      `}</style>
    </section>
  );
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M3 8L6.5 11.5L13 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BODEGA_FEATURES = [
  "Hasta 30 productos",
  "Precios duales Bs / divisa automáticos",
  "Pedidos ilimitados por WhatsApp",
  "Métodos de pago ilimitados",
  "Link shopea.online/tutienda",
  "Con nuestra marquita (discreta)",
];

const BODEGON_FEATURES = [
  "Productos ilimitados",
  "Tu propio dominio (.com, .shop, .store)",
  "Tasa BCV + Paralelo, elige cuál mostrar",
  "Precios duales personalizados por producto",
  "Sin marca Shopea",
  "Analytics: qué productos se ven, qué se pide",
  "Cupones y descuentos",
  "Soporte prioritario por WhatsApp",
];

export default function PricingSection() {
  return (
    <section style={{ padding: "120px 40px", position: "relative", zIndex: 1 }} id="precios" className="pricing-section">
      <div style={{ maxWidth: 1400, margin: "0 auto 80px" }}>
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--terracotta)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 500,
          }}
        >
          <span style={{ width: 40, height: 1, background: "var(--terracotta)", display: "inline-block" }} />
          Cuánto cuesta
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(48px, 7vw, 112px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          Empieza <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>gratis.</em> Crece sin techo.
        </h2>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
        className="pricing-grid"
      >
        {/* Plan Bodega */}
        <div
          style={{
            background: "var(--cream-deep)",
            border: "1px solid var(--line)",
            borderRadius: 32,
            padding: "48px 40px",
            minHeight: 560,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
          className="plan"
        >
          <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 28, opacity: 0.75, fontWeight: 500 }}>
            Plan Bodega
          </div>
          <div
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              marginBottom: 8,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            $0
            <span style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", marginTop: 36, marginLeft: 10, opacity: 0.55 }}>
              / mes
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 19,
              lineHeight: 1.35,
              color: "var(--ink-soft)",
              marginBottom: 36,
              maxWidth: 340,
            }}
          >
            Para arrancar hoy, probar sin riesgo y vender esta misma semana.
          </p>
          <ul style={{ listStyle: "none", marginBottom: "auto", display: "flex", flexDirection: "column", gap: 2, padding: 0 }}>
            {BODEGA_FEATURES.map((f) => (
              <li
                key={f}
                style={{
                  padding: "14px 0",
                  fontSize: 15,
                  borderTop: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  color: "var(--terracotta)",
                }}
              >
                <CheckIcon />
                <span style={{ color: "var(--ink)" }}>{f}</span>
              </li>
            ))}
          </ul>
          <a
            href="#final"
            style={{
              marginTop: 36,
              padding: "18px 24px",
              background: "var(--ink)",
              color: "var(--cream)",
              borderRadius: 100,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              display: "block",
            }}
            className="plan-cta"
          >
            Empezar gratis
          </a>
        </div>

        {/* Plan Bodegón */}
        <div
          style={{
            background: "var(--ink)",
            color: "var(--cream)",
            border: "1px solid var(--ink)",
            borderRadius: 32,
            padding: "48px 40px",
            minHeight: 560,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
          className="plan featured"
        >
          <div
            style={{
              position: "absolute",
              top: 32,
              right: 32,
              fontFamily: "var(--font-caveat)",
              fontSize: 28,
              color: "var(--terracotta)",
              transform: "rotate(6deg)",
            }}
          >
            ¡más pedido!
          </div>
          <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 28, opacity: 0.75, fontWeight: 500 }}>
            Plan Bodegón
          </div>
          <div
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              marginBottom: 8,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            $4
            <sup style={{ fontSize: 28, marginTop: 14, opacity: 0.5 }}>.99</sup>
            <span style={{ fontSize: 14, fontFamily: "var(--font-dm-sans)", marginTop: 36, marginLeft: 10, opacity: 0.55 }}>
              / mes
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 19,
              lineHeight: 1.35,
              color: "rgba(245,237,224,0.75)",
              marginBottom: 36,
              maxWidth: 340,
            }}
          >
            Para cuando ya cogiste vuelo y quieres verte pro de verdad.
          </p>
          <ul style={{ listStyle: "none", marginBottom: "auto", display: "flex", flexDirection: "column", gap: 2, padding: 0 }}>
            {BODEGON_FEATURES.map((f) => (
              <li
                key={f}
                style={{
                  padding: "14px 0",
                  fontSize: 15,
                  borderTop: "1px solid rgba(245,237,224,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  color: "#e89a82",
                }}
              >
                <CheckIcon />
                <span style={{ color: "var(--cream)" }}>{f}</span>
              </li>
            ))}
          </ul>
          <a
            href="#final"
            style={{
              marginTop: 36,
              padding: "18px 24px",
              background: "var(--cream)",
              color: "var(--ink)",
              borderRadius: 100,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              display: "block",
            }}
            className="plan-cta"
          >
            Probar 14 días gratis
          </a>
        </div>
      </div>

      <style>{`
        .plan { transition: transform 0.4s cubic-bezier(.2,.8,.2,1); }
        .plan:hover { transform: translateY(-6px); }
        .plan-cta:hover { background: var(--terracotta) !important; color: var(--cream) !important; }
        @media (max-width: 900px) {
          .pricing-section { padding: 80px 20px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

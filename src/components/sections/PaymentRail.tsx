const METHODS = [
  {
    icon: "📱",
    name: "Pago Móvil",
    currency: "Bolívares",
    desc: "El de todos los días, el favorito para delivery en Caracas.",
  },
  {
    icon: "🏦",
    name: "Transferencia",
    currency: "Bolívares",
    desc: "Banesco, Mercantil, BDV. Tu número de cuenta, tu plata.",
  },
  {
    icon: "💵",
    name: "Zelle",
    currency: "Divisa",
    desc: "Para clientes con cuenta en USA o que reciben remesas.",
  },
  {
    icon: "₿",
    name: "Binance Pay",
    currency: "Divisa · USDT",
    desc: "Rápido, sin comisiones, cada vez más usado en el país.",
  },
  {
    icon: "💶",
    name: "Efectivo",
    currency: "Divisa o Bs",
    desc: "Contra entrega, contraentrega, como le digas. Clásico.",
  },
  {
    icon: "💳",
    name: "Punto de venta",
    currency: "Bolívares",
    desc: "Si recibes en tu local o en domicilio, también va.",
  },
  {
    icon: "🔄",
    name: "PayPal",
    currency: "Divisa",
    desc: "Para clientes de la diáspora que te mandan desde afuera.",
  },
  {
    icon: "✨",
    name: "+ Lo que uses",
    currency: "Libre",
    desc: "Nequi, Wally, Reserve, lo que sea. Tú agregas, tu cliente ve.",
  },
];

export default function PaymentRail() {
  return (
    <section style={{ padding: "60px 40px 120px", position: "relative", zIndex: 1 }} id="pagos" className="rail-section">
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          background: "var(--cream-deep)",
          borderRadius: 32,
          padding: "60px 48px",
          border: "1px solid var(--line)",
        }}
        className="rail-wrap"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 48,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: "clamp(36px, 5vw, 68px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              maxWidth: 700,
            }}
          >
            Cobra como{" "}
            <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>a ti te guste</em>, en la moneda que{" "}
            <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>te convenga.</em>
          </h3>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 18,
              color: "var(--ink-soft)",
              lineHeight: 1.4,
              maxWidth: 320,
            }}
          >
            Tú decides qué métodos aceptar. Tu cliente elige con cuál pagar. Shopea no se queda con ni un céntimo.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
          className="rail-methods"
        >
          {METHODS.map((m) => (
            <div
              key={m.name}
              style={{
                background: "var(--cream)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                padding: "28px 24px",
              }}
              className="rail-card"
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--cream-deep)",
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  marginBottom: 20,
                }}
              >
                {m.icon}
              </div>
              <h4
                style={{
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: 24,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {m.name}
              </h4>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--terracotta)",
                  fontWeight: 500,
                  marginBottom: 10,
                }}
              >
                {m.currency}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink-soft)" }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .rail-card { transition: transform 0.4s cubic-bezier(.2,.8,.2,1); }
        .rail-card:hover { transform: translateY(-6px); }
        @media (max-width: 900px) {
          .rail-section { padding: 40px 20px 80px !important; }
          .rail-wrap { padding: 36px 24px !important; border-radius: 24px !important; }
          .rail-methods { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}

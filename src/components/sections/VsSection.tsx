const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const beforeItems = [
  '"¿Cuánto cuesta hoy?" diez veces al día por WhatsApp.',
  "Recalcular precios cada vez que el dólar se mueve.",
  "Capturas de Pago Móvil, confirmar, volver a confirmar.",
  "Perder ventas porque el cliente se aburre de preguntar.",
  "Tu negocio vive entre grupos de Facebook y mensajes sueltos.",
];

const afterItems = [
  "Tu link dice el precio. Se acabó la pregunta.",
  "Precios en Bs y en divisa actualizados solos.",
  "El cliente elige cómo pagar. Tú solo confirmas.",
  "Pedidos ordenaditos al WhatsApp, con total y datos.",
  "Mismo link, sirve para FB, Insta, status, todos lados.",
];

export default function VsSection() {
  return (
    <section
      style={{
        padding: "120px 40px 80px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
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
          Te sonará familiar
        </div>

        <h2
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(44px, 6vw, 92px)",
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            maxWidth: 1100,
            marginBottom: 60,
          }}
        >
          Si vendes por{" "}
          <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>Marketplace</em>, ya sabes lo pesado que es
          esto.
        </h2>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          alignItems: "stretch",
        }}
        className="vs-grid"
      >
        {/* Before */}
        <div
          style={{
            padding: 40,
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "var(--cream-deep)",
            border: "1px solid var(--line)",
          }}
          className="vs-box"
        >
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 500,
              color: "var(--ink-soft)",
            }}
          >
            Antes · por Facebook
          </span>
          <h3
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 40,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            La vida <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>complicada.</em>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {beforeItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 15, lineHeight: 1.4 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    marginTop: 2,
                    background: "var(--terracotta)",
                    color: "var(--cream)",
                  }}
                >
                  <XIcon />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div
          style={{
            padding: 40,
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "var(--ink)",
            color: "var(--cream)",
          }}
          className="vs-box"
        >
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 500,
              color: "rgba(245,237,224,0.6)",
            }}
          >
            Ahora · con Shopea
          </span>
          <h3
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 40,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            La vida <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>sencilla.</em>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {afterItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 15, lineHeight: 1.4 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    marginTop: 2,
                    background: "var(--green-wa)",
                    color: "var(--ink)",
                  }}
                >
                  <CheckIcon />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .vs-grid { grid-template-columns: 1fr !important; }
          .vs-box { padding: 28px !important; }
        }
      `}</style>
    </section>
  );
}

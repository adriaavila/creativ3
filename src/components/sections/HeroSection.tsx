import { DualPriceCard } from "@/components/ui/DualPriceCard";
import { SvgUnderline } from "@/components/ui/SvgUnderline";

function Word({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        paddingBottom: "0.08em",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: "translateY(100%)",
          animation: `riseUp 1s cubic-bezier(.2,.8,.2,1) ${delay}s forwards`,
        }}
      >
        {children}
      </span>
    </span>
  );
}

export default function HeroSection() {
  return (
    <header
      style={{
        minHeight: "100vh",
        padding: "140px 40px 60px",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      className="hero-section"
    >
      <DualPriceCard />

      {/* tag */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px 8px 10px",
          background: "var(--cream-deep)",
          border: "1px solid var(--line)",
          borderRadius: 100,
          fontSize: 13,
          color: "var(--ink-soft)",
          width: "fit-content",
          marginBottom: 32,
          animation: "fadeUp 0.8s 0.1s backwards cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            background: "var(--terracotta)",
            borderRadius: "50%",
            display: "inline-block",
            animation: "pulseDot 2s infinite",
          }}
        />
        Hecho en Caracas, para Caracas
      </div>

      {/* headline */}
      <h1
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontWeight: 400,
          fontSize: "clamp(56px, 10.5vw, 172px)",
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          maxWidth: 1500,
        }}
      >
        <Word delay={0.1}>Vende</Word>{" "}
        <Word delay={0.2}>en</Word>{" "}
        <Word delay={0.3}>
          <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>línea</em>
        </Word>
        <br />
        <Word delay={0.45}>como</Word>{" "}
        <Word delay={0.55}>si</Word>{" "}
        <Word delay={0.65}>fuera</Word>{" "}
        <Word delay={0.75}>por</Word>{" "}
        <Word delay={0.85}>
          <span style={{ position: "relative", display: "inline-block" }}>
            <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>WhatsApp.</em>
            <SvgUnderline />
          </span>
        </Word>
        <br />
        <Word delay={1.0}>Pero</Word>{" "}
        <Word delay={1.1}>en</Word>{" "}
        <Word delay={1.2}>
          <em style={{ fontStyle: "italic" }}>serio.</em>
        </Word>
      </h1>

      {/* subtitle */}
      <p
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: "clamp(20px, 2vw, 26px)",
          lineHeight: 1.4,
          maxWidth: 640,
          color: "var(--ink-soft)",
          marginTop: 40,
          animation: "fadeUp 1s 1.3s backwards cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <strong style={{ fontWeight: 500, color: "var(--ink)" }}>Shopea</strong> es tu{" "}
        <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>catálogo, checkout y cobro</em> en un solo
        link. Subes tus productos una vez, tu cliente elige si paga en divisa o bolívares, y te cae el pedido al
        WhatsApp con el total correcto. Todo lo que hace falta para vender mejor que en{" "}
        <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>Facebook Marketplace.</em>
      </p>

      {/* bottom row */}
      <div
        style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
          animation: "fadeUp 1s 1.5s backwards cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <a
          href="#final"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            background: "var(--ink)",
            color: "var(--cream)",
            padding: "22px 36px",
            borderRadius: 100,
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 500,
          }}
          className="hero-cta"
        >
          Crea tu tienda, es gratis
          <span
            style={{
              width: 32,
              height: 32,
              background: "var(--cream)",
              color: "var(--ink)",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
            }}
            className="arrow"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </a>

        <a
          href="#como"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: "var(--ink-soft)",
            textDecoration: "none",
            fontSize: 15,
            borderBottom: "1px solid var(--line)",
            paddingBottom: 4,
          }}
        >
          Ver cómo funciona
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 1.5L9 6L3 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </a>

        <span
          style={{
            fontFamily: "var(--font-caveat)",
            fontSize: 22,
            color: "var(--terracotta)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ¡en 4 minutos!
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-section { padding: 120px 20px 40px; }
        }
        .hero-cta:hover { background: var(--terracotta); }
        .hero-cta:hover .arrow { transform: rotate(-45deg); }
        .svg-underline-path {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: drawLine 1.6s 1.5s forwards cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </header>
  );
}

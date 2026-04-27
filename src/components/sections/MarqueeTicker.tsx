const ITEMS = [
  "Dulces de abuela",
  "Ropa por pedido",
  "Barberías del Este",
  "Electrodomésticos Catia",
  "Bodegones en Las Mercedes",
  "Manicuristas de Chacao",
  "Tenis usados como nuevos",
  "Tequeños por encargo",
  "Muebles del abuelo",
  "Cachapas en Altamira",
];

const ALL = [...ITEMS, ...ITEMS];

export default function MarqueeTicker() {
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        padding: "26px 0",
        overflow: "hidden",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 48,
          whiteSpace: "nowrap",
          animation: "marqueeScroll 55s linear infinite",
          fontFamily: "var(--font-instrument-serif)",
          fontSize: 48,
          fontStyle: "italic",
        }}
        aria-hidden="true"
      >
        {ALL.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 48, flexShrink: 0 }}>
            {item}
            <span
              style={{
                color: "var(--terracotta)",
                fontStyle: "normal",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 20,
              }}
            >
              ✿
            </span>
          </span>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .marquee-track { font-size: 32px; gap: 28px; }
        }
      `}</style>
    </div>
  );
}

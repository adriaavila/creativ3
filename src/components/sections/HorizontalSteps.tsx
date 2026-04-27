"use client";

import { useEffect, useRef, useState } from "react";

function Card1Visual() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 340,
        borderRadius: 20,
        background: "var(--cream)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 22,
        gap: 10,
      }}
    >
      {[
        { emoji: "🎂", name: "Torta tres leches", cat: "repostería", usd: "$ 25,00", bs: "Bs 1.081" },
        { emoji: "🧁", name: "Cupcakes x12", cat: "repostería", usd: "$ 18,00", bs: "Bs 779" },
      ].map((p) => (
        <div
          key={p.name}
          style={{
            background: "var(--cream-deep)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "44px 1fr auto",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "var(--cream)",
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              fontSize: 22,
            }}
          >
            {p.emoji}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 18, lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {p.cat}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span
              style={{
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 100,
                fontWeight: 500,
                background: "var(--moss)",
                color: "white",
              }}
            >
              {p.usd}
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 100,
                fontWeight: 500,
                background: "var(--terracotta)",
                color: "var(--cream)",
              }}
            >
              {p.bs}
            </span>
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 6,
          padding: "14px 16px",
          background: "var(--cream)",
          border: "1.5px dashed var(--terracotta)",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Recargo paga en Bs
          </div>
          <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 22, color: "var(--terracotta)" }}>+5%</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Tasa hoy
          </div>
          <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 22, color: "var(--terracotta)" }}>
            Bs 41,18
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-caveat)",
          fontSize: 18,
          color: "var(--terracotta)",
          textAlign: "center",
          marginTop: 4,
        }}
      >
        ↑ todo se actualiza solito ↑
      </div>
    </div>
  );
}

function Card2Visual() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 340,
        borderRadius: 20,
        background: "var(--cream)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        gap: 14,
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          background: "var(--ink)",
          color: "var(--cream)",
          padding: "10px 16px",
          borderRadius: 100,
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          alignSelf: "flex-start",
        }}
      >
        <span style={{ width: 6, height: 6, background: "var(--terracotta)", borderRadius: "50%", display: "inline-block" }} />
        shopea.online/dulcesmariana
      </div>
      <div
        style={{
          width: 220,
          background: "var(--cream-deep)",
          borderRadius: 22,
          padding: 16,
          border: "1px solid var(--line)",
        }}
      >
        <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 22, lineHeight: 1, marginBottom: 2 }}>
          Dulces <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>Mariana</em>
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-soft)", marginBottom: 14 }}>Repostería · Las Mercedes</div>
        {[
          { emoji: "🎂", name: "Torta tres leches", usd: "$25", bs: "Bs 1.081" },
          { emoji: "🧁", name: "Cupcakes x12", usd: "$18", bs: "Bs 779" },
          { emoji: "🍪", name: "Galletas deco", usd: "$1,50", bs: "Bs 65" },
        ].map((p) => (
          <div
            key={p.name}
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 0",
              borderTop: "1px solid var(--line)",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                background: "var(--cream)",
                borderRadius: 7,
                display: "grid",
                placeItems: "center",
                fontSize: 17,
              }}
            >
              {p.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 2, fontSize: 10 }}>
                <span style={{ color: "var(--moss)", fontWeight: 600 }}>{p.usd}</span>·
                <span style={{ color: "var(--terracotta)", fontWeight: 600 }}>{p.bs}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutToggle() {
  const [isUsd, setIsUsd] = useState(false);

  const itemsBs = [
    { label: "Torta tres leches", val: "Bs 1.081" },
    { label: "Cupcakes x12", val: "Bs 779" },
    { label: "Galletas x10", val: "Bs 650" },
  ];
  const itemsUsd = [
    { label: "Torta tres leches", val: "$ 25,00" },
    { label: "Cupcakes x12", val: "$ 18,00" },
    { label: "Galletas x10", val: "$ 15,00" },
  ];

  const items = isUsd ? itemsUsd : itemsBs;
  const total = isUsd ? "$ 58,00" : "Bs 2.510";
  const totalColor = isUsd ? "var(--moss)" : "var(--terracotta)";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 340,
        borderRadius: 20,
        background: "var(--cream)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 24,
      }}
    >
      <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 20, marginBottom: 4 }}>Tu pedido</div>
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 16,
        }}
      >
        Dulces Mariana · 3 productos
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--cream-deep)",
          borderRadius: 14,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {["Paga en $", "Paga en Bs"].map((label) => {
          const active = (label === "Paga en $") === isUsd;
          return (
            <button
              key={label}
              onClick={() => setIsUsd(label === "Paga en $")}
              style={{
                padding: 10,
                textAlign: "center",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--cream)" : "var(--ink)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "12px 0",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          fontSize: 13,
          color: "var(--ink-soft)",
        }}
      >
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{item.label}</span>
            <span>{item.val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Total
        </div>
        <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 32, color: totalColor, transition: "color 0.3s" }}>
          {total}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {["Pago Móvil", "Transf.", "Zelle", "Binance"].map((m, i) => (
          <div
            key={m}
            style={{
              background: i === 0 ? "var(--terracotta)" : "var(--cream-deep)",
              color: i === 0 ? "var(--cream)" : "var(--ink-soft)",
              borderRadius: 10,
              padding: "10px 4px",
              fontSize: 9,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card4Visual() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 340,
        borderRadius: 20,
        background: "var(--terracotta-deep)",
        border: "1px solid rgba(245,237,224,0.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(245,237,224,0.2)",
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--cream)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
          }}
        >
          🛍️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--cream)" }}>Shopea · Pedido</div>
          <div style={{ fontSize: 11, color: "rgba(245,237,224,0.65)" }}>Nuevo · hace 8 seg</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingTop: 16 }}>
        <div
          style={{
            maxWidth: "84%",
            padding: "10px 14px",
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--ink)",
            background: "var(--cream)",
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              background: "var(--moss)",
              color: "white",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: 6,
              display: "inline-block",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            Pedido #104
          </span>
          <br />
          👋 Hola! Soy Carla, quiero:
          <br />• 1x Torta tres leches
          <br />• 1 docena cupcakes
          <br />• 10x Galletas
        </div>
        <div
          style={{
            maxWidth: "84%",
            padding: "10px 14px",
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--ink)",
            background: "var(--cream)",
            alignSelf: "flex-start",
          }}
        >
          <strong style={{ fontWeight: 600 }}>Total: Bs 2.510</strong>
          <br />
          💳 Pago Móvil
          <br />
          📍 Delivery a Los Palos Grandes
          <div style={{ fontSize: 10, color: "rgba(42,30,20,0.5)", marginTop: 4, textAlign: "right" }}>10:42</div>
        </div>
        <div
          style={{
            maxWidth: "84%",
            padding: "10px 14px",
            borderRadius: 16,
            borderBottomRightRadius: 4,
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--ink)",
            background: "var(--green-wa)",
            alignSelf: "flex-end",
          }}
        >
          Lista! Datos de Pago Móvil:
          <br />
          Banesco · 0424-xxxx
          <br />
          Cédula: V-xxx
          <div style={{ fontSize: 10, color: "rgba(42,30,20,0.5)", marginTop: 4, textAlign: "right" }}>10:43 ✓✓</div>
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  {
    num: "01",
    title: (
      <>
        Subes <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>lo que vendes</em>
      </>
    ),
    body: "Foto, nombre, precio en dólares. Nosotros calculamos el precio en bolívares automáticamente con la tasa del día, y tú decides si quieres dar un pequeño descuento a quien pague en divisa.",
    bg: "var(--cream-deep)",
    visual: <Card1Visual />,
  },
  {
    num: "02",
    title: (
      <>
        Compartes <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>tu link</em>
      </>
    ),
    body: "Pega tu link en Facebook Marketplace, en tu bio de Instagram, en el grupo del edificio, en tu status de WhatsApp. El mismo link sirve para todo. Tu vitrina abre 24/7, tus clientes llegan solos.",
    bg: "var(--sand)",
    visual: <Card2Visual />,
  },
  {
    num: "03",
    title: (
      <>
        Tu cliente{" "}
        <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>elige cómo pagar</em>
      </>
    ),
    body: "Arma su pedido y decide: ¿divisa o bolívares? El total se actualiza al instante. Ve los métodos de pago que tú configuraste: Pago Móvil, Zelle, Binance, efectivo. Cero malentendidos.",
    bg: "#e6d5b3",
    visual: <CheckoutToggle />,
  },
  {
    num: "04",
    title: (
      <>
        Te llega <em style={{ fontStyle: "italic", color: "var(--cream)" }}>ordenadito</em>
      </>
    ),
    body: "Te cae el pedido al WhatsApp con todo claro: qué pidió, cuánto, en qué moneda, con qué método. Respondes tus datos de pago y listo. Tú cobras directo, Shopea no toca tu plata.",
    bg: "var(--terracotta)",
    dark: true,
    visual: <Card4Visual />,
  },
];

export default function HorizontalSteps() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track) return;

      if (window.innerWidth <= 900) {
        track.style.transform = "none";
        return;
      }

      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const maxTx = track.scrollWidth - window.innerWidth;
      track.style.transform = `translateX(${-progress * maxTx}px)`;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section style={{ position: "relative", zIndex: 1 }} id="como">
      <div className="horizontal-wrap" ref={wrapRef}>
        <div className="horizontal-sticky">
          <div className="horizontal-track" ref={trackRef}>
            {/* Intro panel */}
            <div
              style={{
                flexShrink: 0,
                width: "100vw",
                padding: "0 60px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
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
                <span
                  style={{
                    width: 40,
                    height: 1,
                    background: "var(--terracotta)",
                    display: "inline-block",
                  }}
                />
                Cómo funciona
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: "clamp(56px, 9vw, 140px)",
                  fontWeight: 400,
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  maxWidth: 1100,
                }}
              >
                Cuatro pasos.{" "}
                <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>Cero</em> calculadora. Cero dramas.
              </h2>
              <div
                style={{
                  marginTop: 40,
                  fontFamily: "var(--font-caveat)",
                  fontSize: 30,
                  color: "var(--terracotta)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                Deslizá para ver
                <svg
                  width="40"
                  height="20"
                  viewBox="0 0 40 20"
                  fill="none"
                  style={{ animation: "nudge 1.8s ease-in-out infinite" }}
                >
                  <path
                    d="M2 10H36M36 10L28 3M36 10L28 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Step cards */}
            {CARDS.map((card) => (
              <div
                key={card.num}
                style={{
                  flexShrink: 0,
                  width: "72vw",
                  maxWidth: 900,
                  height: "78vh",
                  borderRadius: 32,
                  padding: 56,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 40,
                  alignItems: "center",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  background: card.bg,
                  color: card.dark ? "var(--cream)" : "var(--ink)",
                }}
                className="h-card"
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif)",
                      fontSize: 120,
                      fontStyle: "italic",
                      color: card.dark ? "var(--cream)" : "var(--terracotta)",
                      lineHeight: 0.8,
                    }}
                  >
                    {card.num}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-instrument-serif)",
                      fontSize: 52,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 17,
                      lineHeight: 1.55,
                      color: card.dark ? "rgba(245,237,224,0.85)" : "var(--ink-soft)",
                      maxWidth: 420,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
                {card.visual}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .h-card {
            width: 100% !important;
            height: auto !important;
            grid-template-columns: 1fr !important;
            padding: 32px !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}

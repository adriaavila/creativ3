"use client";

import { useEffect, useState } from "react";

const BASE_RATE = 41.18;
const USD_PRICE = 25;
const RECARGO = 1.05;

function formatBs(n: number) {
  return new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 }).format(n);
}

export function DualPriceCard() {
  const [rate, setRate] = useState(BASE_RATE);
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.06 * BASE_RATE;
      setRate((prev) => Math.max(38, Math.min(46, +(prev + delta).toFixed(2))));
      setTicking(true);
      const t = setTimeout(() => setTicking(false), 400);
      return () => clearTimeout(t);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const bsPrice = Math.round(USD_PRICE * rate * RECARGO);

  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        right: 60,
        background: "var(--cream)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        padding: "18px 22px",
        boxShadow: "0 14px 50px -14px rgba(42,30,20,0.2)",
        minWidth: 260,
        animation: "fadeUp 1s 0.7s backwards cubic-bezier(.2,.8,.2,1), float 6s 2s infinite ease-in-out",
        zIndex: 2,
      }}
      className="hidden lg:block"
    >
      {/* head */}
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ink-soft)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            background: "#2a9d4e",
            borderRadius: "50%",
            display: "inline-block",
            animation: "pulseGreen 1.6s infinite",
          }}
        />
        Así lo ve tu cliente
      </div>

      {/* product */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: "var(--cream-deep)",
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            fontSize: 22,
          }}
        >
          🎂
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: 18, lineHeight: 1 }}>
            Torta tres leches
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Dulces Mariana · Las Mercedes</div>
        </div>
      </div>

      {/* USD row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0 4px",
          fontSize: 13,
        }}
      >
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-soft)" }}>
          Paga en divisa
        </span>
        <strong
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--moss)",
          }}
        >
          $25,00
        </strong>
      </div>

      {/* Bs row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 0",
          fontSize: 13,
        }}
      >
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-soft)" }}>
          Paga en bolívares
        </span>
        <strong
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--terracotta)",
            transition: "color 0.2s",
            ...(ticking ? { animation: "tickFlash 0.4s" } : {}),
          }}
        >
          Bs {formatBs(bsPrice)}
        </strong>
      </div>
    </div>
  );
}

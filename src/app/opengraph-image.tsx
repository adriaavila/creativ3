import { ImageResponse } from "next/og";
import { wavePath } from "@/lib/waveform";

export const runtime = "edge";
export const alt = "Allok — Convierte conversaciones en ventas.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// The same generator the logo uses, at banner density.
const WAVE = wavePath({ cycles: 26, width: 1040, amp: 58, midY: 80 });

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#08090a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "#f5f5f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>Allok</span>
          <span style={{ fontSize: 22, color: "#8a8a8a", letterSpacing: "0.12em" }}>
            SISTEMA COMERCIAL PARA WHATSAPP
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="1040" height="160" viewBox="0 0 1040 160">
            <path d={WAVE} fill="none" stroke="#c5f04a" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: "-0.04em",
            }}
          >
            <span>Convierte conversaciones</span>
            <span style={{ color: "#8a8a8a" }}>en ventas.</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#a1a1a3" }}>
            allok.fun
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

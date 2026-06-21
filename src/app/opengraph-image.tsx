import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "creativv — Vende más. Reduce el costo de operar.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4f0e5",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          color: "#172016",
          fontFamily: "serif",
        }}
      >
        {/* Subtle noise representation via radial gradients */}
        <div
          style={{
            position: "absolute",
            top: "-60%",
            right: "-25%",
            width: "1000px",
            height: "1000px",
            background: "radial-gradient(circle, rgba(104, 148, 87, 0.28), transparent 62%)",
          }}
        />
        
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: "24px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 104,
              lineHeight: 0.86,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span>Vende más.</span>
            <span style={{ color: "#31583a", fontStyle: "italic" }}>Reduce el costo</span>
            <span>de operar.</span>
          </div>
          
          <div
            style={{
              fontSize: 32,
              opacity: 0.68,
              marginTop: "28px",
            }}
          >
            Sistemas digitales y agentes IA para convertir demanda en ventas y trabajo manual en operación.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "64px",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 80px",
            fontSize: 24,
            opacity: 0.52,
          }}
        >
          <span>CREATIVV · SISTEMAS + AGENTES IA</span>
          <span>servicioscreativos.online</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

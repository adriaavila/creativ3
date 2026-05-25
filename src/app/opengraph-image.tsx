import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "creativv - Estudio AI de diseno y codigo.";
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
          background: "#0a1f2e",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          color: "#f0ead6",
          fontFamily: "serif",
        }}
      >
        {/* Subtle noise representation via radial gradients */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "1000px",
            height: "1000px",
            background: "radial-gradient(circle, rgba(168, 201, 127, 0.24), transparent 60%)",
          }}
        />
        
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 100,
              lineHeight: 0.9,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>creativv</span>
            <span style={{ color: "#a8c97f", fontStyle: "italic" }}>design + code + AI</span>
          </div>
          
          <div
            style={{
              fontSize: 32,
              opacity: 0.7,
              marginTop: "40px",
            }}
          >
            Websites premium, productos digitales y automatizaciones IA.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "80px",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 80px",
            fontSize: 24,
            opacity: 0.5,
          }}
        >
          <span>PREMIUM STUDIO &middot; CARACAS / REMOTO</span>
          <span>10.4806° N, 66.9036° W</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

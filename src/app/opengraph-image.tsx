import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Servicios Creativos - El software que merece Venezuela.";
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
          fontFamily: "serif", // In OG generation, custom fonts require loading TTF files. Using default serif for fallback, or we can load Google Fonts.
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
            background: "radial-gradient(circle, rgba(42, 110, 160, 0.2), transparent 60%)",
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
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Servicios</span>
            <span style={{ color: "#2a6ea0", fontStyle: "italic" }}>Creativos</span>
          </div>
          
          <div
            style={{
              fontSize: 32,
              opacity: 0.7,
              marginTop: "40px",
            }}
          >
            El software que merece Venezuela.
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
          <span>VOL. I &middot; CARACAS</span>
          <span>10.4806° N, 66.9036° W</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

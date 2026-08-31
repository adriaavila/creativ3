import { ImageResponse } from "next/og";
import { CONTACT_EMAIL } from "@/lib/contact";

export const alt = "Adrián Ávila Molina — industrial engineer building software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Node runtime on purpose: this app ships as a standalone container, and
// ImageResponse needs no edge runtime to render.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4f4f0",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            borderBottom: "3px solid #0a0a0a",
            paddingBottom: 20,
          }}
        >
          <span>Adrián Ávila Molina</span>
          <span style={{ color: "#e61919" }}>{CONTACT_EMAIL}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 0.84,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
            }}
          >
            <span>Industrial</span>
            <span>Engineer</span>
          </div>
          {/* The one plate of sky, same dawn→dusk ramp as the site. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 74,
              marginTop: 22,
              padding: "0 22px",
              fontSize: 18,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#f7f4ef",
              backgroundImage:
                "linear-gradient(96deg, rgb(3,18,63) 0%, rgb(27,63,150) 30%, rgb(103,39,125) 62%, rgb(180,16,101) 100%)",
            }}
          >
            24 systems in production · design through deploy
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "rgba(10,10,10,0.62)" }}>
          allok.fun/work
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Juanete × allok — que empiece la función";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Misma placa que la raíz, con el copy del proyecto: el link se comparte por WhatsApp.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f4f0",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          color: "#101112",
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
            borderBottom: "3px solid #101112",
            paddingBottom: 20,
          }}
        >
          <span>allok × juanete</span>
          <span style={{ color: "#b41065" }}>comedia musical</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 0.86,
              letterSpacing: "-0.05em",
            }}
          >
            <span>Que empiece</span>
            <span>la función.</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 74,
              marginTop: 24,
              padding: "0 22px",
              fontSize: 18,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#f7f4ef",
              backgroundImage:
                "linear-gradient(96deg, rgb(3,18,63) 0%, rgb(27,63,150) 30%, rgb(103,39,125) 62%, rgb(180,16,101) 100%)",
            }}
          >
            Proyecto Juanete · pago seguro · confirmación al instante
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "rgba(16,17,18,0.62)" }}>allok.fun/pago/juanete</div>
      </div>
    ),
    size,
  );
}

"use client";

import { useState } from "react";

const FAQS = [
  {
    q: (
      <>
        ¿Puedo <em>seguir usando</em> FB Marketplace?
      </>
    ),
    a: "Claro que sí, no te queremos hacer mudar de casa. Shopea es el complemento: tú sigues publicando en Facebook Marketplace, Instagram o grupos de WhatsApp, pero en vez de mandar el precio por mensaje, pones tu link de Shopea. El cliente ve todo claro, hace el pedido y a ti te llega ordenado. Es usar lo que ya tienes, pero mejor.",
  },
  {
    q: (
      <>
        ¿Cómo manejo <em>precios en Bs y en divisa?</em>
      </>
    ),
    a: "Tú pones el precio en dólares y nosotros calculamos el precio en Bs automáticamente con la tasa del día. Puedes configurar un recargo para quien pague en Bs (por ejemplo +5%, porque sabemos que cobrar en bolívares tiene sus riesgos) o dejarlo igual. Y si algún producto tiene un margen distinto, puedes sobreescribir el precio en Bs manualmente. Control total, cero dolor de cabeza.",
  },
  {
    q: (
      <>
        ¿De dónde sale <em>la tasa del dólar?</em>
      </>
    ),
    a: "Tomamos la tasa oficial del BCV y la paralela de fuentes públicas (Monitor Dólar, EnParaleloVzla). Tú decides cuál usar. En el plan Bodegón puedes incluso mostrar las dos para que tu cliente sepa a qué tasa le estás cobrando. Se actualiza cada hora, sin que hagas nada.",
  },
  {
    q: (
      <>
        ¿Ustedes se quedan con <em>comisión de mis ventas?</em>
      </>
    ),
    a: "No. Cero. Nada. Tu cliente te paga directo a tu Pago Móvil, tu Zelle, tu Binance. Nosotros no tocamos tu plata nunca, no tenemos pasarela, no somos intermediarios. Cobramos una suscripción fija y ya. Tu plata es tu plata.",
  },
  {
    q: (
      <>
        ¿Necesito saber <em>de computación?</em>
      </>
    ),
    a: "Cero. Si subes fotos a Instagram, puedes usar Shopea. Abres tu tienda desde el celular, subes una foto, le pones precio y listo. En 4 minutos ya tienes tu link para compartir. Y si te atoras, nos escribes al WhatsApp y te ayudamos en vivo.",
  },
  {
    q: (
      <>
        ¿Puedo <em>cancelar</em> cuando quiera?
      </>
    ),
    a: "Cuando quieras, sin letra chica. Cancelas con un botón, tu tienda se queda en el plan gratis con tus productos intactos. No perdemos amigos por plata.",
  },
  {
    q: (
      <>
        ¿Y si vendo <em>servicios</em>, no productos?
      </>
    ),
    a: "También te sirve. Manicuristas, barberos, fotógrafos, tatuadores: ponen sus servicios con precio y el cliente pide cita por WhatsApp. En unos meses sacamos AgendaBella, una versión con calendario de citas. Si eres del gremio, anótate y te avisamos primero.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ padding: "120px 40px", position: "relative", zIndex: 1 }} id="faq" className="faq-section">
      <div style={{ maxWidth: 1400, margin: "0 auto 80px" }}>
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
          <span style={{ width: 40, height: 1, background: "var(--terracotta)", display: "inline-block" }} />
          Lo de siempre
        </div>
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "clamp(48px, 7vw, 112px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          Las <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>preguntas</em> que todos hacen.
        </h2>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              style={{
                borderTop: "1px solid var(--line)",
                padding: "32px 0",
                cursor: "pointer",
                ...(i === FAQS.length - 1 ? { borderBottom: "1px solid var(--line)" } : {}),
              }}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <div
                role="button"
                aria-expanded={isOpen}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 20,
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: "clamp(22px, 2.8vw, 34px)",
                  lineHeight: 1.2,
                  color: isOpen ? "var(--terracotta)" : "var(--ink)",
                  transition: "color 0.3s",
                }}
              >
                <span>{faq.q}</span>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    minWidth: 42,
                    borderRadius: "50%",
                    background: isOpen ? "var(--terracotta)" : "var(--cream-deep)",
                    color: isOpen ? "var(--cream)" : "var(--ink)",
                    display: "grid",
                    placeItems: "center",
                    transition: "transform 0.4s cubic-bezier(.2,.8,.2,1), background 0.3s, color 0.3s",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <div
                style={{
                  maxHeight: isOpen ? 400 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.5s cubic-bezier(.2,.8,.2,1)",
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "var(--ink-soft)",
                  maxWidth: 720,
                  paddingTop: isOpen ? 20 : 0,
                }}
              >
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .faq-section { padding: 80px 20px !important; }
        }
      `}</style>
    </section>
  );
}

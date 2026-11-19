import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Eliminación de datos de usuario",
  description: "Instrucciones para solicitar la eliminación de datos de usuario en nuestras aplicaciones y sitios web.",
  alternates: { canonical: "/eliminacion-de-datos" },
};

const correo = (
  <a className="text-[var(--text-primary)] underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
    {CONTACT_EMAIL}
  </a>
);

// El mismo texto de siempre (Meta lo pide para la integración de WhatsApp), en el molde de privacidad y
// términos: antes era una página blanca suelta, en otra fuente y sin salida.
const SECCIONES = [
  [
    "Tu derecho",
    "De acuerdo con las regulaciones de privacidad y los requisitos de plataformas de terceros, los usuarios tienen el derecho a solicitar que se eliminen sus datos personales de las bases de datos y aplicaciones utilizadas por allok.",
  ],
  [
    "Qué datos se eliminan",
    "Al procesar tu solicitud, eliminaremos o de-identificaremos la información personal asociada a ti u otras interacciones directas (por ejemplo: nombre, correo, teléfono, registros en bases de datos comerciales de nuestra propiedad), exceptuando aquella información que debamos retener por cumplimiento de obligaciones legales o fiscales, o por ejercer defensa de derechos.",
  ],
  [
    "Cómo pedirlo",
    <>
      <p>Para solicitar formalmente la eliminación de tus datos:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Envía un correo electrónico a {correo}.</li>
        <li>Asunto sugerido: Solicitud de eliminación de datos.</li>
        <li>
          En el cuerpo, indica el correo o número de teléfono que deseas eliminar de los registros, y si la solicitud
          involucra alguna aplicación conectada específica o el registro general comercial.
        </li>
      </ul>
    </>,
  ],
  [
    "Plazos",
    "Luego de recibir tu solicitud, te confirmaremos recepción y procederemos a la eliminación en un plazo máximo de cinco (5) a siete (7) días hábiles de la confirmación de tu identidad, si correspondiese. En caso de requerir información adicional, dicho plazo podrá extenderse proporcionalmente.",
  ],
  [
    "Servicios de terceros",
    "Si la eliminación corresponde a datos entregados mediante aplicaciones de redes sociales o formularios conectados vía API, la eliminación recaerá únicamente sobre nuestras bases de datos internas. Revisa también los permisos en las plataformas de origen en las que hayas consentido el acceso a tu información.",
  ],
] as const;

export default function LegalDataDeletion() {
  return <LegalShell title="Eliminación de datos de usuario" sections={SECCIONES} />;
}

import { MarkSvg } from "@/components/ak/Brand";
import DemoAgente from "./DemoAgente";

/**
 * El agente, en Ink, el segundo juguete de la portada: una línea y la demo,
 * para probarlo con la web propia. Lo que hace y cómo se contrata vive en
 * /agente-whatsapp; aquí solo se prueba. Mientras esta sección cruza el medio
 * de la pantalla, la barra de WhatsApp lleva el mensaje del agente.
 */
export default function Agente() {
  return (
    <section id="agente" className="agente" data-theme="ink" data-stagger="" aria-labelledby="agente-titulo">
      <h2 id="agente-titulo" className="agente-titulo" data-reveal="">
        Prueba tu agente de WhatsApp.
      </h2>
      <DemoAgente tituloId="agente-titulo" marca={<MarkSvg />} />
    </section>
  );
}

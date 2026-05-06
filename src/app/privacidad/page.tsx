import type { Metadata } from "next";
import Colofon from "@/components/landing/Colofon";

export const metadata: Metadata = {
  title: "Política de privacidad | Servicios Creativos",
  description: "Política de privacidad para formularios, comunicaciones comerciales, proyectos y servicios tecnológicos.",
};

export default function LegalPrivacy() {
  return (
    <div className="min-h-screen bg-noche text-papiro pt-32 selection:bg-cobalto/20 selection:text-papiro">
      <main className="pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-editorial italic mb-6">Política de Privacidad</h1>
          <p className="text-papiro/70 text-lg mb-10 leading-relaxed font-mono">
            Esta política describe cómo Servicios Creativos recopila y utiliza datos personales cuando una persona navega este sitio, completa formularios, solicita propuestas o interactúa con nuestros canales de contacto.
          </p>

          <div className="space-y-8 text-papiro/80 leading-8">
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">1. Datos que recopilamos</h2><p>Podemos recopilar nombre, correo, teléfono, empresa, sitio web, país, tipo de proyecto, presupuesto aproximado, cronograma, detalles funcionales, mensajes libres y cualquier otra información que el usuario entregue voluntariamente al solicitar contacto o briefing.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">2. Finalidades</h2><p>Usamos la información para evaluar oportunidades, responder consultas, diseñar propuestas, coordinar reuniones, validar alcance, mantener comunicaciones comerciales legítimas, prestar servicios y mejorar el contenido del sitio.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">3. Base de tratamiento</h2><p>Tratamos datos con base en consentimiento, ejecución precontractual, interés legítimo comercial y cumplimiento de obligaciones legales cuando corresponda. No solicitamos datos innecesarios para la finalidad declarada.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">4. Canales de terceros y proveedores</h2><p>Podemos utilizar correo electrónico, hosting, analítica, formularios, agenda, CRM, Meta/WhatsApp, herramientas de automatización, servicios cloud y otros proveedores. Cada uno puede procesar información conforme a sus propias políticas y condiciones.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">5. Retención</h2><p>Conservamos datos durante el tiempo razonablemente necesario para responder consultas, ejecutar proyectos, documentar decisiones comerciales, cumplir obligaciones legales o proteger intereses legítimos ante controversias.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">6. Seguridad</h2><p>Aplicamos medidas razonables de seguridad organizativa y técnica. Aun así, ningún sistema conectado a internet es absolutamente infalible, especialmente cuando interactúa con múltiples integraciones, proveedores o plataformas externas.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">7. Datos sensibles y compliance</h2><p>No pedimos deliberadamente categorías especiales de datos salvo que un proyecto lo requiera y exista base suficiente para tratarlos. Si un cliente pretende procesar datos sensibles mediante automatizaciones o canales de terceros, el diseño del flujo estará sujeto a validación legal y técnica adicional.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">8. Derechos del titular</h2><p>Cuando aplique, la persona puede solicitar acceso, rectificación, actualización, supresión o limitación del tratamiento de sus datos. También puede pedir el cese de comunicaciones comerciales no esenciales.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-papiro">9. Contacto</h2><p>Para consultas de privacidad, rectificación o eliminación puedes escribir a <a className="text-cobalto hover:underline" href="mailto:hola@servicioscreativos.online">hola@servicioscreativos.online</a>.</p></section>
          </div>
        </div>
      </main>
      <Colofon />
    </div>
  );
}

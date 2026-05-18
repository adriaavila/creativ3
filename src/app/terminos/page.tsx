import type { Metadata } from "next";
import Colofon from "@/components/landing/Colofon";

export const metadata: Metadata = {
  title: "Términos y condiciones | Servicios Creativos",
  description: "Términos y condiciones para servicios de software, automatización, integración y comunicación empresarial.",
};

export default function LegalTerms() {
  return (
    <div className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d] pt-32 selection:bg-[#85AB8B]/30 selection:text-[#1f2a1d]">
      <main className="pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-normal mb-6">Términos y Condiciones</h1>
          <p className="text-[#4b5b47] text-lg mb-10 leading-relaxed font-mono">
            Estos términos regulan el acceso y uso del sitio y de los servicios prestados por Servicios Creativos. Están redactados con criterio profesional para acompañar servicios de desarrollo, automatización, integraciones, infraestructura digital y soluciones orientadas a canales como WhatsApp, correo y APIs empresariales.
          </p>

          <div className="space-y-8 text-[#4b5b47] leading-8">
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">1. Alcance</h2><p>El sitio presenta servicios de consultoría, diseño, desarrollo, automatización, integraciones, soporte y activos digitales. Cualquier contratación específica se rige además por propuesta comercial, alcance aprobado, cronograma, condiciones de pago y acuerdos complementarios.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">2. Uso permitido</h2><p>El usuario se compromete a usar el sitio de forma lícita y profesional. No podrá intentar interferir con su seguridad, extraer información sin autorización, abusar de formularios ni utilizar el sitio para fines fraudulentos, difamatorios o contrarios a regulación aplicable.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">3. Propuestas, presupuestos y contratación</h2><p>La información publicada no constituye una oferta irrevocable. Toda cotización, estimación de tiempo, alcance o fee puede cambiar luego de discovery, revisión técnica o validación operativa. La contratación se considera efectiva cuando existe aceptación escrita o pago inicial según corresponda.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">4. Responsabilidades del cliente</h2><p>El cliente debe suministrar información veraz, acceso oportuno a cuentas, material legalmente utilizable, feedback razonable y aprobaciones dentro de plazos compatibles con el proyecto. Retrasos del cliente pueden afectar cronograma, presupuesto y fechas de entrega.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">5. Propiedad intelectual</h2><p>Salvo pacto distinto, el estudio conserva metodologías, frameworks, componentes reutilizables, documentación interna, prompts, automatizaciones base y know-how. El cliente obtiene derechos de uso sobre entregables pagados conforme al alcance aprobado. Terceros como Meta, OpenAI, Vercel, Supabase u otros mantienen sus propias licencias y términos.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">6. Servicios conectados a plataformas de terceros</h2><p>Si una solución integra WhatsApp Business Platform, Meta APIs, correo, CRMs, ERPs, pasarelas de pago o proveedores cloud, el cliente entiende que la continuidad del servicio también depende de políticas, límites, verificaciones, disponibilidad y cumplimiento exigido por esos terceros.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">7. Compliance y actividades restringidas</h2><p>No se desarrollarán flujos destinados a spam, scraping ilícito, evasión de controles, desinformación, fraude, ingeniería social, incumplimiento de políticas de plataformas ni tratamientos de datos prohibidos por ley o por estándares de proveedores tecnológicos.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">8. Limitación de responsabilidad</h2><p>En la medida permitida por ley, Servicios Creativos no será responsable por daños indirectos, lucro cesante, pérdida de oportunidades, suspensión de cuentas de terceros, fallas de proveedores, errores originados por datos incorrectos del cliente o decisiones ejecutadas por personal externo al estudio.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">9. Confidencialidad</h2><p>Toda información sensible compartida en discovery o ejecución será tratada con reserva razonable. Cuando el proyecto lo requiera, podrá formalizarse NDA o cláusulas específicas de seguridad, acceso, almacenamiento y retención de datos.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">10. Terminación</h2><p>Podremos suspender o terminar conversaciones, propuestas o servicios si detectamos uso indebido, fraude, incumplimiento material, falta de cooperación, impago, solicitudes incompatibles con compliance o riesgos reputacionales/técnicos relevantes.</p></section>
            <section><h2 className="text-2xl font-semibold mb-3 text-[#1f2a1d]">11. Contacto legal</h2><p>Para asuntos legales, privacidad o cumplimiento puedes escribir a <a className="text-[#336443] hover:underline" href="mailto:hola@servicioscreativos.online">hola@servicioscreativos.online</a>.</p></section>
          </div>
        </div>
      </main>
      <Colofon />
    </div>
  );
}

import ProjectCheckout from "@/components/billing/ProjectCheckout";

export default function ProjectContinuationPage() {
  return (
    <ProjectCheckout
      item="project-continuation"
      eyebrow="Continuación de proyecto"
      title="Seguimos donde lo dejamos."
      lead="Este pago cubre el siguiente tramo de trabajo sobre tu proyecto en curso. Sin reinicios ni alcance nuevo: continuidad."
      included={[
        "Siguiente tramo de desarrollo acordado",
        "Ajustes y mejoras sobre lo ya entregado",
        "Seguimiento y reporte de avance",
      ]}
      priceLabel="Tramo de continuación"
      currencySymbol="€"
      amount="200"
      currencyCode="EUR"
      note="Pago único sobre un proyecto ya iniciado. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar 200 € de forma segura"
    />
  );
}

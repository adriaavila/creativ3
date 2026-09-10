import ProjectCheckout from "@/components/billing/ProjectCheckout";

export default function NodriaPaymentPage() {
  return (
    <ProjectCheckout
      item="project-continuation"
      client="nodria"
      eyebrow="Nodria"
      title="Seguimos donde lo dejamos."
      lead="Continúa el servicio de Nodria con Allok. Sin reinicios ni alcance nuevo: continuidad."
      included={[
        "Siguiente tramo de desarrollo acordado",
        "Ajustes y mejoras sobre lo ya entregado",
        "Seguimiento y reporte de avance",
      ]}
      priceLabel="Continuación de proyecto Nodria"
      currencySymbol="€"
      amount="200"
      currencyCode="EUR"
      note="Pago único sobre un proyecto ya iniciado. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar 200 € de forma segura"
    />
  );
}

import ProjectCheckout from "@/components/billing/ProjectCheckout";

export default function AiNetworkingPaymentPage() {
  return (
    <ProjectCheckout
      item="project-continuation"
      client="ainetworking"
      eyebrow="AiNetworking"
      title="Seguimos donde lo dejamos."
      lead="Reserva el siguiente tramo del proyecto AiNetworking con Allok. Sin reinicios ni alcance nuevo: continuidad."
      included={[
        "Siguiente tramo de desarrollo acordado",
        "Ajustes y mejoras sobre lo ya entregado",
        "Seguimiento y reporte de avance",
      ]}
      priceLabel="Proyecto AiNetworking"
      currencySymbol="€"
      amount="200"
      currencyCode="EUR"
      note="Pago único sobre un proyecto ya iniciado. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar 200 € de forma segura"
    />
  );
}

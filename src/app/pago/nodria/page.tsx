import ProjectCheckout from "@/components/billing/ProjectCheckout";

export default function NodriaPaymentPage() {
  return (
    <ProjectCheckout
      item="nodria"
      client="nodria"
      eyebrow="Nodria"
      title="Tu próxima mejora empieza aquí."
      lead="Reserva el inicio del proyecto Nodria con Allok. Claridad, dirección y un equipo que convierte la intención en algo real."
      included={[
        "Reserva de tu espacio de trabajo",
        "Sesión de dirección y alcance",
        "Plan de acción para tu proyecto",
      ]}
      priceLabel="Proyecto Nodria"
      currencySymbol="€"
      amount="200"
      currencyCode="EUR"
      note="Pago único. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar 200 € de forma segura"
    />
  );
}

import ProjectCheckout from "@/components/billing/ProjectCheckout";

export default function ProjectPaymentPage() {
  return (
    <ProjectCheckout
      item="project-deposit"
      eyebrow="Inicio de proyecto"
      title="Tu próxima mejora empieza aquí."
      lead="Reserva el inicio de tu proyecto con Allok. Claridad, dirección y un equipo que convierte la intención en algo real."
      included={[
        "Reserva de tu espacio de trabajo",
        "Sesión de dirección y alcance",
        "Plan de acción para tu proyecto",
      ]}
      priceLabel="Depósito de inicio"
      currencySymbol="$"
      amount="200"
      currencyCode="USD"
      note="Pago único. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar $200 de forma segura"
    />
  );
}

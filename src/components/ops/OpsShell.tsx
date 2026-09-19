import type { ReactNode } from "react";
import OpsNav from "@/components/ops/OpsNav";

/**
 * El marco de Ops.
 *
 * `allok-ops` es lo que pone a Ops en el mismo sistema que la web y que la app
 * del cliente: los mismos escalones de superficie, las mismas tintas y el mismo
 * verde de asistencia, con los estados que una herramienta de trabajo necesita
 * y una landing no. El ámbito se basta solo — no lleva `.allok` al lado — y no
 * pinta: el fondo lo pone esta clase.
 *
 * La página va un escalón por debajo (`--ground-2`) para que una tarjeta blanca
 * se lea elevada sin necesidad de sombra.
 */
export default function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="allok-ops ops-shell min-h-dvh bg-[var(--ground-2)] text-[var(--ink)] antialiased">
      <OpsNav global />
      <div className="min-h-dvh overflow-x-hidden pt-[68px] md:ml-[224px] md:pt-0">
        {children}
      </div>
    </div>
  );
}

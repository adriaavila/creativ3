import type { ComponentProps } from "react";
import { MarkSvg } from "@/components/ak/Brand";
import { prefill, whatsappUrl, type Origen } from "@/lib/contact";

type Props = Omit<ComponentProps<"a">, "href" | "target" | "rel" | "className"> & {
  flecha?: boolean;
  /** Qué estaba mirando quien escribe: cambia la primera frase (`prefill`). */
  origen?: Origen;
  /** Con `origen="pieza"`, el trabajo que nombra la frase. */
  pieza?: { nombre: string };
  /**
   * «boton», el de siempre; «barra», el botón fijo de la portada: la marca a
   * la izquierda en vez de la flecha, y `.barra-wa` para su sitio en la página.
   */
  variante?: "boton" | "barra";
  className?: string;
};

/**
 * La única salida de la portada y de /trabajo: WhatsApp, con la primera frase
 * ya escrita. Todos los botones pasan por aquí para que ninguno se quede con
 * otro mensaje.
 */
export default function Escribeme({
  children = "Escríbeme por WhatsApp",
  flecha = true,
  origen = "portada",
  pieza,
  variante = "boton",
  className,
  ...props
}: Props) {
  const barra = variante === "barra";
  const clases = ["btn", "btn-primary", barra ? "barra-wa" : null, className].filter(Boolean).join(" ");
  return (
    <a {...props} className={clases} href={whatsappUrl(prefill(origen, pieza))} target="_blank" rel="noopener noreferrer" data-origen={origen}>
      {barra ? (
        <span className="barra-marca" data-marca="" aria-hidden="true">
          <MarkSvg />
        </span>
      ) : null}
      {children}
      {flecha && !barra ? (
        <>
          {" "}
          <span className="arw arw-ne" aria-hidden="true">
            ↗
          </span>
        </>
      ) : null}
    </a>
  );
}

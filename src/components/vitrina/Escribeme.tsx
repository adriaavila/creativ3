import type { ComponentProps } from "react";
import { HOME_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/contact";

type Props = Omit<ComponentProps<"a">, "href" | "target" | "rel" | "className"> & { flecha?: boolean };

/**
 * La única salida de la portada y de /trabajo: WhatsApp, con la primera frase
 * ya escrita. Todos los botones pasan por aquí para que ninguno se quede con
 * otro mensaje.
 */
export default function Escribeme({ children = "Escríbeme por WhatsApp", flecha = true, ...props }: Props) {
  return (
    <a {...props} className="btn btn-primary" href={whatsappUrl(HOME_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
      {children}
      {flecha ? (
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

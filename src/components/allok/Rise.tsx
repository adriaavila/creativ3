import type { ReactNode } from "react";

/**
 * Un bloque que sube y aparece al entrar en pantalla.
 *
 * Sin JavaScript. La primera versión de esto usaba `whileInView` de motion, y
 * la captura de página completa lo destapó: los bloques se quedaban en
 * opacidad 0 mientras nadie hiciera scroll, y sin JS no aparecían nunca. Una
 * animación de entrada no puede ser la que decide si el contenido existe.
 *
 * Aquí el apagado vive en el fotograma, no en la regla: si el navegador no
 * tiene `animation-timeline: view()` —o el sistema pide menos movimiento— el
 * bloque sale entero y quieto, que es el comportamiento correcto.
 */
export default function Rise({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Décimas de recorrido que espera antes de arrancar. 0 a 3. */
  delay?: 0 | 1 | 2 | 3;
}) {
  return (
    <div className={`allok-rise ${className}`} style={{ "--rise-from": `${6 + delay * 5}%` } as React.CSSProperties}>
      {children}
    </div>
  );
}

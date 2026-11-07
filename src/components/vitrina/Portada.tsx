import { Rise } from "@/components/ak/Brand";
import Estado from "./Estado";
import Manos from "./Manos";
import ManosTrazo from "./ManosTrazo";

/**
 * «Te toca», el primer cuadro, en Ink: quién (su nombre, que sube línea por
 * línea desde su propio borde con un keyframe de CSS que arranca en el primer
 * pintado, sin esperar a motion.js ni a React, porque es el LCP), qué hace,
 * las dos manos que esperan el toque y quién contesta. Nada más: ni etiqueta,
 * ni párrafo, ni otro botón; la salida es la barra de WhatsApp.
 *
 * La respuesta («Cuéntame qué te quita tiempo.») viene del servidor en el
 * renglón de la pista de las manos, con su alto ya reservado, y la muestra el
 * CSS cuando el lazo se cierra: Manos pone `data-cerrado` en esta sección.
 */
export default function Portada() {
  return (
    <section id="inicio" className="hero portada" data-theme="ink" aria-labelledby="inicio-titulo">
      <h1 id="inicio-titulo" className="display">
        <Rise>Hola, soy</Rise>
        <Rise line={1}>Adrián.</Rise>
      </h1>
      {/* Dos frases que no se parten por dentro. Cada una es su propio bloque de texto: así el nombre, que en el
          primer pintado todavía asoma desde su borde, sigue siendo el texto más grande de la pantalla (el LCP). */}
      <p className="sub">
        <span>Hago webs, sistemas y agentes</span> <span>de WhatsApp para tu negocio.</span>
      </p>
      <div className="portada-escena">
        <Manos>
          <ManosTrazo />
        </Manos>
        <p className="respuesta">Cuéntame qué te quita tiempo.</p>
      </div>
      <Estado />
    </section>
  );
}

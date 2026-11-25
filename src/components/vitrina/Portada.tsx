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
        <Rise>Hi, I&apos;m</Rise>
        <Rise line={1}>Adrián.</Rise>
      </h1>
      {/* Dos frases que no se parten por dentro. Cada una es su propio bloque de texto: así el nombre, que en el
          primer pintado todavía asoma desde su borde, sigue siendo el texto más grande de la pantalla (el LCP). */}
      {/* Una sola promesa (propuesta 2026-11-24, apuesta A): lo que se vende hoy, y el botón a la prueba. */}
      <p className="sub">
        <span>Your WhatsApp answers and books,</span> <span>even when you&apos;re closed.</span>
      </p>
      <p className="portada-oferta">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- la portada no carga next/link (JS) */}
        <a className="btn btn-primary" href="/agente-whatsapp">
          Try it free for 7 days
        </a>
        <span className="portada-oferta-nota">US$99/month after. No card to start.</span>
      </p>
      <div className="portada-escena">
        <Manos>
          <ManosTrazo />
        </Manos>
        <p className="respuesta">Tell me what eats your time.</p>
      </div>
      <Estado />
    </section>
  );
}

"use client";

/**
 * El botón de la demo. Cuenta el clic en `demo_agent.signup_clicks` con un
 * beacon (sobrevive a la navegación); la atribución hacia el registro ya va
 * en el `href`, y `SignupAttribution` suma el evento `signup_click` y el
 * `Lead` del Pixel como en cualquier otro botón de registro.
 */
export default function DemoCta({ slug, href, label }: { slug: string; href: string; label: string }) {
  function beacon() {
    try {
      const url = `/api/demo/${slug}/click`;
      if (!navigator.sendBeacon?.(url)) void fetch(url, { method: "POST", keepalive: true });
    } catch {
      // Contar el clic nunca frena el registro.
    }
  }

  return (
    <a href={href} onClick={beacon} className="allok-btn allok-btn-sky w-full !px-4 text-[16px] sm:w-auto sm:!px-6 sm:text-[17px]">
      {label}
      <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 10h11m-4-4.5L15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

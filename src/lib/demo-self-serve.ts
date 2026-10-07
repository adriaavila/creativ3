/**
 * «Arma tu demo» del sitio: lo que no depende de red ni de base, para
 * probarlo solo.
 */

/** Redes que no dejan leer su página sin sesión: mejor decirlo que fallar a ciegas. */
export function walledSite(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "Instagram";
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host === "fb.me") return "Facebook";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "TikTok";
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return "WhatsApp";
  return null;
}

import { z } from "zod";
import { demoSlugBase, uniqueSlug } from "@/lib/demo-agent";
import { buildProfile } from "@/lib/demo-builder";
import { countDemosSince, demoSlugOwners, findDemoByWebsite, insertDemoAgent } from "@/lib/demo-db";
import { isDemoLlmConfigured } from "@/lib/demo-llm";
import { normalizeUrl } from "@/lib/demo-profile-build";
import { clientIp, createWindowLimiter } from "@/lib/demo-rate-limit";
import { walledSite } from "@/lib/demo-self-serve";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Por visitante: tres demos al día (cada una lee una web y llama al modelo). */
const perDay = createWindowLimiter(3, 24 * 60 * 60 * 1000);
/** Techo de gasto de todo el sitio: demos nuevas por 24 horas, contando las de la prospección. */
const SITE_DAILY_DEMOS = 150;

const bodySchema = z.object({
  website: z.string().trim().min(3).max(300),
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(60).optional().default(""),
});

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/**
 * «Arma tu demo»: un visitante pega la web de su negocio y en ~30 segundos
 * tiene `/demo/<slug>` con un agente que ya la conoce. Mismo camino que la
 * carga en lote (`lib/demo-builder`): lee la web con guarda de red interna,
 * extrae con el modelo y poda lo que no está en el texto. Si esa web ya tiene
 * demo, devuelve la que hay sin gastar otra llamada.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid", "Escribe el nombre de tu negocio y tu web.");
  const website = normalizeUrl(parsed.data.website);
  if (!website) return fail(422, "bad_url", "Esa dirección no parece una web. Prueba con algo como minegocio.com.");
  const walled = walledSite(new URL(website));
  if (walled) {
    return fail(422, "walled_site", `${walled} no deja leer perfiles desde afuera. Pega la web de tu negocio, o crea tu cuenta y pega el texto de tu perfil en «Llénalo por mí».`);
  }

  const existing = await findDemoByWebsite(website).catch(() => null);
  if (existing) return Response.json({ slug: existing.slug, reused: true });

  if (!isDemoLlmConfigured()) return fail(503, "unavailable", "Las demos no están disponibles en este momento. Puedes crear tu cuenta y probar a tu agente ahí.");
  if (!perDay.take(clientIp(request.headers))) return fail(429, "rate_limited", "Ya armaste varias demos hoy. Crea tu cuenta y sigue probando a tu agente ahí.");
  if ((await countDemosSince(24).catch(() => Number.POSITIVE_INFINITY)) >= SITE_DAILY_DEMOS) {
    return fail(429, "site_busy", "Hoy armamos muchas demos. Crea tu cuenta y prueba a tu agente ahí, es igual de rápido.");
  }

  const { name, city } = parsed.data;
  const built = await buildProfile({ name, website, city, sector: "", country: "" }, { extraPages: 2, timeoutMs: 35_000 });
  if (!built.ok) {
    if (built.reason === "unreadable") return fail(422, "unreadable", "No pudimos abrir esa web. Revisa la dirección o crea tu cuenta y pega tu información en «Llénalo por mí».");
    if (built.reason === "empty") return fail(422, "empty", "Tu web no dice servicios, horario ni dirección, así que tu agente no tendría qué contestar. Crea tu cuenta y cuéntale tú en «Llénalo por mí».");
    return fail(503, "model", "No pudimos armar la demo ahora. Prueba de nuevo en un momento.");
  }

  const owners = await demoSlugOwners();
  const slug = uniqueSlug(demoSlugBase(name, city), website, owners);
  await insertDemoAgent({ slug, businessName: name, sector: "", city, country: "", website, profile: built.profile });
  return Response.json({ slug, reused: false });
}

import { getDemoAgent } from "@/lib/demo-db";

export const dynamic = "force-dynamic";

/**
 * Lo que sabe una demo, para que el CRM llene «Tu negocio» de la cuenta que
 * nace desde ella (`/register?demo=<slug>`). Es lo mismo que la demo ya dice
 * en público al chatear: nada que no esté en la web del negocio.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/demo/[slug]/perfil">) {
  const agent = await getDemoAgent((await ctx.params).slug);
  if (!agent) return Response.json({ error: "Demo no encontrada." }, { status: 404 });
  const profile = { ...agent.profile, sourceUrls: undefined };
  return Response.json(
    { businessName: agent.businessName, website: agent.website, profile },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}

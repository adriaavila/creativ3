import { recordSignupClick } from "@/lib/demo-db";
import { clientIp, createWindowLimiter } from "@/lib/demo-rate-limit";

export const dynamic = "force-dynamic";

/** Un clic cuenta una vez por visitante y demo cada 10 minutos. */
const perVisitor = createWindowLimiter(1, 10 * 60 * 1000);

/**
 * El beacon de «Crear mi cuenta con este agente»: suma `signup_clicks`.
 * Responde 204 pase lo que pase; el navegador no espera nada de aquí.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/demo/[slug]/click">) {
  const { slug } = await ctx.params;
  if (perVisitor.take(`${clientIp(request.headers)}:${slug}`)) {
    await recordSignupClick(slug);
  }
  return new Response(null, { status: 204 });
}

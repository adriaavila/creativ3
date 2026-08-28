import { neon } from "@/lib/db";

// Coolify's container health check. No auth and no secrets: it only reports
// whether the process is up and can reach its database.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await neon(process.env.DATABASE_URL ?? "")`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}

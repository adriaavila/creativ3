import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { OPS_COOKIE_NAME } from "@/lib/ops-auth";

export const runtime = "nodejs";

function matches(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const configuredPassword = process.env.OPS_ACCESS_PASSWORD;
  const sessionSecret = process.env.OPS_SESSION_SECRET;
  const requestedNext = String(form.get("next") ?? "/ops");
  const nextPath = requestedNext.startsWith("/ops") ? requestedNext : "/ops";

  if (!configuredPassword || !sessionSecret) {
    return Response.json({ error: "Ops access is not configured." }, { status: 503 });
  }

  if (!matches(password, configuredPassword)) {
    const retryUrl = new URL("/ops-login", request.url);
    retryUrl.searchParams.set("error", "1");
    retryUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(retryUrl, 303);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set(OPS_COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
    priority: "high",
  });
  return response;
}

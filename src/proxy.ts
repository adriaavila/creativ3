import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE_NAME, verifyOpsSessionToken } from "@/lib/ops-session";

export default function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/api/ops/login" ||
    request.nextUrl.pathname === "/api/ops/logout"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.OPS_SESSION_SECRET;
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value;
  const authenticated = Boolean(secret && verifyOpsSessionToken(token, secret));

  if (authenticated) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/ops")) {
    return new NextResponse(null, { status: 401 });
  }

  const loginUrl = new URL("/ops-login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/ops/:path*", "/api/ops/:path*"],
};

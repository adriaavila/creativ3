import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE_NAME, verifyOpsSessionToken } from "@/lib/ops-session";

export default function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.split("/")[1] === "en" ? "en" : "es";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-allok-locale", locale);

  if (
    request.nextUrl.pathname === "/api/ops/login" ||
    request.nextUrl.pathname === "/api/ops/logout"
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const secret = process.env.OPS_SESSION_SECRET;
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value;
  const authenticated = Boolean(secret && verifyOpsSessionToken(token, secret));

  if (authenticated) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (request.nextUrl.pathname.startsWith("/api/ops")) {
    return new NextResponse(null, { status: 401 });
  }

  if (
    request.nextUrl.pathname.startsWith("/ops") ||
    request.nextUrl.pathname.startsWith("/api/ops")
  ) {
    const loginUrl = new URL("/ops-login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

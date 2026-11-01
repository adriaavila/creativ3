import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE_NAME, opsSessionKey, verifyOpsSessionToken } from "@/lib/ops-session";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/api/ops/login" ||
    pathname === "/api/ops/logout"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.OPS_SESSION_SECRET;
  const password = process.env.OPS_ACCESS_PASSWORD;
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value;
  const key = secret && password ? opsSessionKey(secret, password) : null;
  const authenticated = Boolean(key && verifyOpsSessionToken(token, key));

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/ops")) {
    return new NextResponse(null, { status: 401 });
  }

  const loginUrl = new URL("/ops-login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

// Only the ops area needs the gate. Running the proxy on public pages cost a
// middleware invocation per visit on Vercel for nothing.
export const config = {
  matcher: ["/ops/:path*", "/api/ops/:path*"],
};

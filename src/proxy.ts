import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "creativv_ops_session";

export default function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/api/ops/login" ||
    request.nextUrl.pathname === "/api/ops/logout"
  ) {
    return NextResponse.next();
  }

  const expected = process.env.OPS_SESSION_SECRET;
  const authenticated = Boolean(
    expected && request.cookies.get(COOKIE_NAME)?.value === expected,
  );

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

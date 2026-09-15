import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE_NAME, verifyOpsSessionToken } from "@/lib/ops-session";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // The house speaks Spanish: `/`, `/rei`, `/vocero`, `/agencia` and the
  // WhatsApp onboarding are all Spanish, so Spanish is the default. English
  // is the exception — the portfolio, and anything under `/en`.
  const segment = pathname.split("/")[1];
  const ENGLISH_SECTIONS = new Set(["en", "portfolio", "work", "lab", "writing", "projects"]);
  const locale = ENGLISH_SECTIONS.has(segment) ? "en" : "es";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-allok-locale", locale);

  if (
    pathname === "/api/ops/login" ||
    pathname === "/api/ops/logout"
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const secret = process.env.OPS_SESSION_SECRET;
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value;
  const authenticated = Boolean(secret && verifyOpsSessionToken(token, secret));

  if (authenticated) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/ops")) {
    return new NextResponse(null, { status: 401 });
  }

  if (pathname === "/ops" || pathname.startsWith("/ops/")) {
    const loginUrl = new URL("/ops-login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

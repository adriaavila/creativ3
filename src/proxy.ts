import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const handler = clerkMiddleware(async (auth) => {
  await auth.protect();
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return handler(request, event);
}

export const config = {
  matcher: [
    "/ops/growth/:path*",
    "/api/ops/growth/:path*",
  ],
};

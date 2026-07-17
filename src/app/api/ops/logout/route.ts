import { NextResponse } from "next/server";
import { OPS_COOKIE_NAME } from "@/lib/ops-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/ops-login", request.url), 303);
  response.cookies.set(OPS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

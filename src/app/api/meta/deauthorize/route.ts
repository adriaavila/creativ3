import { NextRequest, NextResponse } from "next/server";
import {
  forwardMetaAccountLifecycleToN8n,
  verifyMetaSignedRequest,
} from "@/lib/meta/server";
import { markWhatsAppConnectionsDeauthorized } from "@/lib/whatsapp-connections-db";

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "Meta callback is not configured." }, { status: 503 });
  }

  const formData = await req.formData();
  const signedRequest = formData.get("signed_request");
  if (typeof signedRequest !== "string") {
    return NextResponse.json({ error: "signed_request is required." }, { status: 400 });
  }

  const payload = verifyMetaSignedRequest(signedRequest, appSecret);
  if (!payload?.user_id) {
    return NextResponse.json({ error: "Invalid signed_request." }, { status: 401 });
  }

  const [forwarded, database] = await Promise.allSettled([
    forwardMetaAccountLifecycleToN8n({
      event: "meta_app_deauthorized",
      userId: payload.user_id,
      issuedAt: payload.issued_at,
      receivedAt: new Date().toISOString(),
    }),
    markWhatsAppConnectionsDeauthorized(payload.user_id),
  ]);

  if (
    forwarded.status === "rejected" ||
    database.status === "rejected" ||
    !forwarded.value.ok
  ) {
    return NextResponse.json(
      {
        error: "Could not process deauthorization.",
        forwarded_status: forwarded.status === "fulfilled" ? forwarded.value.status : 500,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  forwardMetaAccountLifecycleToN8n,
  verifyMetaSignedRequest,
} from "@/lib/meta/server";
import { deleteWhatsAppConnectionsForMetaUser } from "@/lib/whatsapp-connections-db";

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!appSecret || !appUrl) {
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
      event: "meta_user_data_deletion_requested",
      userId: payload.user_id,
      issuedAt: payload.issued_at,
      receivedAt: new Date().toISOString(),
    }),
    deleteWhatsAppConnectionsForMetaUser(payload.user_id),
  ]);

  if (
    forwarded.status === "rejected" ||
    database.status === "rejected" ||
    !forwarded.value.ok
  ) {
    return NextResponse.json(
      {
        error: "Could not process data deletion.",
        forwarded_status: forwarded.status === "fulfilled" ? forwarded.value.status : 500,
      },
      { status: 502 },
    );
  }

  const confirmationCode = crypto.randomBytes(12).toString("hex");
  const statusUrl = new URL("/eliminacion-de-datos", appUrl);
  statusUrl.searchParams.set("confirmation_code", confirmationCode);

  return NextResponse.json({
    url: statusUrl.toString(),
    confirmation_code: confirmationCode,
  });
}

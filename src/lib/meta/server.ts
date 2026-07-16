import crypto from "node:crypto";
import { META_REQUIRED_PERMISSIONS, type MetaEmbeddedSignupPayload } from "./embedded-signup";

const DEFAULT_GRAPH_VERSION = "v25.0";
const REQUIRED_CONFIG_ENV = ["META_APP_ID", "META_CONFIG_ID"] as const;
const REQUIRED_EXCHANGE_ENV = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CONFIG_ID",
  "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
] as const;

export const META_SIGNUP_STATE_COOKIE = "meta_embedded_signup_state";

export const META_ENV_CHECKS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CONFIG_ID",
  "META_GRAPH_VERSION",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_WEBHOOK_CALLBACK_URL",
  "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
  "APP_URL",
] as const;

type GraphErrorBody = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

export class MetaGraphRequestError extends Error {
  constructor(
    readonly requestName: string,
    readonly status: number,
    readonly body: GraphErrorBody | { raw: string },
  ) {
    super(`Meta request failed: ${requestName}`);
  }
}

export type MetaDebugTokenData = {
  app_id?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  granular_scopes?: Array<{
    scope?: string;
    target_ids?: string[];
  }>;
  is_valid?: boolean;
  issued_at?: number;
  scopes?: string[];
  type?: string;
  user_id?: string;
};

export type TokenMetadata = {
  app_id?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  granular_scopes?: MetaDebugTokenData["granular_scopes"];
  is_valid?: boolean;
  issued_at?: number;
  scopes: string[];
  token_type?: string;
  type?: string;
  user_id?: string;
};

type ExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type SubscribeResponse = {
  success?: boolean;
};

export type MetaWhatsAppPhoneProfile = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  name_status?: string;
};

type N8nForwardResponse = {
  ok: boolean;
  status: number;
  body?: unknown;
};

export type MetaSignedRequestPayload = {
  algorithm?: string;
  issued_at?: number;
  user_id?: string;
  [key: string]: unknown;
};

export function getGraphVersion() {
  const version = process.env.META_GRAPH_VERSION?.trim();
  if (!version) return DEFAULT_GRAPH_VERSION;
  return version.startsWith("v") ? version : `v${version}`;
}

export function getMissingEnv(keys: readonly string[]) {
  return keys.filter((key) => !process.env[key]?.trim());
}

export function getPublicMetaConfig() {
  const missing = getMissingEnv(REQUIRED_CONFIG_ENV);
  if (missing.length > 0) {
    return { missing };
  }

  return {
    missing,
    config: {
      appId: process.env.META_APP_ID as string,
      configId: process.env.META_CONFIG_ID as string,
      graphVersion: getGraphVersion(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL,
    },
  };
}

export function getExchangeEnv() {
  const missing = getMissingEnv(REQUIRED_EXCHANGE_ENV);
  if (missing.length > 0) {
    return { missing };
  }

  return {
    missing,
    env: {
      appId: process.env.META_APP_ID as string,
      appSecret: process.env.META_APP_SECRET as string,
      configId: process.env.META_CONFIG_ID as string,
      graphVersion: getGraphVersion(),
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL as string,
      n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
      appUrl: process.env.APP_URL,
      webhookCallbackUrl: process.env.META_WEBHOOK_CALLBACK_URL,
    },
  };
}

export function validateSignupPayload(input: unknown): {
  payload?: MetaEmbeddedSignupPayload;
  errors: string[];
} {
  if (!input || typeof input !== "object") {
    return { errors: ["payload must be an object"] };
  }

  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  const required = ["code", "waba_id", "phone_number_id"] as const;

  for (const key of required) {
    if (typeof value[key] !== "string" || !value[key]?.toString().trim()) {
      errors.push(`${key} is required`);
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      code: value.code as string,
      waba_id: value.waba_id as string,
      phone_number_id: value.phone_number_id as string,
      business_id: stringOrUndefined(value.business_id),
      state: stringOrUndefined(value.state),
      client: stringOrUndefined(value.client),
      user_id: stringOrUndefined(value.user_id),
      team_id: stringOrUndefined(value.team_id),
      account_id: stringOrUndefined(value.account_id),
      session: sanitizeSession(value.session),
    },
  };
}

export async function exchangeCodeForBusinessToken(
  code: string,
  env: NonNullable<ReturnType<typeof getExchangeEnv>["env"]>,
) {
  const data = await graphRequest<ExchangeResponse>({
    requestName: "exchange_code",
    graphVersion: env.graphVersion,
    path: "oauth/access_token",
    searchParams: {
      client_id: env.appId,
      client_secret: env.appSecret,
      code,
    },
  });

  if (!data.access_token) {
    throw new MetaGraphRequestError("exchange_code", 502, {
      message: "Meta did not return an access token.",
    });
  }

  return data;
}

export async function debugBusinessToken(
  businessToken: string,
  env: NonNullable<ReturnType<typeof getExchangeEnv>["env"]>,
) {
  const data = await graphRequest<{ data?: MetaDebugTokenData }>({
    requestName: "debug_token",
    graphVersion: env.graphVersion,
    path: "debug_token",
    searchParams: {
      input_token: businessToken,
      access_token: `${env.appId}|${env.appSecret}`,
    },
  });

  return data.data ?? {};
}

export async function subscribeWabaToApp(
  wabaId: string,
  businessToken: string,
  graphVersion: string,
) {
  return graphRequest<SubscribeResponse>({
    requestName: "subscribe_waba",
    graphVersion,
    path: `${encodeURIComponent(wabaId)}/subscribed_apps`,
    method: "POST",
    accessToken: businessToken,
  });
}

export async function getWhatsAppPhoneProfile(
  phoneNumberId: string,
  businessToken: string,
  graphVersion: string,
) {
  return graphRequest<MetaWhatsAppPhoneProfile>({
    requestName: "get_whatsapp_phone_profile",
    graphVersion,
    path: encodeURIComponent(phoneNumberId),
    accessToken: businessToken,
    searchParams: {
      fields: "id,display_phone_number,verified_name,quality_rating,name_status",
    },
  });
}

export function buildTokenMetadata(
  exchange: ExchangeResponse,
  debugData: MetaDebugTokenData,
): TokenMetadata {
  return {
    app_id: debugData.app_id,
    application: debugData.application,
    data_access_expires_at: debugData.data_access_expires_at,
    expires_at: debugData.expires_at,
    granular_scopes: debugData.granular_scopes,
    is_valid: debugData.is_valid,
    issued_at: debugData.issued_at,
    scopes: debugData.scopes ?? [],
    token_type: exchange.token_type,
    type: debugData.type,
    user_id: debugData.user_id,
  };
}

export function getMissingTokenPermissions(debugData: MetaDebugTokenData) {
  const granted = new Set(debugData.scopes ?? []);

  for (const granularScope of debugData.granular_scopes ?? []) {
    if (granularScope.scope) granted.add(granularScope.scope);
  }

  return META_REQUIRED_PERMISSIONS.filter((permission) => !granted.has(permission));
}

export function verifyMetaSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSignature, encodedPayload, ...extraParts] = signedRequest.split(".");
  if (!encodedSignature || !encodedPayload || extraParts.length > 0) return undefined;

  const received = decodeBase64Url(encodedSignature);
  const expected = crypto.createHmac("sha256", appSecret).update(encodedPayload).digest();
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload).toString("utf8"),
    ) as MetaSignedRequestPayload;

    if (
      payload.algorithm &&
      payload.algorithm.toUpperCase().replace(/[^A-Z0-9]/g, "") !== "HMACSHA256"
    ) {
      return undefined;
    }

    return payload;
  } catch {
    return undefined;
  }
}

export async function forwardMetaAccountLifecycleToN8n(input: {
  event: "meta_app_deauthorized" | "meta_user_data_deletion_requested";
  userId: string;
  issuedAt?: number;
  receivedAt: string;
}) {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url || !secret) {
    return {
      ok: false,
      status: 503,
      body: { error: "Meta lifecycle forwarding is not configured." },
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: buildN8nHeaders(secret),
    body: JSON.stringify({
      event: input.event,
      user_id: input.userId,
      issued_at: input.issuedAt,
      received_at: input.receivedAt,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await readSafeBody(response),
  };
}

export async function forwardConnectedAccountToN8n(input: {
  payload: MetaEmbeddedSignupPayload;
  businessToken: string;
  tokenMetadata: TokenMetadata;
  subscribeResult: SubscribeResponse;
  env: NonNullable<ReturnType<typeof getExchangeEnv>["env"]>;
  connectedAt: string;
}): Promise<N8nForwardResponse> {
  const response = await fetch(input.env.n8nWebhookUrl, {
    method: "POST",
    headers: buildN8nHeaders(input.env.n8nWebhookSecret),
    body: JSON.stringify({
      event: "meta_embedded_signup_connected",
      connected_account: {
        waba_id: input.payload.waba_id,
        phone_number_id: input.payload.phone_number_id,
        business_id: input.payload.business_id,
        business_token: input.businessToken,
        token_metadata: input.tokenMetadata,
        connected_at: input.connectedAt,
        owner: {
          client: input.payload.client,
          user_id: input.payload.user_id,
          team_id: input.payload.team_id,
          account_id: input.payload.account_id,
        },
        status: input.subscribeResult.success ? "subscribed" : "connected",
      },
      signup: {
        code: input.payload.code,
        state: input.payload.state,
        session: input.payload.session,
      },
      meta: {
        app_id: input.env.appId,
        config_id: input.env.configId,
        graph_version: input.env.graphVersion,
        webhook_callback_url: input.env.webhookCallbackUrl,
        app_url: input.env.appUrl,
        subscribe_succeeded: input.subscribeResult.success === true,
      },
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await readSafeBody(response),
  };
}

export async function sendPreparedTextMessage(input: {
  phoneNumberId: string;
  businessToken: string;
  to: string;
  body: string;
  graphVersion?: string;
}) {
  return graphRequest({
    requestName: "send_test_message",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/messages`,
    method: "POST",
    accessToken: input.businessToken,
    body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: {
        body: input.body,
      },
    },
  });
}

export async function registerPhoneNumber(input: {
  phoneNumberId: string;
  businessToken: string;
  pin: string;
  graphVersion?: string;
}) {
  return graphRequest<SubscribeResponse>({
    requestName: "register_phone_number",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/register`,
    method: "POST",
    accessToken: input.businessToken,
    body: {
      messaging_product: "whatsapp",
      pin: input.pin,
    },
  });
}

export async function deregisterPhoneNumber(input: {
  phoneNumberId: string;
  businessToken: string;
  graphVersion?: string;
}) {
  return graphRequest<SubscribeResponse>({
    requestName: "deregister_phone_number",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/deregister`,
    method: "POST",
    accessToken: input.businessToken,
  });
}

export function safeMetaError(error: unknown) {
  if (error instanceof MetaGraphRequestError) {
    return {
      meta_request: error.requestName,
      status: error.status,
      body: error.body,
    };
  }

  return undefined;
}

async function graphRequest<T>(input: {
  requestName: string;
  graphVersion: string;
  path: string;
  method?: "GET" | "POST";
  accessToken?: string;
  searchParams?: Record<string, string>;
  body?: unknown;
}): Promise<T> {
  const url = new URL(
    `https://graph.facebook.com/${input.graphVersion}/${input.path.replace(/^\/+/, "")}`,
  );

  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {};
  if (input.accessToken) headers.Authorization = `Bearer ${input.accessToken}`;
  if (input.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method: input.method ?? "GET",
    headers,
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
  const body = await readSafeBody(response);

  if (!response.ok) {
    throw new MetaGraphRequestError(input.requestName, response.status, normalizeGraphError(body));
  }

  return body as T;
}

function buildN8nHeaders(secret?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers["x-servicioscreativos-secret"] = secret;
  }

  return headers;
}

async function readSafeBody(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

function normalizeGraphError(body: unknown): GraphErrorBody | { raw: string } {
  if (!body || typeof body !== "object") return { raw: String(body) };

  const error = "error" in body ? (body as { error?: unknown }).error : body;
  if (!error || typeof error !== "object") return { raw: JSON.stringify(body).slice(0, 500) };

  const value = error as Record<string, unknown>;
  return {
    message: stringOrUndefined(value.message),
    type: stringOrUndefined(value.type),
    code: numberOrUndefined(value.code),
    error_subcode: numberOrUndefined(value.error_subcode),
    fbtrace_id: stringOrUndefined(value.fbtrace_id),
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

function sanitizeSession(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  const session = value as Record<string, unknown>;
  return {
    event: stringOrUndefined(session.event),
    version: numberOrUndefined(session.version),
    session_id: stringOrUndefined(session.session_id),
    current_step: stringOrUndefined(session.current_step),
    error_code: stringOrUndefined(session.error_code),
    error_message: stringOrUndefined(session.error_message),
    timestamp: stringOrUndefined(session.timestamp),
    received_at: stringOrUndefined(session.received_at),
  };
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

import crypto from "node:crypto";
import { META_REQUIRED_PERMISSIONS, type MetaEmbeddedSignupPayload } from "./embedded-signup";

const DEFAULT_GRAPH_VERSION = "v25.0";
const REQUIRED_CONFIG_ENV = ["META_APP_ID", "META_CONFIG_ID"] as const;
const REQUIRED_EXCHANGE_ENV = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CONFIG_ID",
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

export type MetaMessageResponse = {
  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;
};

export type MetaMessageTemplate = {
  name: string;
  language: string;
  category: string;
  bodyText: string;
  variableCount: number;
  headerText?: string;
};

export type ResolvedMetaSignupPayload = MetaEmbeddedSignupPayload & {
  waba_id: string;
  phone_number_id: string;
};

type ValidatedMetaSignupPayload = Omit<
  MetaEmbeddedSignupPayload,
  "waba_id" | "phone_number_id"
> & {
  waba_id?: string;
  phone_number_id?: string;
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
    },
  };
}

export function validateSignupPayload(input: unknown): {
  payload?: ValidatedMetaSignupPayload;
  errors: string[];
} {
  if (!input || typeof input !== "object") {
    return { errors: ["payload must be an object"] };
  }

  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  const required = ["code"] as const;

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
      waba_id: stringOrUndefined(value.waba_id),
      phone_number_id: stringOrUndefined(value.phone_number_id),
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

export async function resolveMetaSignupConnection(input: {
  payload: ValidatedMetaSignupPayload;
  debugData: MetaDebugTokenData;
  businessToken: string;
  graphVersion: string;
}): Promise<{
  payload: ResolvedMetaSignupPayload;
  phoneProfile: MetaWhatsAppPhoneProfile;
} | null> {
  if (input.payload.waba_id && input.payload.phone_number_id) {
    const phoneProfile = await getWhatsAppPhoneProfile(
      input.payload.phone_number_id,
      input.businessToken,
      input.graphVersion,
    );
    return {
      payload: {
        ...input.payload,
        waba_id: input.payload.waba_id,
        phone_number_id: input.payload.phone_number_id,
      },
      phoneProfile,
    };
  }

  const authorizedWabaIds = new Set<string>();
  if (input.payload.waba_id) authorizedWabaIds.add(input.payload.waba_id);

  for (const granularScope of input.debugData.granular_scopes ?? []) {
    if (!granularScope.scope?.startsWith("whatsapp_business_")) continue;
    for (const targetId of granularScope.target_ids ?? []) authorizedWabaIds.add(targetId);
  }

  const candidates: Array<{
    wabaId: string;
    phone: MetaWhatsAppPhoneProfile;
  }> = [];

  for (const wabaId of authorizedWabaIds) {
    try {
      const response = await graphRequest<{ data?: MetaWhatsAppPhoneProfile[] }>({
        requestName: "discover_whatsapp_phone_numbers",
        graphVersion: input.graphVersion,
        path: `${encodeURIComponent(wabaId)}/phone_numbers`,
        accessToken: input.businessToken,
        searchParams: {
          fields: "id,display_phone_number,verified_name,quality_rating,name_status",
        },
      });

      for (const phone of response.data ?? []) {
        if (!phone.id) continue;
        candidates.push({ wabaId, phone });
      }
    } catch (error) {
      if (!(error instanceof MetaGraphRequestError)) throw error;
    }
  }

  const selected = input.payload.phone_number_id
    ? candidates.find((candidate) => candidate.phone.id === input.payload.phone_number_id)
    : candidates.length === 1
      ? candidates[0]
      : undefined;

  if (!selected?.phone.id) return null;

  return {
    payload: {
      ...input.payload,
      waba_id: selected.wabaId,
      phone_number_id: selected.phone.id,
    },
    phoneProfile: selected.phone,
  };
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
    signal: AbortSignal.timeout(8000),
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
  return graphRequest<MetaMessageResponse>({
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

export async function sendMediaMessage(input: {
  phoneNumberId: string;
  businessToken: string;
  to: string;
  type: "audio" | "document" | "image" | "sticker" | "video";
  mediaId?: string;
  link?: string;
  caption?: string;
  filename?: string;
  graphVersion?: string;
}) {
  return graphRequest<MetaMessageResponse>({
    requestName: "send_media_message",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/messages`,
    method: "POST",
    accessToken: input.businessToken,
    body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: input.type,
      [input.type]: {
        ...(input.mediaId ? { id: input.mediaId } : {}),
        ...(input.link ? { link: input.link } : {}),
        ...(input.caption ? { caption: input.caption } : {}),
        ...(input.filename ? { filename: input.filename } : {}),
      },
    },
  });
}

export async function markWhatsAppMessageAsRead(input: {
  phoneNumberId: string;
  businessToken: string;
  messageId: string;
  graphVersion?: string;
}) {
  await graphRequest<SubscribeResponse>({
    requestName: "mark_whatsapp_message_as_read",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/messages`,
    method: "POST",
    accessToken: input.businessToken,
    body: {
      messaging_product: "whatsapp",
      status: "read",
      message_id: input.messageId,
    },
  });
}

export async function sendTemplateMessage(input: {
  phoneNumberId: string;
  businessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
  graphVersion?: string;
}) {
  return graphRequest({
    requestName: "send_template_message",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.phoneNumberId)}/messages`,
    method: "POST",
    accessToken: input.businessToken,
    body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        ...(input.components ? { components: input.components } : {}),
      },
    },
  });
}

export async function listMessageTemplates(input: {
  wabaId: string;
  businessToken: string;
  graphVersion?: string;
}): Promise<MetaMessageTemplate[]> {
  const response = await graphRequest<{ data?: unknown[] }>({
    requestName: "list_message_templates",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.wabaId)}/message_templates`,
    accessToken: input.businessToken,
    searchParams: {
      status: "APPROVED",
      limit: "100",
      fields: "name,language,status,category,components",
    },
  });

  return (Array.isArray(response.data) ? response.data : [])
    .map(mapMessageTemplate)
    .filter((template): template is MetaMessageTemplate => template !== null);
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

export async function unsubscribeWabaFromApp(input: {
  wabaId: string;
  businessToken: string;
  graphVersion?: string;
}) {
  return graphRequest<SubscribeResponse>({
    requestName: "unsubscribe_waba",
    graphVersion: input.graphVersion ?? getGraphVersion(),
    path: `${encodeURIComponent(input.wabaId)}/subscribed_apps`,
    method: "DELETE",
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
  method?: "DELETE" | "GET" | "POST";
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

function mapMessageTemplate(value: unknown): MetaMessageTemplate | null {
  if (!value || typeof value !== "object") return null;

  const template = value as Record<string, unknown>;
  const name = stringOrUndefined(template.name);
  const language = stringOrUndefined(template.language);
  const category = stringOrUndefined(template.category);
  const status = stringOrUndefined(template.status);
  if (!name || !language || !category || status?.toUpperCase() !== "APPROVED") return null;

  let bodyText = "";
  let headerText: string | undefined;
  const components = Array.isArray(template.components) ? template.components : [];

  for (const value of components) {
    if (!value || typeof value !== "object") continue;
    const component = value as Record<string, unknown>;
    const type = stringOrUndefined(component.type)?.toUpperCase();
    const text = typeof component.text === "string" ? component.text : undefined;

    if (type === "BODY" && text !== undefined) bodyText = text;
    if (type === "HEADER" && text !== undefined) headerText = text;
  }

  const result: MetaMessageTemplate = {
    name,
    language,
    category,
    bodyText,
    variableCount: countTemplateVariables(bodyText),
  };
  if (headerText !== undefined) result.headerText = headerText;
  return result;
}

function countTemplateVariables(text: string) {
  return text.match(/\{\{\d+\}\}/g)?.length ?? 0;
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

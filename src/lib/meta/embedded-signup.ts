export const META_MESSAGE_ORIGINS = [
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://business.facebook.com",
] as const;

export function isMetaMessageOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      (url.hostname === "facebook.com" || url.hostname.endsWith(".facebook.com"))
    );
  } catch {
    return false;
  }
}

// Only these two are grantable by a WhatsApp Embedded Signup config; Meta does
// not offer business_management there, and requiring it 403s every onboarding.
export const META_REQUIRED_PERMISSIONS = [
  "whatsapp_business_management",
  "whatsapp_business_messaging",
] as const;

export type MetaSignupSession = {
  event?: string;
  version?: number;
  session_id?: string;
  current_step?: string;
  error_code?: string;
  error_message?: string;
  timestamp?: string;
  received_at?: string;
};

/**
 * Which Embedded Signup variation produced this connection. They are not
 * interchangeable: coexistence keeps the number inside the client's WhatsApp
 * Business App and must never be /register-ed, while a plain Cloud API number
 * stays PENDING until it is.
 */
export type MetaConnectionMode = "META_CLOUD_API" | "META_COEXISTENCE";

export const META_CONNECTION_MODES: readonly MetaConnectionMode[] = [
  "META_CLOUD_API",
  "META_COEXISTENCE",
];

export type MetaEmbeddedSignupPayload = {
  code: string;
  waba_id: string;
  phone_number_id: string;
  connection_mode?: MetaConnectionMode;
  business_id?: string;
  state?: string;
  client?: string;
  user_id?: string;
  team_id?: string;
  account_id?: string;
  session?: MetaSignupSession;
};

export type MetaEmbeddedSignupConfig = {
  appId: string;
  /** Coexistence variation — the default for a client already on WhatsApp Business App. */
  configId: string;
  /** Plain Cloud API variation. Absent until META_CONFIG_ID_CLOUD_API is set in Meta. */
  cloudApiConfigId?: string;
  graphVersion: string;
  appUrl?: string;
  state: string;
  allowedMessageOrigins: readonly string[];
  requiredPermissions: readonly string[];
  connection: {
    wabaId: string;
    phoneNumberId: string;
    displayPhoneNumber: string | null;
    status: string;
    connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  } | null;
};

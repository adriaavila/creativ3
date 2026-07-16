export const META_MESSAGE_ORIGINS = [
  "https://www.facebook.com",
  "https://web.facebook.com",
] as const;

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

export type MetaEmbeddedSignupPayload = {
  code: string;
  waba_id: string;
  phone_number_id: string;
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
  configId: string;
  graphVersion: string;
  appUrl?: string;
  state: string;
  allowedMessageOrigins: readonly string[];
  requiredPermissions: readonly string[];
};

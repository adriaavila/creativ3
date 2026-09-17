import {
  getGraphVersion,
  listWabaSubscribedApps,
  safeMetaError,
  subscribeWabaToApp,
} from "@/lib/meta/server";
import {
  clearWhatsAppCrmHandover,
  recordWhatsAppCrmHandover,
  recordWhatsAppCrmHandoverState,
} from "@/lib/whatsapp-connections-db";
import {
  getDestinationSecrets,
  matchesDestinationSubscription,
} from "@/lib/handover/destinations";
import { pushCredentials, runProvisionSmokeTest } from "@/lib/handover/provision";

export type HandoverInput = {
  destinationSlug: string;
  externalRef: string | null;
  client?: string | null;
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  businessToken: string;
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  status: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  /** Signed onboardings must use an automated destination. */
  requireProvision?: boolean;
};

export type HandoverResult =
  | {
      ok: true;
      webhookUrl: string;
      organizationName: string | null;
      credentialsDelivered: boolean;
    }
  | {
      ok: false;
      error: string;
      step: "config" | "token" | "credentials" | "webhook" | "verification" | "smoke_test" | "persistencia";
      credentialsDelivered: boolean;
      status?: number;
    };

/**
 * Un único handover para Embedded Signup, reintentos y Ops.
 *
 * El orden es deliberado: credenciales primero, webhook después. Las llamadas
 * a Meta son idempotentes y los fallos transitorios se reintentan dos veces.
 */
export async function handoverConnectionToDestination(input: HandoverInput): Promise<HandoverResult> {
  await recordWhatsAppCrmHandoverState({
    wabaId: input.wabaId,
    phoneNumberId: input.phoneNumberId,
    provider: input.destinationSlug,
    organizationId: input.externalRef,
    state: input.requireProvision ? "provision_pending" : "webhook_pending",
  }).catch(() => undefined);

  let result: HandoverResult = {
    ok: false,
    step: "config",
    error: "No se pudo iniciar la entrega.",
    credentialsDelivered: false,
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = await handoverOnce(input);
    if (result.ok) return result;
    if (!isRetryable(result) || attempt === 2) return markFailure(input, result);
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  return markFailure(input, result);
}

async function markFailure(
  input: HandoverInput,
  result: Extract<HandoverResult, { ok: false }>,
): Promise<Extract<HandoverResult, { ok: false }>> {
  await recordWhatsAppCrmHandoverState({
    wabaId: input.wabaId,
    phoneNumberId: input.phoneNumberId,
    provider: input.destinationSlug,
    organizationId: input.externalRef,
    state: result.step === "webhook" || result.step === "verification" || result.step === "persistencia"
      ? "webhook_failed"
      : result.step === "smoke_test"
        ? "smoke_test_pending"
      : "provision_failed",
    error: result.error,
  }).catch(() => undefined);
  return result;
}

async function handoverOnce(input: HandoverInput): Promise<HandoverResult> {
  const destination = await getDestinationSecrets(input.destinationSlug).catch(() => null);
  if (!destination) {
    return failure("config", "El destino de WhatsApp no está configurado.");
  }
  if (input.requireProvision && (!destination.provisionUrl || !destination.provisionSecret)) {
    return failure("config", `El destino ${destination.label} no tiene provisión automática configurada.`);
  }

  try {
    await listWabaSubscribedApps({
      wabaId: input.wabaId,
      businessToken: input.businessToken,
      graphVersion: getGraphVersion(),
    });
  } catch (error) {
    return {
      ...failure("token", metaErrorMessage(error, "Meta rechazó el token del cliente.")),
      status: safeMetaError(error)?.status ?? 502,
    };
  }

  let webhookUrl = destination.webhookUrl;
  let organizationName: string | null = destination.label;
  let credentialsDelivered = false;
  let smokeTestUrl: string | null = null;

  if (destination.provisionUrl && destination.provisionSecret) {
    const provisioned = await pushCredentials({
      url: destination.provisionUrl,
      secret: destination.provisionSecret,
      externalRef: input.externalRef,
      client: input.client ?? input.destinationSlug,
      businessId: input.businessId,
      wabaId: input.wabaId,
      phoneNumberId: input.phoneNumberId,
      token: input.businessToken,
      displayPhoneNumber: input.displayPhoneNumber,
      verifiedName: input.verifiedName,
      connectionMode: input.connectionMode,
      status: input.status,
    });
    if (!provisioned.ok) {
      return {
        ...failure("credentials", provisioned.error ?? "La app destino no pudo guardar las credenciales."),
        credentialsDelivered: false,
        status: provisioned.status,
      };
    }
    credentialsDelivered = true;
    organizationName = provisioned.organizationName ?? destination.label;
    webhookUrl = provisioned.webhookUrl ?? destination.webhookUrl;
    smokeTestUrl = provisioned.smokeTestUrl;
  }

  try {
    const subscription = await subscribeWabaToApp(
      input.wabaId,
      input.businessToken,
      getGraphVersion(),
      { callbackUri: webhookUrl, verifyToken: destination.verifyToken },
    );
    if (subscription.success !== true) throw new Error("subscription_not_confirmed");
  } catch (error) {
    return {
      ...failure("webhook", metaErrorMessage(error, `Meta rechazó el webhook de ${destination.label}.`)),
      credentialsDelivered,
      status: safeMetaError(error)?.status ?? 502,
    };
  }

  let subscriptions;
  try {
    subscriptions = await listWabaSubscribedApps({
      wabaId: input.wabaId,
      businessToken: input.businessToken,
      graphVersion: getGraphVersion(),
    });
  } catch (error) {
    return {
      ...failure("verification", metaErrorMessage(error, "No se pudo verificar la suscripción en Meta.")),
      credentialsDelivered,
      status: safeMetaError(error)?.status ?? 502,
    };
  }

  if (!subscriptions.some((subscription) =>
    matchesDestinationSubscription(subscription, process.env.META_APP_ID?.trim(), webhookUrl),
  )) {
    return {
      ...failure("verification", `Meta no confirmó el webhook de ${destination.label}.`),
      credentialsDelivered,
      status: 502,
    };
  }

  if (smokeTestUrl && destination.provisionSecret) {
    const smokeTest = await runProvisionSmokeTest({
      url: smokeTestUrl,
      secret: destination.provisionSecret,
      externalRef: input.externalRef,
    });
    if (!smokeTest.ok) {
      await recordWhatsAppCrmHandover({
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        provider: destination.slug,
        organizationId: input.externalRef,
        organizationName,
        webhookUri: webhookUrl,
        connectedAt: new Date().toISOString(),
        state: "smoke_test_pending",
      }).catch(() => undefined);
      return {
        ...failure("smoke_test", smokeTest.error),
        credentialsDelivered,
        status: smokeTest.status,
      };
    }
  }

  try {
    if (destination.slug === "allok") {
      await clearWhatsAppCrmHandover({ wabaId: input.wabaId, phoneNumberId: input.phoneNumberId });
    } else {
      await recordWhatsAppCrmHandover({
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        provider: destination.slug,
        organizationId: input.externalRef,
        organizationName,
        webhookUri: webhookUrl,
        connectedAt: new Date().toISOString(),
      });
    }
  } catch {
    return {
      ...failure("persistencia", "Meta quedó configurado, pero Allok no pudo guardar el handover."),
      credentialsDelivered,
      status: 502,
    };
  }

  return { ok: true, webhookUrl, organizationName, credentialsDelivered };
}

function failure(
  step: Extract<HandoverResult, { ok: false }>["step"],
  error: string,
): Extract<HandoverResult, { ok: false }> {
  return { ok: false, step, error, credentialsDelivered: false };
}

function isRetryable(result: Extract<HandoverResult, { ok: false }>) {
  if (result.step === "config" || result.step === "token") return false;
  return result.status === undefined || result.status === 0 || result.status === 429 || result.status >= 500;
}

function metaErrorMessage(error: unknown, fallback: string) {
  const metaError = safeMetaError(error);
  return metaError && "message" in metaError.body
    ? (metaError.body.message ?? fallback)
    : fallback;
}

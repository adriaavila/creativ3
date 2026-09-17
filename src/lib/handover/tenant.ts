import { handoverConnectionToDestination, type HandoverResult } from "@/lib/handover/execute";

type TenantHandoverInput = {
  workspace: string;
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  businessToken: string;
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  status: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  destination?: string;
  externalRef?: string | null;
};

export type TenantHandoverResult = HandoverResult;

/** Completa el último tramo del onboarding público: Allok → Vocero SaaS. */
export async function handoverSaaSTenant(input: TenantHandoverInput): Promise<TenantHandoverResult> {
  return handoverConnectionToDestination({
    destinationSlug: input.destination ?? "vocero",
    externalRef: input.externalRef === undefined ? input.workspace : input.externalRef,
    client: input.workspace,
    wabaId: input.wabaId,
    phoneNumberId: input.phoneNumberId,
    businessId: input.businessId,
    businessToken: input.businessToken,
    connectionMode: input.connectionMode,
    status: input.status,
    displayPhoneNumber: input.displayPhoneNumber,
    verifiedName: input.verifiedName,
    requireProvision: true,
  });
}

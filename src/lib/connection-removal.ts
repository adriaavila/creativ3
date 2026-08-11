export function canRemoveConnection(input: {
  confirmation: string;
  handedToExternalApp: boolean;
  externalCredentialsRemoved: boolean;
}) {
  return input.confirmation === "ELIMINAR"
    && (!input.handedToExternalApp || input.externalCredentialsRemoved);
}

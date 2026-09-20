/** URLs logos CRM (Simple Icons / sources publiques, usage nominatif). */
export const INTEGRATION_LOGO_URL: Readonly<Record<string, string>> = {
  hubspot:
    "https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/hubspot.svg",
  brevo: "https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/brevo.svg",
  pipedrive: "https://cdn.worldvectorlogo.com/logos/pipedrive.svg",
  zoho_crm: "https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/zoho.svg",
  sellsy:
    "https://www.google.com/s2/favicons?domain=sellsy.com&sz=128",
  axonaut:
    "https://www.google.com/s2/favicons?domain=axonaut.com&sz=128",
};

export function integrationLogoUrl(integrationId: string): string | null {
  return INTEGRATION_LOGO_URL[integrationId] ?? null;
}

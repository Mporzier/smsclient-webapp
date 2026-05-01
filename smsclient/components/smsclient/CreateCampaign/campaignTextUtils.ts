export function buildDefaultCampaignTitle(): string {
  const d = new Date().toLocaleDateString("fr-FR");
  return `Campagne · ${d}`.slice(0, 60);
}

export function generateAiVariants(args: {
  objective: string;
  offer: string;
  duration: string;
  tone: string;
}): string[] {
  const objective = args.objective.trim() || "offre boutique";
  const offer = args.offer.trim() || "une offre exclusive";
  const duration = args.duration.trim() || "48h";
  const tone = args.tone.trim().toLowerCase();
  const opener =
    tone === "premium"
      ? "Bonjour {PRENOM},"
      : tone === "urgent"
        ? "{PRENOM},"
        : "Hello {PRENOM},";
  return [
    `${opener} ${objective} : ${offer}. Valable ${duration}. Réponds STOP pour ne plus recevoir nos SMS.`,
    `${opener} profite de ${offer} pour ${objective}. Fin de l’offre dans ${duration}.`,
    `${objective} 💬 ${offer} pendant ${duration}. Passe en boutique avec ce SMS !`,
  ].map((x) => x.slice(0, 320));
}

export function normalizeUrl(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

export function removeExistingUrl(text: string): string {
  return text.replace(/\s?https?:\/\/[^\s]+/gi, "").trim();
}

export function ensureStopMention(text: string): string {
  return /stop/i.test(text)
    ? text
    : `${text.trim()} Répondez STOP pour ne plus recevoir nos SMS.`.trim();
}

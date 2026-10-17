/** Base publique des liens courts (passerelle de redirection). */
export function shortLinkBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SHORT_LINK_BASE?.trim();
  return (fromEnv || "https://l.sms.fm").replace(/\/$/, "");
}

export function buildShortUrl(shortCode: string): string {
  return `${shortLinkBase()}/${shortCode}`;
}

/** Affichage liste — sans schéma http(s):// */
export function linkUrlDisplayLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

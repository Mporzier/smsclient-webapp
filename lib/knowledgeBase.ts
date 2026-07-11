/** Slugs d’articles — URLs finalisées quand la base de connaissance sera en ligne. */
export type KnowledgeBaseArticleSlug =
  | "accueil"
  | "contacts"
  | "groupes"
  | "campagnes"
  | "statistiques"
  | "automatisations"
  | "liens"
  | "modeles-sms";

const DEFAULT_KB_ORIGIN = "https://help.smsclient.fr";

export function getKnowledgeBaseOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_KNOWLEDGE_BASE_URL?.trim();
  return fromEnv || DEFAULT_KB_ORIGIN;
}

export function knowledgeBaseArticleUrl(slug: KnowledgeBaseArticleSlug): string {
  const origin = getKnowledgeBaseOrigin().replace(/\/$/, "");
  return `${origin}/articles/${slug}`;
}

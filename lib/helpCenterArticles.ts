import type { HelpCenterCardId } from "@/lib/helpCenterSections";
import type { MessageKey } from "@/lib/i18n/messages";

export type HelpCenterArticle = {
  id: string;
  titleKey: MessageKey;
};

export type HelpCenterArticleGroup = {
  id: string;
  titleKey: MessageKey;
  articles: HelpCenterArticle[];
};

const GROUPS: Record<HelpCenterCardId, HelpCenterArticleGroup[]> = {
  contacts: [
    {
      id: "basics",
      titleKey: "help.section.group.contacts.basics",
      articles: [
        { id: "manual", titleKey: "help.art.contacts.manual" },
        { id: "search-filters", titleKey: "help.art.contacts.searchFilters" },
        { id: "eligibility", titleKey: "help.art.contacts.eligibility" },
        { id: "best-practices", titleKey: "help.art.contacts.bestPractices" },
      ],
    },
    {
      id: "organize",
      titleKey: "help.section.group.contacts.organize",
      articles: [
        { id: "custom-fields", titleKey: "help.art.contacts.customFields" },
        { id: "unsubscribed", titleKey: "help.art.contacts.unsubscribed" },
      ],
    },
    {
      id: "import",
      titleKey: "help.section.group.contacts.import",
      articles: [
        { id: "import-csv", titleKey: "help.art.contacts.importCsv" },
        { id: "import-excel", titleKey: "help.art.contacts.importExcel" },
      ],
    },
  ],
  groupes: [
    {
      id: "basics",
      titleKey: "help.section.group.groupes.basics",
      articles: [
        { id: "create", titleKey: "help.art.groupes.create" },
        { id: "segments", titleKey: "help.art.groupes.segments" },
      ],
    },
    {
      id: "target",
      titleKey: "help.section.group.groupes.target",
      articles: [
        { id: "rules", titleKey: "help.art.groupes.rules" },
        { id: "campaign-target", titleKey: "help.art.groupes.campaignTarget" },
      ],
    },
    {
      id: "maintain",
      titleKey: "help.section.group.groupes.maintain",
      articles: [{ id: "maintain", titleKey: "help.art.groupes.maintain" }],
    },
  ],
  campagnes: [
    {
      id: "prepare",
      titleKey: "help.section.group.campagnes.prepare",
      articles: [
        { id: "first-send", titleKey: "help.art.campagnes.firstSend" },
        { id: "recipients", titleKey: "help.art.campagnes.recipients" },
        { id: "checklist", titleKey: "help.art.campagnes.checklist" },
      ],
    },
    {
      id: "message",
      titleKey: "help.section.group.campagnes.message",
      articles: [
        { id: "compose", titleKey: "help.art.campagnes.compose" },
        { id: "personalization", titleKey: "help.art.campagnes.personalization" },
        { id: "links", titleKey: "help.art.campagnes.links" },
      ],
    },
    {
      id: "send",
      titleKey: "help.section.group.campagnes.send",
      articles: [
        { id: "schedule", titleKey: "help.art.campagnes.schedule" },
        { id: "credits", titleKey: "help.art.campagnes.credits" },
        { id: "test-send", titleKey: "help.art.campagnes.testSend" },
        { id: "errors", titleKey: "help.art.campagnes.errors" },
        { id: "duplicate", titleKey: "help.art.campagnes.duplicate" },
        { id: "reports", titleKey: "help.art.campagnes.reports" },
      ],
    },
  ],
  statistiques: [
    {
      id: "basics",
      titleKey: "help.section.group.statistiques.basics",
      articles: [
        { id: "overview", titleKey: "help.art.statistiques.overview" },
        { id: "delivery", titleKey: "help.art.statistiques.delivery" },
        { id: "reads", titleKey: "help.art.statistiques.reads" },
        { id: "clicks", titleKey: "help.art.statistiques.clicks" },
      ],
    },
    {
      id: "advanced",
      titleKey: "help.section.group.statistiques.advanced",
      articles: [
        { id: "periods", titleKey: "help.art.statistiques.periods" },
        { id: "export", titleKey: "help.art.statistiques.export" },
      ],
    },
  ],
  automatisations: [
    {
      id: "basics",
      titleKey: "help.section.group.automatisations.basics",
      articles: [
        { id: "intro", titleKey: "help.art.automatisations.intro" },
        { id: "triggers", titleKey: "help.art.automatisations.triggers" },
      ],
    },
    {
      id: "run",
      titleKey: "help.section.group.automatisations.run",
      articles: [
        { id: "templates", titleKey: "help.art.automatisations.templates" },
        { id: "monitor", titleKey: "help.art.automatisations.monitor" },
      ],
    },
  ],
  liens: [
    {
      id: "basics",
      titleKey: "help.section.group.liens.basics",
      articles: [
        { id: "create", titleKey: "help.art.liens.create" },
        { id: "track", titleKey: "help.art.liens.track" },
      ],
    },
    {
      id: "campaigns",
      titleKey: "help.section.group.liens.campaigns",
      articles: [{ id: "campaign-use", titleKey: "help.art.liens.campaignUse" }],
    },
  ],
  "modeles-sms": [
    {
      id: "create",
      titleKey: "help.section.group.modeles-sms.create",
      articles: [
        { id: "create", titleKey: "help.art.modeles.create" },
        { id: "variables", titleKey: "help.art.modeles.variables" },
      ],
    },
    {
      id: "use",
      titleKey: "help.section.group.modeles-sms.use",
      articles: [
        { id: "reuse", titleKey: "help.art.modeles.reuse" },
        { id: "organize", titleKey: "help.art.modeles.organize" },
        { id: "compliance", titleKey: "help.art.modeles.compliance" },
      ],
    },
  ],
  "qr-boutique": [
    {
      id: "collect",
      titleKey: "help.section.group.qr-boutique.collect",
      articles: [
        { id: "display", titleKey: "help.art.qr.display" },
        { id: "form", titleKey: "help.art.qr.form" },
      ],
    },
    {
      id: "engage",
      titleKey: "help.section.group.qr-boutique.engage",
      articles: [
        { id: "wheel", titleKey: "help.art.qr.wheel" },
        { id: "welcome-sms", titleKey: "help.art.qr.welcomeSms" },
      ],
    },
    {
      id: "optimize",
      titleKey: "help.section.group.qr-boutique.optimize",
      articles: [
        { id: "compliance", titleKey: "help.art.qr.compliance" },
        { id: "stats", titleKey: "help.art.qr.stats" },
        { id: "tips", titleKey: "help.art.qr.tips" },
      ],
    },
  ],
  "reglementations-sms": [
    {
      id: "essentials",
      titleKey: "help.section.group.reglementations-sms.essentials",
      articles: [
        { id: "consent", titleKey: "help.art.regs.consent" },
        { id: "stop", titleKey: "help.art.regs.stop" },
        { id: "sender-id", titleKey: "help.art.regs.senderId" },
        { id: "content", titleKey: "help.art.regs.content" },
      ],
    },
    {
      id: "practice",
      titleKey: "help.section.group.reglementations-sms.practice",
      articles: [
        { id: "hours", titleKey: "help.art.regs.hours" },
        { id: "b2b", titleKey: "help.art.regs.b2b" },
        { id: "b2c", titleKey: "help.art.regs.b2c" },
        { id: "records", titleKey: "help.art.regs.records" },
        { id: "international", titleKey: "help.art.regs.international" },
      ],
    },
  ],
  "acheter-credits": [
    {
      id: "credits",
      titleKey: "help.section.group.acheter-credits.credits",
      articles: [
        { id: "buy", titleKey: "help.art.credits.buy" },
        { id: "balance", titleKey: "help.art.credits.balance" },
      ],
    },
    {
      id: "billing",
      titleKey: "help.section.group.acheter-credits.billing",
      articles: [
        { id: "invoices", titleKey: "help.art.credits.invoices" },
        { id: "usage", titleKey: "help.art.credits.usage" },
      ],
    },
  ],
  parametres: [
    {
      id: "account",
      titleKey: "help.section.group.parametres.account",
      articles: [
        { id: "profile", titleKey: "help.art.parametres.profile" },
        { id: "team", titleKey: "help.art.parametres.team" },
        { id: "security", titleKey: "help.art.parametres.security" },
      ],
    },
    {
      id: "app",
      titleKey: "help.section.group.parametres.app",
      articles: [
        { id: "custom-fields", titleKey: "help.art.parametres.customFields" },
        { id: "appearance", titleKey: "help.art.parametres.appearance" },
        { id: "notifications", titleKey: "help.art.parametres.notifications" },
      ],
    },
  ],
  support: [
    {
      id: "self-service",
      titleKey: "help.section.group.support.selfService",
      articles: [{ id: "faq", titleKey: "help.art.support.faq" }],
    },
    {
      id: "contact",
      titleKey: "help.section.group.support.contact",
      articles: [
        { id: "contact", titleKey: "help.art.support.contact" },
        { id: "escalation", titleKey: "help.art.support.escalation" },
      ],
    },
  ],
};

export function helpArticleGroupsForSection(
  sectionId: HelpCenterCardId,
): HelpCenterArticleGroup[] {
  return GROUPS[sectionId];
}

export function helpArticlesForSection(
  sectionId: HelpCenterCardId,
): HelpCenterArticle[] {
  return GROUPS[sectionId].flatMap((group) => group.articles);
}

export function resolveHelpArticle(
  sectionId: HelpCenterCardId,
  articleId: string | null,
): HelpCenterArticle | null {
  const articles = helpArticlesForSection(sectionId);
  if (articles.length === 0) return null;
  if (!articleId) return articles[0] ?? null;
  return articles.find((a) => a.id === articleId) ?? articles[0] ?? null;
}

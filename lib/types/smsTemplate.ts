import {
  SMS_BODY_HARD_MAX_LENGTH,
  SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";

export type UserSmsTemplateRow = {
  id: string;
  title: string;
  description: string;
  body: string;
  createdLabel: string;
};

export const SMS_TEMPLATE_TITLE_MIN_LENGTH = 3;
export const SMS_TEMPLATE_TITLE_MAX_LENGTH = 60;
export const SMS_TEMPLATE_BODY_MIN_LENGTH = 1;
export {
  SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  SMS_BODY_HARD_MAX_LENGTH as SMS_TEMPLATE_BODY_MAX_LENGTH,
};

export function isValidSmsTemplateTitle(title: string): boolean {
  const t = title.trim();
  return (
    t.length >= SMS_TEMPLATE_TITLE_MIN_LENGTH &&
    t.length <= SMS_TEMPLATE_TITLE_MAX_LENGTH
  );
}

export function isValidSmsTemplateBody(body: string): boolean {
  return body.trim().length >= SMS_TEMPLATE_BODY_MIN_LENGTH;
}

export function toCampaignSmsTemplate(row: UserSmsTemplateRow): {
  id: string;
  title: string;
  description: string;
  body: string;
} {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "Modèle personnalisé",
    body: row.body,
  };
}

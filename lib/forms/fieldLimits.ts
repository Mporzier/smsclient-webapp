import { SMS_LIMITS } from "@/lib/proto/smsEncoding";

/** Caps UI (`maxLength`) — alignés ContactCreate / SMS_LIMITS / RFC. */

export const PERSON_NAME_MAX_LENGTH = 30;
export const PHONE_DISPLAY_MAX_LENGTH = 14;
export const EMAIL_MAX_LENGTH = 254;
export const COMPANY_NAME_MAX_LENGTH = 100;
export const SIRET_MAX_LENGTH = 14;
export const VAT_MAX_LENGTH = 20;
export const ADDRESS_MAX_LENGTH = 200;
export const ZIP_MAX_LENGTH = 10;
export const CITY_MAX_LENGTH = 80;
export const COUNTRY_MAX_LENGTH = 60;
export const BILLING_CONTACT_MAX_LENGTH = 120;
export const URL_MAX_LENGTH = 2048;
export const SMS_TEMPLATE_DESCRIPTION_MAX_LENGTH = 120;
/** Plafond absolu SMS (8 × GSM concat). Check encoding-aware reste au submit. */
export const SMS_BODY_HARD_MAX_LENGTH =
  SMS_LIMITS.GSM_CONCAT * SMS_LIMITS.MAX_SEGMENTS;
export const CUSTOM_FIELD_LABEL_MAX_LENGTH = 60;
export const CUSTOM_FIELD_VALUE_MAX_LENGTH = 280;
export const CONTACT_NOTES_MAX_LENGTH = CUSTOM_FIELD_VALUE_MAX_LENGTH;
export const AI_PROMPT_MAX_LENGTH = 1000;
export const QR_WHEEL_TITLE_MAX_LENGTH = 60;
export const QR_WHEEL_SUBTITLE_MAX_LENGTH = 120;
export const QR_WHEEL_SEGMENT_LABEL_MAX_LENGTH = 40;
export const QR_WHEEL_SCREEN_MSG_MAX_LENGTH = 160;
export const QR_WHEEL_SMS_MSG_MAX_LENGTH = SMS_BODY_HARD_MAX_LENGTH;
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const SMS_SENDER_MAX_LENGTH = 11;



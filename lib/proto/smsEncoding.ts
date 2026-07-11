/**
 * Encodage SMS — aligné GSM 03.38 / UCS-2 et pratique opérateurs (Ringover) :
 *
 * Standard (GSM 7-bit) : 160 car. (1 SMS), puis 153 car. / segment concaténé
 * Unicode (UCS-2)      : 70 car. (1 SMS), puis 67 car. / segment concaténé
 *
 * Paliers Unicode Ringover : 70 · 134 · 201 · … (×67)
 * Paliers GSM Ringover     : 160 · 306 · 459 · … (×153)
 *
 * Plafond plateforme : 8 segments max (Ringover)
 * - GSM max     : 153 × 8 = 1 224 septets
 * - Unicode max : 67 × 8  = 536 unités UTF-16
 *
 * UCS-2 facture en unités UTF-16 (👩‍🚒 = 5, 👩🏽‍🚒 = 7).
 * Accents hors GSM (ç, ê, ë, î, emoji…) basculent tout le message en Unicode.
 * Saut de ligne CR+LF = 2 caractères en GSM.
 */

/** Caractères GSM 03.38 de base (1 septet chacun). */
const GSM_BASIC_CHARS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ" +
  " !\"#¤%&'()*+,-./0123456789:;<=>?¡¿ÄÖÑÜ§à" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Table d’extension GSM (2 septets : échappement 0x1B + caractère). */
const GSM_EXTENDED_CHARS = "^{}\\[~]|€";

const GSM_BASIC = new Set(GSM_BASIC_CHARS.split(""));
const GSM_EXTENDED = new Set(GSM_EXTENDED_CHARS.split(""));

export const SMS_LIMITS = {
  MAX_SEGMENTS: 8,
  GSM_SINGLE: 160,
  GSM_CONCAT: 153,
  UNICODE_SINGLE: 70,
  UNICODE_CONCAT: 67,
} as const;

export type SmsEncoding = "GSM_7BIT" | "UNICODE";

export type SmsMessageStats = {
  /** Septets GSM ou unités UTF-16 UCS-2 (unité facturée). */
  characterCount: number;
  /** Points de code Unicode (≠ facturation pour emoji composés). */
  codePointCount: number;
  encoding: SmsEncoding;
  smsCount: number;
  /** Plafond du palier actuel (160/70 ou n×153 / n×67). */
  displayLimit: number;
  singleSegmentLimit: number;
  concatSegmentSize: number;
  maxSegments: number;
  /** Plafond absolu (8 segments Ringover). */
  maxBillableCharacters: number;
  exceedsMaxSegments: boolean;
  /** Caractères restants avant le palier suivant (0 si palier plein). */
  remainingInTier: number;
};

function isGsm7Char(ch: string): boolean {
  return GSM_BASIC.has(ch) || GSM_EXTENDED.has(ch);
}

export function isGsm7Message(text: string): boolean {
  if (!text) return true;
  for (const ch of text) {
    if (!isGsm7Char(ch)) return false;
  }
  return true;
}

/** Septets GSM (caractères étendus = 2). */
export function countGsmSeptets(text: string): number {
  let count = 0;
  for (const ch of text) {
    count += GSM_EXTENDED.has(ch) ? 2 : 1;
  }
  return count;
}

/** UCS-2 SMS : chaque unité de code UTF-16 compte (paires surrogates = 2). */
export function countUcs2Units(text: string): number {
  return text.length;
}

export function maxBillableCharacters(encoding: SmsEncoding): number {
  return encoding === "GSM_7BIT"
    ? SMS_LIMITS.GSM_CONCAT * SMS_LIMITS.MAX_SEGMENTS
    : SMS_LIMITS.UNICODE_CONCAT * SMS_LIMITS.MAX_SEGMENTS;
}

/** Paliers cumulés Ringover (1 à 8 SMS). */
export function smsTierLimits(encoding: SmsEncoding): number[] {
  const { GSM_SINGLE, GSM_CONCAT, UNICODE_SINGLE, UNICODE_CONCAT, MAX_SEGMENTS } =
    SMS_LIMITS;
  if (encoding === "GSM_7BIT") {
    return Array.from({ length: MAX_SEGMENTS }, (_, i) =>
      i === 0 ? GSM_SINGLE : GSM_CONCAT * (i + 1),
    );
  }
  return Array.from({ length: MAX_SEGMENTS }, (_, i) =>
    i === 0 ? UNICODE_SINGLE : UNICODE_CONCAT * (i + 1),
  );
}

function buildStats(
  characterCount: number,
  codePointCount: number,
  encoding: SmsEncoding,
  smsCount: number,
  singleSegmentLimit: number,
  concatSegmentSize: number,
): SmsMessageStats {
  const displayLimit =
    smsCount === 1 ? singleSegmentLimit : smsCount * concatSegmentSize;
  const maxBillable = maxBillableCharacters(encoding);
  const remainingInTier = Math.max(0, displayLimit - characterCount);

  return {
    characterCount,
    codePointCount,
    encoding,
    smsCount,
    displayLimit,
    singleSegmentLimit,
    concatSegmentSize,
    maxSegments: SMS_LIMITS.MAX_SEGMENTS,
    maxBillableCharacters: maxBillable,
    exceedsMaxSegments: smsCount > SMS_LIMITS.MAX_SEGMENTS,
    remainingInTier,
  };
}

export function analyzeSmsMessage(text: string): SmsMessageStats {
  const codePointCount = [...text].length;

  if (isGsm7Message(text)) {
    const characterCount = countGsmSeptets(text);
    const { GSM_SINGLE, GSM_CONCAT } = SMS_LIMITS;

    if (characterCount <= GSM_SINGLE) {
      return buildStats(
        characterCount,
        codePointCount,
        "GSM_7BIT",
        1,
        GSM_SINGLE,
        GSM_CONCAT,
      );
    }

    const smsCount = Math.ceil(characterCount / GSM_CONCAT);
    return buildStats(
      characterCount,
      codePointCount,
      "GSM_7BIT",
      smsCount,
      GSM_SINGLE,
      GSM_CONCAT,
    );
  }

  const characterCount = countUcs2Units(text);
  const { UNICODE_SINGLE, UNICODE_CONCAT } = SMS_LIMITS;

  if (characterCount <= UNICODE_SINGLE) {
    return buildStats(
      characterCount,
      codePointCount,
      "UNICODE",
      1,
      UNICODE_SINGLE,
      UNICODE_CONCAT,
    );
  }

  const smsCount = Math.ceil(characterCount / UNICODE_CONCAT);
  return buildStats(
    characterCount,
    codePointCount,
    "UNICODE",
    smsCount,
    UNICODE_SINGLE,
    UNICODE_CONCAT,
  );
}

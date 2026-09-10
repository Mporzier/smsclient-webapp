import {
  containsKnownMergeTag,
  expandMergeTags,
  type SmsMergeValues,
} from "@/lib/proto/smsPersonalization";
import { buildEffectiveSms } from "@/lib/proto/smsStopMention";
import { analyzeSmsMessage, SMS_LIMITS } from "@/lib/proto/smsUtils";
import type { CustomFieldDef } from "@/lib/types/customFields";

export function validateAutomationSmsBody(
  body: string,
  options: {
    reserveStop?: boolean;
    estimateSample?: SmsMergeValues | null;
    customFieldDefs?: readonly CustomFieldDef[];
  } = {},
): string | null {
  const trimmed = body.trim();
  if (!trimmed) {
    return "Le message ne peut pas être vide.";
  }

  const { reserveStop = true, estimateSample, customFieldDefs = [] } = options;

  const expand = (raw: string) =>
    estimateSample && containsKnownMergeTag(raw, customFieldDefs)
      ? expandMergeTags(raw, estimateSample, customFieldDefs)
      : raw;

  const billable = reserveStop ? buildEffectiveSms(trimmed, true) : trimmed;
  const stats = analyzeSmsMessage(expand(billable));

  if (stats.exceedsMaxSegments || stats.characterCount > stats.maxBillableCharacters) {
    return `Le message dépasse ${SMS_LIMITS.MAX_SEGMENTS} SMS — raccourcis-le.`;
  }

  return null;
}

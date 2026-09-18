"use client";

import {
  aiOptionCardClass,
  SmsAiOptionHeader,
} from "@/components/smsclient/CreateCampaign/SmsAiOptionChrome";
import {
  isSmsAiMarketingTone,
  SMS_AI_MESSAGE_TONE_OPTIONS,
  type SmsAiMessageTone,
} from "@/components/smsclient/CreateCampaign/smsAiTone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SmsAiToneOptionCardProps = {
  value: SmsAiMessageTone;
  onChange: (tone: SmsAiMessageTone) => void;
};

export function SmsAiToneOptionCard({
  value,
  onChange,
}: SmsAiToneOptionCardProps) {
  const selected = SMS_AI_MESSAGE_TONE_OPTIONS.find((o) => o.value === value);
  const marketingTone = isSmsAiMarketingTone(value);

  return (
    <div className={aiOptionCardClass(marketingTone)}>
      <SmsAiOptionHeader
        emoji="💬"
        emojiTone={marketingTone ? "active" : "neutral"}
        title="Ton du message"
      />
      <div className="space-y-1.5">
        <Label htmlFor="sms-ai-message-tone" className="sr-only">
          Ton du message
        </Label>
        <Select
          value={value}
          onValueChange={(v) => onChange(v as SmsAiMessageTone)}
        >
          <SelectTrigger
            id="sms-ai-message-tone"
            className="h-9 w-full bg-background text-sm"
          >
            <SelectValue placeholder="Choisir un ton" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
            {SMS_AI_MESSAGE_TONE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected ? (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            {selected.hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

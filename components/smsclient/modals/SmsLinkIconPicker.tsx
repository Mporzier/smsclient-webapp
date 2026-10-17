"use client";

import { SmsLinkIconTile } from "@/components/smsclient/SmsLinkIconTile";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SMS_LINK_ICON_ID,
  SMS_LINK_ICON_PICKER_ORDER,
  smsLinkIconLabelFr,
  type SmsLinkIconId,
} from "@/lib/proto/smsLinkIcons";

const pickerBtnCls =
  "aspect-square w-full shrink-0 cursor-pointer rounded-lg bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

type SmsLinkIconPickerProps = {
  value: SmsLinkIconId;
  onChange: (id: SmsLinkIconId) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
};

export function SmsLinkIconPicker({
  value,
  onChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
}: SmsLinkIconPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      className="grid w-full grid-cols-9 gap-2"
    >
      {SMS_LINK_ICON_PICKER_ORDER.map((id) => {
        const selected = value === id;
        const label = smsLinkIconLabelFr(id);
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            disabled={disabled}
            title={label}
            className={cn(
              pickerBtnCls,
              disabled && "pointer-events-none opacity-50",
            )}
            onClick={() => onChange(id)}
          >
            <SmsLinkIconTile
              iconId={id}
              size="picker"
              selected={selected}
              title={label}
              className="size-full"
            />
          </button>
        );
      })}
    </div>
  );
}

export { DEFAULT_SMS_LINK_ICON_ID };

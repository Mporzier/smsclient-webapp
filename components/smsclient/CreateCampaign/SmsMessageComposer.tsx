"use client";

import { cn } from "@/lib/cn";
import { Smile } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SmsCompositionCounter } from "./SmsCompositionCounter";
import { SmsMergeTagMenu } from "./SmsMergeTagMenu";
import {
  SmsRichMessageEditor,
  type SmsRichMessageEditorHandle,
} from "./SmsRichMessageEditor";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { useI18n } from "@/lib/i18n";
import type { SmsMergeValues } from "@/lib/proto/smsPersonalization";
import type { MergeFillCounts, MergeFillStatus } from "@/lib/proto/smsMergeFill";

export function SmsMessageComposer({
  value,
  onChange,
  placeholder = "Ex. Bonjour [Prénom], -20 % cette semaine en boutique.",
  hasError,
  estimateFirstName,
  reserveStop = false,
  billableMessage,
  compact = false,
  customFieldDefs = [],
  estimateSample,
  popoverClassName,
  mergeFillCounts,
  mergeFillStatus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  estimateFirstName?: string;
  reserveStop?: boolean;
  billableMessage?: string;
  compact?: boolean;
  customFieldDefs?: readonly CustomFieldDef[];
  estimateSample?: SmsMergeValues;
  /** Emoji + tags sont portalisés : z à relever dans une Dialog. */
  popoverClassName?: string;
  mergeFillCounts?: MergeFillCounts;
  mergeFillStatus?: MergeFillStatus;
}) {
  const { locale, t } = useI18n();
  const [emojisOpen, setEmojisOpen] = useState(false);
  const editorRef = useRef<SmsRichMessageEditorHandle>(null);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editorRef.current?.insertText(emoji);
    },
    [],
  );

  const insertMergeToken = useCallback((token: string) => {
    editorRef.current?.insertText(token);
  }, []);

  return (
    <div className={cn("shrink-0", compact ? "mt-1.5" : "mt-2.5")}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-shadow",
          hasError
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-[#dfe6f2] focus-within:border-[#2f6fed]/40 focus-within:ring-2 focus-within:ring-[#2f6fed]/15",
        )}
      >
        <SmsRichMessageEditor
          ref={editorRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={compact ? "min-h-16 max-h-20 py-2 text-[13px] leading-snug" : undefined}
        />

        <div className="flex items-center justify-between gap-2 border-t border-slate-100/80 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <Popover open={emojisOpen} onOpenChange={setEmojisOpen} modal>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title={t("emoji.insertAria")}
                  aria-label={t("emoji.insertAria")}
                  className={cn(
                    "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-200/90 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 data-[state=open]:border-[#2f6fed]/30 data-[state=open]:bg-[#eef4ff] data-[state=open]:text-[#2f6fed]",
                  )}
                >
                  <Smile className="h-4 w-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                className={cn("w-auto gap-0 overflow-hidden p-0", popoverClassName)}
              >
                <EmojiPicker
                  className="h-[326px]"
                  locale={locale}
                  onEmojiSelect={({ emoji }) => {
                    setEmojisOpen(false);
                    requestAnimationFrame(() => insertEmoji(emoji));
                  }}
                >
                  <EmojiPickerSearch placeholder={t("emoji.searchPh")} />
                  <EmojiPickerContent emptyLabel={t("emoji.empty")} />
                  <EmojiPickerFooter hintLabel={t("emoji.hint")} />
                </EmojiPicker>
              </PopoverContent>
            </Popover>

            <SmsMergeTagMenu
              defs={customFieldDefs}
              onInsert={insertMergeToken}
              contentClassName={popoverClassName}
              fillCounts={mergeFillCounts}
              fillStatus={mergeFillStatus}
            />
          </div>

          <SmsCompositionCounter
            message={value}
            reserveStop={reserveStop}
            billableMessage={billableMessage}
            estimateFirstName={estimateFirstName}
            estimateSample={estimateSample}
            customFieldDefs={customFieldDefs}
          />
        </div>

      </div>
    </div>
  );
}

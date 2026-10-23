"use client";

import { cn } from "@/lib/cn";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Smile } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useId,
  useRef,
  useState,
} from "react";
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
import { SmsLinkInsertMenu } from "./SmsLinkInsertMenu";
import { SmsMergeTagMenu } from "./SmsMergeTagMenu";
import type { LinkRowData } from "@/lib/types/link";
import {
  SmsRichMessageEditor,
  type SmsRichMessageEditorHandle,
} from "./SmsRichMessageEditor";
import type { CustomFieldDef } from "@/lib/types/customFields";
import { useI18n } from "@/lib/i18n";
import type { SmsMergeValues } from "@/lib/proto/smsPersonalization";
import type { MergeFillCounts, MergeFillStatus } from "@/lib/proto/smsMergeFill";
import {
  AI_PROMPT_MAX_LENGTH,
  SMS_BODY_HARD_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";

type SmsMessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  compact?: boolean;
  customFieldDefs?: readonly CustomFieldDef[];
  /** Emoji + tags sont portalisés : z à relever dans une Dialog. */
  popoverClassName?: string;
  mergeFillCounts?: MergeFillCounts;
  mergeFillStatus?: MergeFillStatus;
  disabled?: boolean;
  mode?: "message" | "aiPrompt" | "plainText";
  estimateFirstName?: string;
  reserveStop?: boolean;
  billableMessage?: string;
  estimateSample?: SmsMergeValues;
  maxLength?: number;
  savedLinks?: LinkRowData[];
  linksLoading?: boolean;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  /** Message commercial (offre, promo…). */
  commercialMessage?: boolean;
  onCommercialMessageChange?: (checked: boolean) => void;
};

export type SmsMessageComposerHandle = {
  flushMessage: () => string;
};

export const SmsMessageComposer = forwardRef<
  SmsMessageComposerHandle,
  SmsMessageComposerProps
>(function SmsMessageComposer(
  {
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
    disabled = false,
    mode = "message",
    maxLength = AI_PROMPT_MAX_LENGTH,
    savedLinks = [],
    linksLoading = false,
    onCreateLink,
    commercialMessage: commercialMessageProp,
    onCommercialMessageChange,
  },
  ref,
) {
  const { locale, t } = useI18n();
  const [commercialMessageInternal, setCommercialMessageInternal] =
    useState(true);
  const commercialMessage = commercialMessageProp ?? commercialMessageInternal;
  const setCommercialMessage =
    onCommercialMessageChange ?? setCommercialMessageInternal;
  const commercialCheckboxId = useId();
  const [emojisOpen, setEmojisOpen] = useState(false);
  const editorRef = useRef<SmsRichMessageEditorHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const pendingRichCaretRef = useRef<number | null>(null);
  const pendingTextareaSelRef = useRef<{ start: number; end: number } | null>(
    null,
  );
  const isAiPrompt = mode === "aiPrompt";
  const useTextarea = mode === "aiPrompt" || mode === "plainText";
  const textareaMaxLength = isAiPrompt
    ? maxLength
    : SMS_BODY_HARD_MAX_LENGTH;

  const insertAtPromptCursor = useCallback(
    (text: string) => {
      const el = promptRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + text + value.slice(end);
      if (next.length > textareaMaxLength) return;
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + text.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [onChange, textareaMaxLength, value],
  );

  useImperativeHandle(
    ref,
    () => ({
      flushMessage: () =>
        useTextarea ? value.trim() : editorRef.current?.flush() ?? value,
    }),
    [useTextarea, value],
  );

  const captureCaretForInsert = useCallback(() => {
    if (useTextarea) {
      const el = promptRef.current;
      if (!el) return;
      pendingTextareaSelRef.current = {
        start: el.selectionStart,
        end: el.selectionEnd,
      };
      return;
    }
    pendingRichCaretRef.current = editorRef.current?.getCaretOffset() ?? null;
  }, [useTextarea]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (useTextarea) {
        const el = promptRef.current;
        const saved = pendingTextareaSelRef.current;
        pendingTextareaSelRef.current = null;
        if (el && saved) {
          const next =
            value.slice(0, saved.start) + emoji + value.slice(saved.end);
          if (next.length > textareaMaxLength) return;
          onChange(next);
          requestAnimationFrame(() => {
            el.focus();
            const pos = saved.start + emoji.length;
            el.setSelectionRange(pos, pos);
          });
          return;
        }
        insertAtPromptCursor(emoji);
        return;
      }
      const offset = pendingRichCaretRef.current;
      pendingRichCaretRef.current = null;
      editorRef.current?.insertText(emoji, offset);
    },
    [insertAtPromptCursor, onChange, textareaMaxLength, useTextarea, value],
  );

  const insertMergeToken = useCallback(
    (token: string) => {
      if (useTextarea) {
        insertAtPromptCursor(token);
        return;
      }
      // Après fermeture menu : focus + sélection stables, state parent à jour pour l’aperçu iPhone.
      requestAnimationFrame(() => {
        editorRef.current?.insertText(token);
      });
    },
    [insertAtPromptCursor, useTextarea],
  );

  const insertLink = useCallback(
    (link: LinkRowData) => {
      const text = `${link.shortUrl} `;
      if (useTextarea) {
        insertAtPromptCursor(text);
        return;
      }
      editorRef.current?.insertText(text);
    },
    [insertAtPromptCursor, useTextarea],
  );

  const showLinkMenu = savedLinks.length > 0 || linksLoading || onCreateLink;
  const stopReserved =
    commercialMessageProp !== undefined ? commercialMessage : reserveStop;

  return (
    <div className={cn("w-full shrink-0", compact ? "mt-1.5" : "mt-2.5")}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-shadow",
          hasError
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-[#dfe6f2] focus-within:border-[#2f6fed]/40 focus-within:ring-2 focus-within:ring-[#2f6fed]/15",
        )}
      >
        {useTextarea ? (
          <textarea
            ref={promptRef}
            value={value}
            disabled={disabled}
            maxLength={textareaMaxLength}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "block min-h-28 w-full resize-none overflow-y-auto border-none bg-transparent px-3.5 pt-3.5",
              "text-sm font-semibold leading-relaxed text-slate-900 outline-none",
              "placeholder:font-normal placeholder:leading-relaxed placeholder:text-muted-foreground/40",
              disabled && "cursor-not-allowed opacity-60",
            )}
          />
        ) : (
          <SmsRichMessageEditor
            ref={editorRef}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            reserveStop={stopReserved}
            className={
              compact ? "min-h-16 max-h-20 py-2 text-[13px] leading-snug" : undefined
            }
          />
        )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-100/80 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <Popover open={emojisOpen} onOpenChange={setEmojisOpen} modal>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  title={t("emoji.insertAria")}
                  aria-label={t("emoji.insertAria")}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    captureCaretForInsert();
                  }}
                  className={cn(
                    "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-200/90 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 data-[state=open]:border-[#2f6fed]/30 data-[state=open]:bg-[#eef4ff] data-[state=open]:text-[#2f6fed]",
                    disabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                >
                  <Smile className="h-4 w-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
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
              disabled={disabled}
            />
            {showLinkMenu ? (
              <SmsLinkInsertMenu
                links={savedLinks}
                loading={linksLoading}
                disabled={disabled}
                onInsert={insertLink}
                onCreateLink={onCreateLink}
                contentClassName={popoverClassName}
              />
            ) : null}
          </div>

          <SmsCompositionCounter
            message={value}
            reserveStop={stopReserved}
            billableMessage={billableMessage}
            estimateFirstName={estimateFirstName}
            estimateSample={estimateSample}
            customFieldDefs={customFieldDefs}
          />
        </div>
      </div>

      <label
          htmlFor={commercialCheckboxId}
          className={cn(
            "mt-2 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/80 bg-muted/45 px-2.5 py-2",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <Checkbox
            id={commercialCheckboxId}
            checked={commercialMessage}
            disabled={disabled}
            onCheckedChange={(checked) =>
              setCommercialMessage(checked === true)
            }
            className="shrink-0"
            aria-describedby={`${commercialCheckboxId}-unsub-hint`}
          />
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
            <span className="font-semibold">{t("sms.commercialLabel")}</span>
            <span className="font-normal text-muted-foreground">
              {" "}
              {t("sms.commercialHint")}
            </span>
          </span>
          <span
            id={`${commercialCheckboxId}-unsub-hint`}
            className="ml-auto flex shrink-0 items-center gap-2 text-xs leading-[1.25] text-muted-foreground"
          >
            <Info
              className="mt-px h-5 w-5 shrink-0 text-[#2f6fed]"
              aria-hidden
            />
            <span className="text-left">
              <span className="block whitespace-nowrap">
                {t("sms.commercialUnsubTooltipLine1")}
              </span>
              <span className="block whitespace-nowrap">
                {t("sms.commercialUnsubTooltipLine2")}
              </span>
            </span>
          </span>
      </label>
    </div>
  );
});

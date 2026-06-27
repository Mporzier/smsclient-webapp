"use client";

import { cn } from "@/lib/cn";
import { UserRound, Smile } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { SmsCompositionCounter } from "./SmsCompositionCounter";
import { SmsEmojiPicker } from "./SmsEmojiPicker";
import {
  SmsRichMessageEditor,
  type SmsRichMessageEditorHandle,
} from "./SmsRichMessageEditor";
import { smsPrenomChipClass } from "./smsPrenomTagStyles";

export function SmsMessageComposer({
  value,
  onChange,
  placeholder = "Écris ton SMS ici…",
  hasError,
  allowSpecialChars = true,
  estimateFirstName,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  allowSpecialChars?: boolean;
  estimateFirstName?: string;
  compact?: boolean;
}) {
  const [emojisOpen, setEmojisOpen] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<SmsRichMessageEditorHandle>(null);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editorRef.current?.insertText(emoji);
    },
    [],
  );

  const insertPrenomTag = useCallback(() => {
    editorRef.current?.insertPrenom();
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
            <button
              ref={emojiBtnRef}
              type="button"
              disabled={!allowSpecialChars}
              title={
                allowSpecialChars
                  ? "Insérer un emoji"
                  : "Caractères spéciaux désactivés"
              }
              aria-expanded={allowSpecialChars && emojisOpen}
              aria-haspopup={allowSpecialChars ? "dialog" : undefined}
              onClick={() => {
                if (!allowSpecialChars) return;
                setEmojisOpen((v) => !v);
              }}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-all",
                allowSpecialChars
                  ? cn(
                      "cursor-pointer text-slate-600",
                      emojisOpen
                        ? "border-[#2f6fed]/30 bg-[#eef4ff] text-[#2f6fed]"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
                    )
                  : "cursor-not-allowed border-slate-200/70 bg-slate-100 text-slate-300",
              )}
            >
              <Smile className="h-4 w-4" aria-hidden />
            </button>

            <button
              type="button"
              onClick={insertPrenomTag}
              className={cn(
                smsPrenomChipClass,
                "h-8 cursor-pointer px-2 transition-colors hover:border-[#2f6fed]/40 hover:bg-[#dfe9ff]",
              )}
              title="Insérer la balise prénom du destinataire"
            >
              <UserRound className="mr-1 h-3 w-3 shrink-0" aria-hidden />
              Prénom
            </button>
          </div>

          <SmsCompositionCounter
            message={value}
            estimateFirstName={estimateFirstName}
          />
        </div>

        {allowSpecialChars ? (
          <SmsEmojiPicker
            open={emojisOpen && allowSpecialChars}
            onClose={() => setEmojisOpen(false)}
            onPick={insertEmoji}
            anchorRef={emojiBtnRef}
          />
        ) : null}
      </div>
    </div>
  );
}

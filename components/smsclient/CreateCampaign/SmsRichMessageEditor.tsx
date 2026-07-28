"use client";

import { cn } from "@/lib/cn";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  handlePrenomChipKeyDown,
  insertPrenomAtSelection,
  insertTextAtSelection,
  renderSmsEditorValue,
  repairPrenomChips,
  selectAllEditorContents,
  serializeSmsEditor,
  shouldPreventEditorBeforeInput,
} from "./smsMessageEditorDom";
import { SMS_BODY_HARD_MAX_LENGTH } from "@/lib/forms/fieldLimits";

export type SmsRichMessageEditorHandle = {
  insertText: (text: string) => void;
  insertPrenom: () => void;
  focus: () => void;
};

type SmsRichMessageEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export const SmsRichMessageEditor = forwardRef<
  SmsRichMessageEditorHandle,
  SmsRichMessageEditorProps
>(function SmsRichMessageEditor(
  { value, onChange, placeholder, className },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef(value);

  const emitChange = useCallback(() => {
    const root = editorRef.current;
    if (!root) return;
    repairPrenomChips(root);
    let next = serializeSmsEditor(root);
    if (next.length > SMS_BODY_HARD_MAX_LENGTH) {
      next = next.slice(0, SMS_BODY_HARD_MAX_LENGTH);
      renderSmsEditorValue(root, next);
    }
    lastEmittedRef.current = next;
    onChange(next);
  }, [onChange]);

  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const current = root.childNodes.length > 0 ? serializeSmsEditor(root) : "";
    if (current === value) {
      lastEmittedRef.current = value;
      return;
    }
    renderSmsEditorValue(root, value);
    lastEmittedRef.current = value;
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        const root = editorRef.current;
        if (!root) return;
        insertTextAtSelection(root, text);
        emitChange();
      },
      insertPrenom: () => {
        const root = editorRef.current;
        if (!root) return;
        insertPrenomAtSelection(root);
        emitChange();
      },
      focus: () => editorRef.current?.focus(),
    }),
    [emitChange],
  );

  return (
    <div
      ref={editorRef}
      role="textbox"
      aria-multiline="true"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={cn(
        "sms-rich-editor block min-h-28 w-full overflow-y-auto border-none bg-transparent px-3.5 pt-3.5",
        "cursor-text text-sm font-extrabold leading-relaxed text-slate-900 outline-none",
        "empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]",
        "[:empty]:before:font-semibold",
        className,
      )}
      onMouseDown={(e) => {
        if (e.detail !== 3) return;
        e.preventDefault();
        const root = editorRef.current;
        if (!root) return;
        selectAllEditorContents(root);
      }}
      onBeforeInput={(e) => {
        const root = editorRef.current;
        if (!root || !(e.nativeEvent instanceof InputEvent)) return;
        if (shouldPreventEditorBeforeInput(root, e.nativeEvent)) {
          e.preventDefault();
        }
      }}
      onInput={emitChange}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        const root = editorRef.current;
        if (!root) return;
        insertTextAtSelection(root, text);
        emitChange();
      }}
      onKeyDown={(e) => {
        const root = editorRef.current;
        if (!root) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          selectAllEditorContents(root);
          return;
        }

        if (handlePrenomChipKeyDown(root, e)) {
          emitChange();
          return;
        }

        if (e.key !== "Enter") return;
        e.preventDefault();
        insertTextAtSelection(root, "\n");
        emitChange();
      }}
    />
  );
});

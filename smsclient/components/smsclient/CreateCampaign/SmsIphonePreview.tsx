"use client";

import { cn } from "@/lib/cn";
import { previewSmsMessage } from "@/lib/proto/smsPersonalization";
import { useState } from "react";

const IPHONE_MOCKUP_CLASS =
  "select-none cursor-default [&_*]:cursor-default [&_*]:select-none";

/** Largeur du mockup (écran logique iPhone 15, 390×844 pt). */
export const SMS_IPHONE_PREVIEW_WIDTH = 280;

/** Aperçu compact dans le résumé étape 2. */
export const SMS_IPHONE_PREVIEW_WIDTH_COMPACT = 200;

/** Colonne sidebar wizard : téléphone + padding panneau. */
export const SMS_IPHONE_PREVIEW_COLUMN = SMS_IPHONE_PREVIEW_WIDTH + 32;

const IPHONE_SCREEN_ASPECT = "390 / 844";

function formatStatusTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type SmsIphonePreviewProps = {
  message: string;
  sender: string;
  footerLabel?: string;
  width?: number;
  showTitle?: boolean;
};

function IphoneStatusBar({ time, compact }: { time: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-between font-semibold leading-none text-slate-900",
        compact
          ? "h-[18px] px-3 pt-0.5 text-[9px]"
          : "h-[22px] px-4 pt-1 text-[11px]",
      )}
    >
      <span className={cn("tabular-nums", compact ? "w-8" : "w-10")}>{time}</span>
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-black",
          compact ? "top-1 h-[11px] w-[48px]" : "top-1.5 h-[14px] w-[64px]",
        )}
      />
      <div className={cn("flex items-center justify-end gap-1", compact ? "w-8" : "w-10")}>
        <svg viewBox="0 0 16 10" className="h-[9px] w-[15px]" aria-hidden>
          <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="currentColor" />
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill="currentColor" />
          <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill="currentColor" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 14 10" className="h-[9px] w-[13px]" aria-hidden>
          <path
            d="M7 2.2c1.8 0 3.4.7 4.6 1.9l1.2-1.2C11.1 1.4 9.1.5 7 .5S2.9 1.4 1.2 2.9L2.4 4.1C3.6 2.9 5.2 2.2 7 2.2zm0 2.8c1.1 0 2.1.4 2.9 1.2l1.2-1.2c-1.1-1-2.5-1.6-4.1-1.6S3.9 3.8 2.9 4.8l1.2 1.2c.8-.8 1.8-1.2 2.9-1.2zm0 2.8c.5 0 1 .2 1.4.6l1.2-1.2c-.8-.7-1.8-1.1-2.6-1.1s-1.8.4-2.6 1.1l1.2 1.2c.4-.4.9-.6 1.4-.6z"
            fill="currentColor"
          />
          <circle cx="7" cy="8.5" r="1.2" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 22 10" className="h-[9px] w-[20px]" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="18"
            height="9"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.35"
          />
          <rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" />
          <path
            d="M20 3.5v3c.8-.5 1.3-1.3 1.3-2.3S20.8 4 20 3.5z"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}

function MessagesNavBar({ sender, compact }: { sender: string; compact?: boolean }) {
  const initial = (sender.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <div
      className={cn(
        "shrink-0 border-b border-slate-200/80 bg-white/95 px-2",
        compact ? "pb-1.5 pt-0.5" : "pb-2.5 pt-1",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1">
        <div className="flex min-w-0 items-center gap-0.5 self-center text-[#007aff]">
          <svg viewBox="0 0 8 12" className="h-3 w-2 shrink-0" aria-hidden>
            <path
              d="M7 1.2 2.8 6 7 10.8 5.8 12 0 6l5.8-6z"
              fill="currentColor"
            />
          </svg>
          <span className={cn("truncate font-medium", compact ? "text-[9px]" : "text-[11px]")}>
            Messages
          </span>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-col items-center px-1",
            compact ? "max-w-[108px]" : "max-w-[148px]",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 font-bold text-white",
              compact ? "h-6 w-6 text-[8px]" : "h-8 w-8 text-[10px]",
            )}
          >
            {initial}
          </div>
          <span
            className={cn(
              "mt-0.5 w-full truncate text-center font-semibold leading-tight text-slate-900",
              compact ? "text-[9px]" : "text-[11px]",
            )}
            title={sender}
          >
            {sender}
          </span>
        </div>

        <div className="flex justify-end self-center">
          <svg
            viewBox="0 0 16 16"
            className={cn("text-[#007aff]", compact ? "h-3 w-3" : "h-4 w-4")}
            aria-hidden
          >
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8 7.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zm0 1.1c-1.2 0-2.2.6-2.2 1.3v.4h4.4v-.4c0-.7-1-1.3-2.2-1.3z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function SmsIphonePreview({
  message,
  sender,
  footerLabel,
  width = SMS_IPHONE_PREVIEW_WIDTH,
  showTitle = true,
}: SmsIphonePreviewProps) {
  const [time] = useState(() => formatStatusTime(new Date()));
  const compact = width <= SMS_IPHONE_PREVIEW_WIDTH_COMPACT + 8;

  const trimmed = message.trim();
  const isEmpty = !trimmed;
  const displayMessage = isEmpty
    ? "Votre message apparaîtra ici…"
    : previewSmsMessage(trimmed);

  return (
    <div className="flex min-h-0 flex-col">
      {showTitle ? (
        <h3
          className={cn(
            "m-0 shrink-0 text-center font-black text-slate-900",
            compact ? "mb-1.5 text-[11px]" : "mb-2 text-sm",
          )}
        >
          Aperçu du SMS
        </h3>
      ) : null}
      <div
        className={cn(
          "mx-auto w-full shrink-0 bg-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.12)]",
          compact ? "rounded-[26px] p-1.5" : "rounded-[36px] p-2",
          IPHONE_MOCKUP_CLASS,
        )}
        style={{
          width,
          maxWidth: "100%",
        }}
        aria-hidden
      >
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden bg-white",
            compact ? "rounded-[20px]" : "rounded-[28px]",
          )}
          style={{ aspectRatio: IPHONE_SCREEN_ASPECT }}
        >
          <IphoneStatusBar time={time || "—"} compact={compact} />
          <MessagesNavBar sender={sender} compact={compact} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f2f2f7]">
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto",
                compact ? "px-2 py-2.5" : "px-3 py-4",
              )}
            >
              <p
                className={cn(
                  "mb-2 text-center font-medium text-slate-400",
                  compact ? "text-[8px]" : "text-[10px]",
                )}
              >
                {time ? `Aujourd\u2019hui ${time}` : "—"}
              </p>
              <div className="flex justify-start">
                <div
                  className={cn(
                    "max-w-[88%] rounded-[18px] rounded-bl-[5px] bg-[#e9e9eb] text-slate-900 shadow-[0_1px_1px_rgba(0,0,0,0.04)]",
                    compact
                      ? "px-2 py-1.5 text-[11px] leading-snug"
                      : "px-3 py-2.5 text-[15px] leading-[1.35]",
                  )}
                  style={{ wordBreak: "break-word" }}
                >
                  <p
                    className={
                      isEmpty
                        ? "m-0 italic text-slate-400"
                        : "m-0 whitespace-pre-wrap"
                    }
                  >
                    {displayMessage}
                  </p>
                </div>
              </div>
              <p className={cn("mt-1 pl-1 text-slate-400", compact ? "text-[7px]" : "text-[9px]")}>
                SMS
              </p>
            </div>
            <div className="shrink-0 border-t border-slate-200/60 px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex-1 rounded-full border border-slate-300/80 bg-white text-slate-400",
                    compact ? "h-5 px-2 text-[8px] leading-5" : "h-7 px-3 text-[11px] leading-7",
                  )}
                >
                  Message
                </div>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full bg-[#007aff] font-bold text-white",
                    compact ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[11px]",
                  )}
                >
                  ↑
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-center pb-1 pt-0.5">
              <div className={cn("rounded-full bg-slate-900/80", compact ? "h-0.5 w-16" : "h-1 w-24")} />
            </div>
          </div>
        </div>
      </div>
      {footerLabel ? (
        <p
          className={cn(
            "mt-2 shrink-0 text-center font-bold text-slate-500",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {footerLabel}
        </p>
      ) : null}
    </div>
  );
}

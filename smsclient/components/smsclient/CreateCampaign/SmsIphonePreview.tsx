"use client";

import { cn } from "@/lib/cn";
import { previewSmsMessage } from "@/lib/proto/smsPersonalization";
import { useEffect, useState } from "react";

const IPHONE_MOCKUP_CLASS =
  "select-none cursor-default [&_*]:cursor-default [&_*]:select-none";

/** Largeur du mockup (écran logique iPhone 15, 390×844 pt). */
export const SMS_IPHONE_PREVIEW_WIDTH = 280;

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
};

function IphoneStatusBar({ time }: { time: string }) {
  return (
    <div className="relative flex h-[22px] shrink-0 items-center justify-between px-4 pt-1 text-[11px] font-semibold leading-none text-slate-900">
      <span className="w-10 tabular-nums">{time}</span>
      <div className="pointer-events-none absolute left-1/2 top-1.5 h-[14px] w-[64px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex w-10 items-center justify-end gap-1">
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

function MessagesNavBar({ sender }: { sender: string }) {
  const initial = (sender.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-white/95 px-2 pb-2.5 pt-1">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1">
        <div className="flex min-w-0 items-center gap-0.5 self-center text-[#007aff]">
          <svg viewBox="0 0 8 12" className="h-3 w-2 shrink-0" aria-hidden>
            <path
              d="M7 1.2 2.8 6 7 10.8 5.8 12 0 6l5.8-6z"
              fill="currentColor"
            />
          </svg>
          <span className="truncate text-[11px] font-medium">Messages</span>
        </div>

        <div className="flex min-w-0 max-w-[148px] flex-col items-center px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-[10px] font-bold text-white">
            {initial}
          </div>
          <span
            className="mt-0.5 w-full truncate text-center text-[11px] font-semibold leading-tight text-slate-900"
            title={sender}
          >
            {sender}
          </span>
        </div>

        <div className="flex justify-end self-center">
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#007aff]" aria-hidden>
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
}: SmsIphonePreviewProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(formatStatusTime(new Date()));
  }, []);

  const trimmed = message.trim();
  const isEmpty = !trimmed;
  const displayMessage = isEmpty
    ? "Votre message apparaîtra ici…"
    : previewSmsMessage(trimmed);

  return (
    <div className="flex min-h-0 flex-col">
      <h3 className="m-0 mb-2 shrink-0 text-center text-sm font-black text-slate-900">
        Aperçu du SMS
      </h3>
      <div
        className={cn(
          "mx-auto w-full shrink-0 rounded-[36px] bg-slate-900 p-2 shadow-[0_14px_28px_rgba(15,23,42,0.12)]",
          IPHONE_MOCKUP_CLASS,
        )}
        style={{
          width: SMS_IPHONE_PREVIEW_WIDTH,
          maxWidth: "100%",
        }}
        aria-hidden
      >
        <div
          className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-white"
          style={{ aspectRatio: IPHONE_SCREEN_ASPECT }}
        >
          <IphoneStatusBar time={time || "—"} />
          <MessagesNavBar sender={sender} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f2f2f7]">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-3 text-center text-[10px] font-medium text-slate-400">
                {time ? `Aujourd\u2019hui ${time}` : "—"}
              </p>
              <div className="flex justify-start">
                <div
                  className="max-w-[88%] rounded-[18px] rounded-bl-[5px] bg-[#e9e9eb] px-3 py-2.5 text-[15px] leading-[1.35] text-slate-900 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
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
              <p className="mt-1.5 pl-1 text-[9px] text-slate-400">SMS</p>
            </div>
            <div className="shrink-0 border-t border-slate-200/60 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="h-7 flex-1 rounded-full border border-slate-300/80 bg-white px-3 text-[11px] leading-7 text-slate-400">
                  Message
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007aff] text-[11px] font-bold text-white">
                  ↑
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-center pb-1.5 pt-0.5">
              <div className="h-1 w-24 rounded-full bg-slate-900/80" />
            </div>
          </div>
        </div>
      </div>
      {footerLabel ? (
        <p className="mt-2 shrink-0 text-center text-xs font-bold text-slate-500">
          {footerLabel}
        </p>
      ) : null}
    </div>
  );
}

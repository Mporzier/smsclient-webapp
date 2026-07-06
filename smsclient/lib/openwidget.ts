import {
  scheduleOpenWidgetRightOffsetSync,
} from "@/lib/openwidgetOffset";

export type OpenWidgetFeature =
  | "chat"
  | "faq"
  | "form-contact"
  | "form-feedback"
  | "form-bugreport";

type OpenWidgetClient = {
  call: (method: string, data?: Record<string, string>) => void;
  on: (event: string, handler: () => void) => void;
  init: () => void;
};

declare global {
  interface Window {
    OpenWidget?: OpenWidgetClient;
  }
}

export function isOpenWidgetEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_OPENWIDGET_ORG_ID?.trim());
}

export function openOpenWidget(
  feature?: OpenWidgetFeature,
  messageDraft?: string
): boolean {
  if (typeof window === "undefined" || !window.OpenWidget) return false;

  if (!feature) {
    window.OpenWidget.call("maximize");
    scheduleOpenWidgetRightOffsetSync();
    return true;
  }

  const payload: Record<string, string> = { feature };
  if (feature === "chat" && messageDraft) {
    payload.messageDraft = messageDraft;
  }

  window.OpenWidget.call("maximize", payload);
  scheduleOpenWidgetRightOffsetSync();
  return true;
}

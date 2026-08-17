"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "@/hooks/useTheme";
import {
  Toaster as Sonner,
  toast as sonnerToast,
  type ExternalToast,
  type ToasterProps,
} from "sonner";

type ToastMessage = string | ReactNode;

const defaultIcon = <Info className="size-4 shrink-0" />;

function withDefaultIcon(data?: ExternalToast): ExternalToast {
  return { icon: defaultIcon, ...data };
}

/** App toast — icône Info par défaut si non typé. */
export const toast = Object.assign(
  (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast(message, withDefaultIcon(data)),
  {
    success: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.success(message, data),
    error: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.error(message, data),
    info: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.info(message, data),
    warning: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.warning(message, data),
    message: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.message(message, withDefaultIcon(data)),
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
  },
);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      closeButton
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        error: <CircleAlert className="size-4" />,
        loading: <Spinner className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--toast-bg)",
          "--normal-text": "var(--toast-fg)",
          "--normal-border": "var(--toast-border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--toast-bg)",
          "--error-bg": "var(--toast-bg-error)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast group toast",
          title: "text-sm font-semibold",
          description: "text-sm",
          icon: "",
          closeButton: "",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

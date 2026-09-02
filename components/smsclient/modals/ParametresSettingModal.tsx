"use client";

import { FormDialogShell } from "@/components/smsclient/modals/FormDialogShell";
import type { ReactNode } from "react";

type ParametresSettingModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon: ReactNode;
  /** Pas de cadre `.modal-icon` (ex. drapeau SVG) */
  bareIcon?: boolean;
  onClose: () => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  saveLabel?: string;
  wide?: boolean;
  bodyClassName?: string;
  children: ReactNode;
};

/** Alias Paramètres → shell formulaire partagé (croix standard). */
export function ParametresSettingModal(props: ParametresSettingModalProps) {
  return <FormDialogShell {...props} />;
}

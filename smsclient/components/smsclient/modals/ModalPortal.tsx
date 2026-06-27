"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ModalPortalProps = {
  children: ReactNode;
};

export function ModalPortal({ children }: ModalPortalProps) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

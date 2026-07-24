import { useState } from "react";
import type { MouseEvent } from "react";

/** Compare deux listes de chaînes (ordre indépendant). */
export function sortedStringArraysEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export type ContactFormSnapshot = {
  first: string;
  last: string;
  phone: string;
  birthday: string;
  notes: string;
  groups: string[];
  customFields: Record<string, string>;
};

export function contactFormSnapshotsEqual(
  a: ContactFormSnapshot,
  b: ContactFormSnapshot,
): boolean {
  const customKeys = new Set([
    ...Object.keys(a.customFields),
    ...Object.keys(b.customFields),
  ]);
  for (const k of customKeys) {
    if ((a.customFields[k] ?? "") !== (b.customFields[k] ?? "")) return false;
  }
  return (
    a.first === b.first &&
    a.last === b.last &&
    a.phone === b.phone &&
    a.birthday === b.birthday &&
    a.notes === b.notes &&
    sortedStringArraysEqual(a.groups, b.groups)
  );
}

export type GroupFormSnapshot = {
  name: string;
  description: string;
  selectedIds: string[];
};

export function groupFormSnapshotsEqual(
  a: GroupFormSnapshot,
  b: GroupFormSnapshot,
): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    sortedStringArraysEqual(a.selectedIds, b.selectedIds)
  );
}

export type GroupQuickFormSnapshot = {
  name: string;
  description: string;
};

export function groupQuickFormSnapshotsEqual(
  a: GroupQuickFormSnapshot,
  b: GroupQuickFormSnapshot,
): boolean {
  return a.name === b.name && a.description === b.description;
}

export type SmsLinkFormSnapshot = {
  originalUrl: string;
  label: string;
};

export function smsLinkFormSnapshotsEqual(
  a: SmsLinkFormSnapshot,
  b: SmsLinkFormSnapshot,
): boolean {
  return a.originalUrl === b.originalUrl && a.label === b.label;
}

/**
 * Ferme la modale au clic sur l’overlay uniquement si autorisé.
 */
export function handleModalBackdropClick(
  e: MouseEvent<HTMLElement>,
  onClose: () => void,
  _isDirty: boolean,
  canClose = true,
): void {
  if (e.target !== e.currentTarget || !canClose) return;
  onClose();
}

/** True s’il y a plus d’une Dialog / AlertDialog ouverte (confirm empilée, etc.). */
export function hasStackedOpenDialog(): boolean {
  if (typeof document === "undefined") return false;
  const nodes = document.querySelectorAll(
    '[data-slot="dialog-content"], [data-slot="alert-dialog-content"]',
  );
  let openCount = 0;
  for (const el of nodes) {
    if (
      el.getAttribute("data-state") === "open" ||
      el.hasAttribute("data-open")
    ) {
      openCount += 1;
    }
  }
  return openCount > 1;
}

/**
 * Mémorise l’état du formulaire à l’ouverture et détecte les modifications.
 * Baseline capturée au render suivant l’ouverture (après reset des seeds).
 */
export function useModalFormDirty<T>(
  open: boolean,
  snapshot: T,
  equals: (a: T, b: T) => boolean,
): boolean {
  const [baseline, setBaseline] = useState<T | null>(null);
  const [captureNext, setCaptureNext] = useState(open);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBaseline(null);
      setCaptureNext(true);
    } else {
      setBaseline(null);
      setCaptureNext(false);
    }
  }

  if (open && captureNext) {
    setCaptureNext(false);
    setBaseline(snapshot);
  }

  if (!open || baseline === null) return false;
  return !equals(snapshot, baseline);
}

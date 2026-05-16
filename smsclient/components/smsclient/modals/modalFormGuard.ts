import { useRef } from "react";
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
  notes: string;
  groups: string[];
};

export function contactFormSnapshotsEqual(
  a: ContactFormSnapshot,
  b: ContactFormSnapshot,
): boolean {
  return (
    a.first === b.first &&
    a.last === b.last &&
    a.phone === b.phone &&
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

/**
 * Ferme la modale au clic sur l’overlay uniquement si le formulaire n’a pas changé.
 */
export function handleModalBackdropClick(
  e: MouseEvent<HTMLElement>,
  onClose: () => void,
  isDirty: boolean,
  canClose = true,
): void {
  if (e.target !== e.currentTarget || !canClose || isDirty) return;
  onClose();
}

/**
 * Mémorise l’état du formulaire à l’ouverture de la modale et détecte les modifications.
 */
export function useModalFormDirty<T>(
  open: boolean,
  snapshot: T,
  equals: (a: T, b: T) => boolean,
): boolean {
  const initialRef = useRef<T | null>(null);
  const wasOpenRef = useRef(false);

  if (open && !wasOpenRef.current) {
    initialRef.current = snapshot;
  }
  if (!open) {
    initialRef.current = null;
  }
  wasOpenRef.current = open;

  if (!open || initialRef.current === null) return false;
  return !equals(snapshot, initialRef.current);
}

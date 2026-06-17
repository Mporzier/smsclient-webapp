import {
  normalizePrenomTokens,
  SMS_PRENOM_TAG,
} from "@/lib/proto/smsPersonalization";
import { smsPrenomBubbleClass } from "./smsPrenomTagStyles";

const PRENOM_TOKEN_SPLIT_RE =
  /(⟦prénom⟧|\{PRENOM\}|\{prenom\}|\{\{prenom\}\})/gi;

const PRENOM_TOKEN_PART_RE =
  /^(⟦prénom⟧|\{PRENOM\}|\{prenom\}|\{\{prenom\}\})$/i;

export const SMS_PRENOM_CHIP_ATTR = "data-sms-prenom";
const PRENOM_CHIP_LABEL = "Prénom";

export function isPrenomChipElement(
  node: Node | null | undefined,
): node is HTMLElement {
  return (
    node instanceof HTMLElement && node.hasAttribute(SMS_PRENOM_CHIP_ATTR)
  );
}

export function findPrenomChipAncestor(
  node: Node | null,
  root: HTMLElement,
): HTMLElement | null {
  let cur: Node | null = node;
  while (cur && cur !== root) {
    if (isPrenomChipElement(cur)) return cur;
    cur = cur.parentNode;
  }
  return null;
}

function selectionIntersectsChip(root: HTMLElement, range: Range): boolean {
  const chips = root.querySelectorAll(`[${SMS_PRENOM_CHIP_ATTR}]`);
  for (const chip of chips) {
    if (range.intersectsNode(chip)) return true;
  }
  return false;
}

function nodeBeforeCaret(root: HTMLElement, range: Range): Node | null {
  const { startContainer, startOffset } = range;
  if (startContainer === root) {
    return startOffset > 0 ? (root.childNodes[startOffset - 1] ?? null) : null;
  }
  if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
    return null;
  }

  let cur: Node | null = startContainer;
  if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
    cur = startContainer;
  }
  while (cur && cur !== root) {
    if (cur.previousSibling) return cur.previousSibling;
    cur = cur.parentNode;
  }
  return null;
}

function nodeAfterCaret(root: HTMLElement, range: Range): Node | null {
  const { startContainer, startOffset } = range;
  if (startContainer === root) {
    return root.childNodes[startOffset] ?? null;
  }
  if (
    startContainer.nodeType === Node.TEXT_NODE &&
    startOffset < (startContainer.textContent?.length ?? 0)
  ) {
    return null;
  }

  let cur: Node | null = startContainer;
  if (
    startContainer.nodeType === Node.TEXT_NODE &&
    startOffset === (startContainer.textContent?.length ?? 0)
  ) {
    cur = startContainer;
  }
  while (cur && cur !== root) {
    if (cur.nextSibling) return cur.nextSibling;
    cur = cur.parentNode;
  }
  return null;
}

export function createPrenomChipElement(): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.setAttribute(SMS_PRENOM_CHIP_ATTR, "");
  chip.className = smsPrenomBubbleClass;
  chip.setAttribute("aria-label", "Balise prénom");
  chip.textContent = PRENOM_CHIP_LABEL;
  return chip;
}

export function serializeSmsEditor(root: HTMLElement): string {
  let result = "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    if (node.hasAttribute(SMS_PRENOM_CHIP_ATTR)) {
      result += SMS_PRENOM_TAG;
      return;
    }

    if (node.tagName === "BR") {
      result += "\n";
      return;
    }

    node.childNodes.forEach(walk);
  };

  root.childNodes.forEach(walk);
  return normalizePrenomTokens(result);
}

export function renderSmsEditorValue(root: HTMLElement, value: string) {
  root.replaceChildren();
  const normalized = normalizePrenomTokens(value);
  if (!normalized) return;

  const parts = normalized.split(PRENOM_TOKEN_SPLIT_RE);
  for (const part of parts) {
    if (!part) continue;
    if (PRENOM_TOKEN_PART_RE.test(part)) {
      root.appendChild(createPrenomChipElement());
      continue;
    }
    root.appendChild(document.createTextNode(part));
  }
}

export function repairPrenomChips(root: HTMLElement) {
  root.querySelectorAll(`[${SMS_PRENOM_CHIP_ATTR}]`).forEach((chip) => {
    if (chip.textContent !== PRENOM_CHIP_LABEL) {
      chip.textContent = PRENOM_CHIP_LABEL;
    }
  });
}

export function shouldPreventEditorBeforeInput(
  root: HTMLElement,
  e: InputEvent,
): boolean {
  if (e.inputType.startsWith("delete")) return false;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (findPrenomChipAncestor(range.startContainer, root)) return true;
  if (!range.collapsed && selectionIntersectsChip(root, range)) return true;
  return false;
}

export function handlePrenomChipKeyDown(
  root: HTMLElement,
  e: KeyboardEvent,
): boolean {
  if (e.key !== "Backspace" && e.key !== "Delete") return false;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);

  const chipInside = findPrenomChipAncestor(range.startContainer, root);
  if (chipInside) {
    e.preventDefault();
    chipInside.remove();
    return true;
  }

  if (!sel.isCollapsed) return false;

  if (e.key === "Backspace") {
    const prev = nodeBeforeCaret(root, range);
    if (isPrenomChipElement(prev)) {
      e.preventDefault();
      prev.remove();
      return true;
    }
  }

  if (e.key === "Delete") {
    const next = nodeAfterCaret(root, range);
    if (isPrenomChipElement(next)) {
      e.preventDefault();
      next.remove();
      return true;
    }
  }

  return false;
}

function getActiveRange(root: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  return range;
}

function placeCaretAfter(node: Node) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function insertTextAtSelection(root: HTMLElement, text: string) {
  root.focus();
  const range = getActiveRange(root);
  const node = document.createTextNode(text);

  if (!range) {
    root.appendChild(node);
    placeCaretAfter(node);
    return;
  }

  range.deleteContents();
  range.insertNode(node);
  placeCaretAfter(node);
}

/** Sélectionne tout le contenu, y compris les bulles prénom. */
export function selectAllEditorContents(root: HTMLElement) {
  root.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(root, 0);
  range.setEnd(root, root.childNodes.length);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function insertPrenomAtSelection(root: HTMLElement) {
  root.focus();
  const range = getActiveRange(root);
  const chip = createPrenomChipElement();

  if (!range) {
    root.appendChild(chip);
    placeCaretAfter(chip);
    return;
  }

  range.deleteContents();
  range.insertNode(chip);
  placeCaretAfter(chip);
}

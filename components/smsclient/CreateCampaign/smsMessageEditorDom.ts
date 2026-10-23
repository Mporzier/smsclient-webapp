import { smsEditorBodyWithinBillableLimit } from "@/lib/proto/smsStopMention";
import { normalizePrenomTokens, SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";
import { smsPrenomBubbleClass } from "./smsPrenomTagStyles";

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

  const lines = normalized.split("\n");
  lines.forEach((line, i) => {
    if (line) root.appendChild(document.createTextNode(line));
    if (i < lines.length - 1) root.appendChild(document.createElement("br"));
  });
}

/**
 * Les navigateurs laissent un `<br>` témoin quand l'éditeur est vidé à la main :
 * il compte pour un saut de ligne et empêche le placeholder `:empty` de revenir.
 */
export function clearFillerBreaks(root: HTMLElement) {
  const isFiller = (node: Node) =>
    (node instanceof HTMLElement && node.tagName === "BR") ||
    (node.nodeType === Node.TEXT_NODE && !node.textContent);
  if (root.childNodes.length === 0) return;
  if (!Array.from(root.childNodes).every(isFiller)) return;
  root.replaceChildren();
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
  reserveStop = false,
): boolean {
  if (e.inputType.startsWith("delete")) return false;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (findPrenomChipAncestor(range.startContainer, root)) return true;
  if (!range.collapsed && selectionIntersectsChip(root, range)) return true;

  if (
    range.collapsed &&
    !smsEditorBodyWithinBillableLimit(serializeSmsEditor(root), reserveStop)
  ) {
    return true;
  }
  return false;
}

type EditorKeyEvent = Pick<KeyboardEvent, "key"> & {
  preventDefault(): void;
};

export function handlePrenomChipKeyDown(
  root: HTMLElement,
  e: EditorKeyEvent,
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

/** Offset dans le texte sérialisé (sélection avant fermeture popover emoji / menu). */
export function getSerializedCaretOffset(root: HTMLElement): number | null {
  const range = getActiveRange(root);
  if (!range) return null;
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.startContainer, range.startOffset);
  const holder = document.createElement("div");
  holder.appendChild(pre.cloneContents());
  return serializeSmsEditor(holder).length;
}

function setSelectionAtSerializedOffset(root: HTMLElement, targetOffset: number) {
  const sel = window.getSelection();
  if (!sel) return;

  const apply = (container: Node, offset: number) => {
    const range = document.createRange();
    range.setStart(container, offset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  if (targetOffset <= 0) {
    if (root.childNodes.length === 0) {
      apply(root, 0);
      return;
    }
    const first = root.firstChild!;
    if (first.nodeType === Node.TEXT_NODE) apply(first, 0);
    else apply(root, 0);
    return;
  }

  let remaining = targetOffset;

  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent ?? "").length;
      if (remaining <= len) {
        apply(node, remaining);
        return true;
      }
      remaining -= len;
      return false;
    }
    if (node instanceof HTMLElement) {
      if (node.hasAttribute(SMS_PRENOM_CHIP_ATTR)) {
        const len = SMS_PRENOM_TAG.length;
        if (remaining <= len) {
          const parent = node.parentNode ?? root;
          const idx = Array.prototype.indexOf.call(parent.childNodes, node);
          apply(parent, remaining < len ? idx : idx + 1);
          return true;
        }
        remaining -= len;
        return false;
      }
      if (node.tagName === "BR") {
        if (remaining <= 1) {
          const idx = Array.prototype.indexOf.call(root.childNodes, node);
          apply(root, remaining < 1 ? idx : idx + 1);
          return true;
        }
        remaining -= 1;
        return false;
      }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i]!)) return true;
    }
    return false;
  };

  for (let i = 0; i < root.childNodes.length; i++) {
    if (walk(root.childNodes[i]!)) return;
  }

  if (root.childNodes.length === 0) {
    apply(root, 0);
    return;
  }
  const last = root.lastChild!;
  if (last.nodeType === Node.TEXT_NODE) {
    apply(last, (last.textContent ?? "").length);
  } else {
    apply(root, root.childNodes.length);
  }
}

function placeCaretAfter(node: Node) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function insertTextAtSelection(
  root: HTMLElement,
  text: string,
  caretOffset?: number | null,
) {
  root.focus();
  if (caretOffset != null) {
    setSelectionAtSerializedOffset(root, caretOffset);
  }
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
  insertTextAtSelection(root, SMS_PRENOM_TAG);
}

import type { SettingSectionId } from "@/components/smsclient/views/parametres/parametresSettings";
import { settingSections } from "@/components/smsclient/views/parametres/parametresSettings";

const STORAGE_KEY = "smsclient.parametresSection";
export const PARAMETRES_SECTION_EVENT = "smsclient:parametres-section";

const SECTION_IDS = new Set(
  settingSections.map((s) => s.id) as SettingSectionId[],
);

export function isSettingSectionId(s: string): s is SettingSectionId {
  return SECTION_IDS.has(s as SettingSectionId);
}

/** Demande l’onglet Paramètres (ex. dropdown Mon profil → compte). */
export function requestParametresSection(section: SettingSectionId) {
  try {
    sessionStorage.setItem(STORAGE_KEY, section);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(PARAMETRES_SECTION_EVENT, { detail: section }),
  );
}

export function consumeRequestedParametresSection(): SettingSectionId | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (raw && isSettingSectionId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

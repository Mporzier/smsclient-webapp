/** Compare ISO timestamps ascending. Missing/invalid sort after valid values. */
export function compareIsoTimestamps(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const ta = a ? Date.parse(a) : Number.NaN;
  const tb = b ? Date.parse(b) : Number.NaN;
  const aOk = Number.isFinite(ta);
  const bOk = Number.isFinite(tb);
  if (!aOk && !bOk) return 0;
  if (!aOk) return 1;
  if (!bOk) return -1;
  return ta === tb ? 0 : ta < tb ? -1 : 1;
}

/** Asc date compare with stable tie-break so asc/desc never look identical. */
export function compareIsoTimestampsStable(
  aIso: string | null | undefined,
  bIso: string | null | undefined,
  aId: string,
  bId: string,
): number {
  const c = compareIsoTimestamps(aIso, bIso);
  if (c !== 0) return c;
  return aId < bId ? -1 : aId > bId ? 1 : 0;
}

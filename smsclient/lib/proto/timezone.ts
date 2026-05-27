const TIMEZONE = "Europe/Paris";

export function parisDateParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    fmt.formatToParts(d).map((x) => [x.type, x.value]),
  );
  return {
    year: p.year,
    month: p.month,
    day: p.day,
    hour: p.hour === "24" ? "00" : p.hour,
    minute: p.minute,
  };
}

/**
 * Retourne "YYYY-MM-DDTHH:MM" en heure de Paris (now + 10 min).
 */
export function plusTenMinutesParis(): string {
  const { year, month, day, hour, minute } = parisDateParts(
    new Date(Date.now() + 10 * 60 * 1000),
  );
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Convertit "YYYY-MM-DDTHH:MM" (interprété comme heure de Paris) en ISO UTC.
 */
export function parisLocalToISO(localStr: string): string {
  const [datePart, timePart] = localStr.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = (timePart ?? "00:00").split(":").map(Number);

  for (const offsetH of [2, 1]) {
    const utc = new Date(Date.UTC(y, mo - 1, d, h - offsetH, mi));
    const check = parisDateParts(utc);
    if (
      Number(check.year) === y &&
      Number(check.month) === mo &&
      Number(check.day) === d &&
      Number(check.hour) === h &&
      Number(check.minute) === mi
    ) {
      return utc.toISOString();
    }
  }
  return new Date(Date.UTC(y, mo - 1, d, h - 1, mi)).toISOString();
}

/**
 * Vérifie si une date locale Paris (format "YYYY-MM-DDTHH:MM") est dans le passé.
 */
export function isParisDateInPast(localStr: string): boolean {
  const iso = parisLocalToISO(localStr);
  return new Date(iso).getTime() < Date.now();
}

/** Date calendaire JJ/MM/AAAA en fuseau Europe/Paris (évite le décalage d’un jour). */
export function formatParisCalendarDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const { day, month, year } = parisDateParts(new Date(iso));
  return `${day}/${month}/${year}`;
}

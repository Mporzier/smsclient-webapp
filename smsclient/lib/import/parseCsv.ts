/** Parse une ligne CSV avec guillemets RFC-style (séparateur , ; ou tab). */
export function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let i = 0;
  let field = "";
  let inQ = false;
  while (i < line.length) {
    const c = line[i]!;
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
    } else {
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === delimiter) {
        out.push(field);
        field = "";
        i++;
        continue;
      }
      field += c;
      i++;
    }
  }
  out.push(field);
  return out.map((s) => s.trim());
}

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

export function detectDelimiter(firstLine: string): "," | ";" | "\t" {
  const comma = (firstLine.match(/,/g) ?? []).length;
  const semi = (firstLine.match(/;/g) ?? []).length;
  const tab = (firstLine.match(/\t/g) ?? []).length;
  if (semi >= comma && semi >= tab) return ";";
  if (tab >= comma && tab >= semi) return "\t";
  return ",";
}

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  delimiter: "," | ";" | "\t";
};

function normalizeRow(cells: string[], len: number): string[] {
  const r = [...cells];
  while (r.length < len) r.push("");
  return r.slice(0, len);
}

/**
 * Parse le fichier texte CSV (première ligne = en-têtes).
 * Lignes entièrement vides ignorées ; lignes avec moins de colonnes complétées par "".
 */
export function parseCsvText(
  raw: string,
  delimiter?: "," | ";" | "\t",
): ParsedCsv {
  const text = stripBom(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter((ln) => ln.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: "," };
  }
  const delim = delimiter ?? detectDelimiter(lines[0]!);
  const headers = parseCsvLine(lines[0]!, delim);
  const n = headers.length;
  const rows: string[][] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = normalizeRow(parseCsvLine(lines[li]!, delim), n);
    if (cells.every((c) => c.trim() === "")) continue;
    rows.push(cells);
  }
  return { headers, rows, delimiter: delim };
}

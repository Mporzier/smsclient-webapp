import { describe, expect, it } from "vitest";
import { escapeIlike } from "@/lib/supabase/clientSearch";

describe("escapeIlike", () => {
  it("escapes % _ and backslash", () => {
    expect(escapeIlike(`a%b_c\\d`)).toBe(`a\\%b\\_c\\\\d`);
  });
});

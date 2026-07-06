import {
  getKnowledgeBaseOrigin,
  knowledgeBaseArticleUrl,
} from "@/lib/knowledgeBase";
import { describe, expect, it } from "vitest";

describe("knowledgeBase", () => {
  it("construit l’URL d’article avec le slug", () => {
    expect(knowledgeBaseArticleUrl("contacts")).toBe(
      `${getKnowledgeBaseOrigin()}/articles/contacts`,
    );
  });
});

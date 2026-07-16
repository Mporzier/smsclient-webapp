"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { knowledgeBaseArticleUrl } from "@/lib/knowledgeBase";
import {
  SECTION_GUIDES,
  type SectionGuideKey,
} from "@/lib/sectionGuides";
import { BookOpen, Sparkles } from "lucide-react";

type SectionGuideCardProps = {
  section: SectionGuideKey;
  className?: string;
  onPrimaryAction?: () => void;
  onNavigate?: (hash: string) => void;
};

export function SectionGuideCard({
  section,
  className,
  onPrimaryAction,
  onNavigate,
}: SectionGuideCardProps) {
  const guide = SECTION_GUIDES[section];
  const Icon = guide.icon;

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }
    if (guide.primaryRoute && onNavigate) {
      onNavigate(guide.primaryRoute);
    }
  };

  const showPrimary =
    Boolean(onPrimaryAction) ||
    Boolean(guide.primaryRoute && onNavigate && guide.primaryLabel);

  return (
    <article
      role="note"
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-accent via-card to-card px-4 py-3 text-card-foreground shadow-xs",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />
      <div className="relative flex gap-3">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-foreground"
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-3" aria-hidden />
              {guide.eyebrow}
            </span>
            <h2 className="m-0 text-sm font-medium leading-none text-foreground">
              {guide.title}
            </h2>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              {guide.description}
            </p>
          </div>

          <ul className="m-0 grid list-none gap-1.5 p-0 min-[900px]:grid-cols-3 min-[900px]:gap-x-4">
            {guide.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-sm leading-snug text-muted-foreground"
              >
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40"
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showPrimary && guide.primaryLabel && (
              <Button type="button" size="sm" onClick={handlePrimary}>
                {guide.primaryLabel}
              </Button>
            )}
            <Button variant="link" size="sm" asChild>
              <a
                href={knowledgeBaseArticleUrl(guide.kbSlug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen data-icon="inline-start" aria-hidden />
                Base de connaissance
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

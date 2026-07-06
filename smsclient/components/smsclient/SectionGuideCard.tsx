"use client";

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
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#c5d7f6] bg-gradient-to-br from-[#eef4ff] via-white to-[#f8fbff] px-4 py-3.5 shadow-[0_10px_28px_rgba(22,72,232,0.07)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#1648e8]/[0.06]"
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 right-0 h-1 w-32 bg-gradient-to-r opacity-80",
          guide.accent
        )}
        aria-hidden
      />

      <div className="relative flex gap-3.5 min-[720px]:items-start">
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-[0_8px_18px_rgba(22,72,232,0.22)]",
            guide.iconBg
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ff] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1648e8]">
              <Sparkles className="h-3 w-3" aria-hidden />
              {guide.eyebrow}
            </span>
          </div>

          <h2 className="m-0 mt-1.5 text-base font-extrabold leading-snug text-[#0b1b3f] min-[900px]:text-lg">
            {guide.title}
          </h2>
          <p className="m-0 mt-1 text-xs leading-relaxed text-[#344260] min-[900px]:text-sm">
            {guide.description}
          </p>

          <ul className="m-0 mt-2 grid list-none gap-1 p-0 min-[900px]:grid-cols-3 min-[900px]:gap-x-4">
            {guide.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-1.5 text-[11px] leading-snug text-[#3f4d68] min-[900px]:text-xs"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#1648e8]"
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {showPrimary && guide.primaryLabel && (
              <button
                type="button"
                onClick={handlePrimary}
                className="inline-flex cursor-pointer items-center rounded-lg border-0 bg-[#1648e8] px-3.5 py-2 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(22,72,232,0.22)] transition-[filter] hover:brightness-105"
              >
                {guide.primaryLabel}
              </button>
            )}
            <a
              href={knowledgeBaseArticleUrl(guide.kbSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1648e8] no-underline hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Base de connaissance →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

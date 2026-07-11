import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer flex-col rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon
        className="h-4 w-4 shrink-0 text-[#2f6fed]"
        strokeWidth={2}
        aria-hidden
      />
      <span className="mt-2 text-sm font-bold leading-tight text-slate-900">
        {title}
      </span>
      <span className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
        {description}
      </span>
    </button>
  );
}

export function ModalPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {children}
    </div>
  );
}

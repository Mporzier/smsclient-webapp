"use client";

import { AutomationEditModal } from "@/components/smsclient/modals/AutomationEditModal";
import { SectionGuideCard } from "@/components/smsclient/SectionGuideCard";
import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isCampaignEligibleContact } from "@/lib/types/contact";
import type {
  AutomationRowData,
  AutomationSavePayload,
} from "@/lib/types/automation";
import {
  Cake,
  CalendarHeart,
  Gift,
  Heart,
  Pencil,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AutomationPresetKey } from "@/lib/types/automation";
import type { ContactRowData } from "@/lib/types/contact";

const cardCls =
  "rounded-2xl border border-border bg-card p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]";

function presetIcon(key: AutomationPresetKey) {
  const cls = "h-5 w-5";
  switch (key) {
    case "birthday":
      return <Cake className={cls} aria-hidden />;
    case "saint_valentin":
      return <Heart className={cls} aria-hidden />;
    case "noel":
      return <Gift className={cls} aria-hidden />;
    case "nouvel_an":
      return <Sparkles className={cls} aria-hidden />;
    case "fete_des_meres":
      return <CalendarHeart className={cls} aria-hidden />;
    default:
      return <Zap className={cls} aria-hidden />;
  }
}

function AutomationCard({
  row,
  meta,
  onEdit,
  onToggle,
  toggling,
}: {
  row: AutomationRowData;
  meta?: string;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  toggling: boolean;
}) {
  return (
    <article className={cardCls}>
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-accent to-accent/60 text-ring"
          aria-hidden
        >
          {presetIcon(row.presetKey)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-extrabold text-foreground">
              {row.name}
            </h3>
            {row.enabled ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {row.scheduleLabel}
            {row.enabled ? ` · ${row.sendTime}` : ""}
          </p>
          {meta && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">{meta}</p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-foreground">{row.body}</p>
        </div>
        <Checkbox
          checked={row.enabled}
          disabled={toggling}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className="shrink-0 cursor-pointer"
          aria-label={`${row.enabled ? "Désactiver" : "Activer"} ${row.name}`}
        />
      </div>
      <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
        <Button variant="outline" size="lg" className={brandBtnCls} onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" aria-hidden />
          Configurer
        </Button>
      </div>
    </article>
  );
}

export type AutomatisationsViewProps = {
  rows: AutomationRowData[];
  contacts: ContactRowData[];
  loading: boolean;
  error: string | null;
  onSave: (payload: AutomationSavePayload) => Promise<void>;
};

export function AutomatisationsView({
  rows,
  contacts,
  loading,
  error,
  onSave,
}: AutomatisationsViewProps) {
  const [editRow, setEditRow] = useState<AutomationRowData | null>(null);
  const [togglingKey, setTogglingKey] = useState<AutomationPresetKey | null>(
    null
  );

  const birthdayRow = rows.find((r) => r.presetKey === "birthday");
  const eventRows = rows.filter((r) => r.presetKey !== "birthday");

  const eligibleCount = useMemo(
    () => contacts.filter(isCampaignEligibleContact).length,
    [contacts]
  );

  const birthdayEligible = useMemo(
    () =>
      contacts.filter(
        (c) => isCampaignEligibleContact(c) && Boolean(c.birthday?.trim())
      ).length,
    [contacts]
  );

  const activeCount = rows.filter((r) => r.enabled).length;
  const showGuide = !loading && !error && activeCount === 0;

  async function handleToggle(row: AutomationRowData, enabled: boolean) {
    setTogglingKey(row.presetKey);
    try {
      await onSave({
        presetKey: row.presetKey,
        body: row.body,
        enabled,
        sendTime: row.sendTime,
      });
    } finally {
      setTogglingKey(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {showGuide && <SectionGuideCard section="automatisations" />}
      {!loading && (
        <p className="m-0 text-xs font-bold text-muted-foreground">
          {activeCount} automatisation{activeCount !== 1 ? "s" : ""} active
          {activeCount !== 1 ? "s" : ""} · {eligibleCount} contact
          {eligibleCount > 1 ? "s" : ""} éligible
          {eligibleCount > 1 ? "s" : ""}
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
          <p className="mt-1 text-xs font-semibold text-rose-800">
            Applique la migration Supabase{" "}
            <code className="rounded bg-rose-100 px-1">
              20260528160000_sms_automations.sql
            </code>{" "}
            si la table n&apos;existe pas encore.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="m-0 mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
              Anniversaires
            </h2>
            {birthdayRow ? (
              <AutomationCard
                row={birthdayRow}
                meta={`${birthdayEligible} contact${
                  birthdayEligible > 1 ? "s" : ""
                } avec une date d'anniversaire`}
                onEdit={() => setEditRow(birthdayRow)}
                onToggle={(enabled) => void handleToggle(birthdayRow, enabled)}
                toggling={togglingKey === birthdayRow.presetKey}
              />
            ) : null}
          </section>

          <section>
            <h2 className="m-0 mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
              Événements
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {eventRows.map((row) => (
                <AutomationCard
                  key={row.presetKey}
                  row={row}
                  meta={
                    row.enabled
                      ? `Envoi à tous les contacts abonnés (${eligibleCount})`
                      : undefined
                  }
                  onEdit={() => setEditRow(row)}
                  onToggle={(enabled) => void handleToggle(row, enabled)}
                  toggling={togglingKey === row.presetKey}
                />
              ))}
            </div>
          </section>

          <p className="text-xs font-medium text-muted-foreground">
            L&apos;envoi effectif des SMS automatiques sera déclenché côté
            serveur (cron). La configuration est enregistrée pour votre compte.
          </p>
        </>
      )}

      <AutomationEditModal
        open={editRow != null}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={onSave}
      />
    </div>
  );
}

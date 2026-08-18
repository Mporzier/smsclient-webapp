"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { useAutomations } from "@/hooks/useAutomations";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useCredits } from "@/hooks/useCredits";
import { useCustomFieldDefs } from "@/hooks/useCustomFieldDefs";
import { useGroups } from "@/hooks/useGroups";
import { useLinks } from "@/hooks/useLinks";
import { useQrWheel } from "@/hooks/useQrWheel";
import { useSmsTemplates } from "@/hooks/useSmsTemplates";
import { useTrashItems } from "@/hooks/useTrashItems";
import { useUserQrCode } from "@/hooks/useUserQrCode";
import { createClient } from "@/lib/supabase/client";
import type { AppRoute } from "@/lib/proto/routes";
import { statsMonthRange } from "@/lib/statsDateRanges";
import { useMemo } from "react";

export function usePrototypeData(route: AppRoute) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const contactsState = useContacts(
    route === "contacts" || route === "statistiques",
  );
  const customFieldsState = useCustomFieldDefs();
  const groupsState = useGroups();
  const campaignsState = useCampaigns(
    route === "dashboard" ||
      route === "campagnes" ||
      route === "nouvelle-campagne",
  );
  const linksState = useLinks(route === "liens");
  const smsTemplatesState = useSmsTemplates(route === "modeles-sms");
  const automationsState = useAutomations(route === "automatisations");
  const creditsState = useCredits(route === "parametres");
  const profileState = useUserProfile();
  const userQrState = useUserQrCode(route === "qr-boutique");
  const qrWheelState = useQrWheel(route === "qr-boutique");
  const trashState = useTrashItems(supabase, user?.id, route === "parametres");

  const { from: mFrom, to: mTo } = useMemo(() => statsMonthRange(), []);

  const groupOptions = useMemo(() => {
    return groupsState.rows.map((g) => ({
      name: g.name,
      contactCount: g.contactCount,
    }));
  }, [groupsState.rows]);

  const unsubscribedContacts = contactsState.unsubscribedContacts;
  const unsubscribedCount = contactsState.unsubscribedCount;
  const loadUnsubscribed = contactsState.loadUnsubscribed;

  return {
    user,
    supabase,
    contactsState,
    customFieldsState,
    groupsState,
    campaignsState,
    linksState,
    smsTemplatesState,
    automationsState,
    creditsState,
    profileState,
    userQrState,
    qrWheelState,
    trashState,
    groupOptions,
    unsubscribedContacts,
    unsubscribedCount,
    loadUnsubscribed,
    statsDefaultFrom: mFrom,
    statsDefaultTo: mTo,
  };
}

export type PrototypeData = ReturnType<typeof usePrototypeData>;

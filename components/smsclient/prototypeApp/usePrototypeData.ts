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

  const contactsState = useContacts();
  const customFieldsState = useCustomFieldDefs();
  const groupsState = useGroups();
  const campaignsState = useCampaigns();
  const linksState = useLinks();
  const smsTemplatesState = useSmsTemplates();
  const automationsState = useAutomations(route === "automatisations");
  const creditsState = useCredits();
  const profileState = useUserProfile();
  const userQrState = useUserQrCode();
  const qrWheelState = useQrWheel(route === "qr-boutique");
  const trashState = useTrashItems(supabase, user?.id, route === "parametres");

  const { from: mFrom, to: mTo } = useMemo(() => statsMonthRange(), []);

  const groupOptions = useMemo(() => {
    return [...new Set(groupsState.rows.map((g) => g.name))];
  }, [groupsState.rows]);

  const groupModalContacts = useMemo(
    () =>
      contactsState.rows.map((c) => ({
        id: c.id,
        name: c.name,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        groups: c.groups,
      })),
    [contactsState.rows]
  );

  const unsubscribedContacts = contactsState.unsubscribedContacts;

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
    groupModalContacts,
    unsubscribedContacts,
    statsDefaultFrom: mFrom,
    statsDefaultTo: mTo,
  };
}

export type PrototypeData = ReturnType<typeof usePrototypeData>;

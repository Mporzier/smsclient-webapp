"use client";

import { cn } from "@/lib/cn";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
} from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import {
  formatInt,
  formatSmsPartsPerContact,
  sanitizeSender,
  analyzeSmsMessage,
  maxBillableCharacters,
  SMS_LIMITS,
} from "@/lib/proto/smsUtils";
import { isParisDateInPast } from "@/lib/proto/timezone";
import {
  buildEstimateMergeValues,
  containsKnownMergeTag,
  definitiveCampaignCredits,
  ensurePrenomInMessage,
  estimateCampaignCredits,
  expandMergeTags,
  longestFirstName,
  removePrenomTag,
  resolveEligibleCampaignRecipients,
  SMS_PRENOM_TAG,
} from "@/lib/proto/smsPersonalization";
import { useLinks } from "@/hooks/useLinks";
import { useSmsTemplates } from "@/hooks/useSmsTemplates";
import { createSmsShortLink } from "@/lib/supabase/links";
import type { LinkRowData } from "@/lib/types/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { CampaignWizardProps } from "./campaignTypes";
import {
  CampaignWizardStep1Provider,
  CampaignWizardStep1Main,
  CampaignWizardStep1ContinueButton,
  CampaignWizardStep1MessageSummary,
} from "./CampaignWizardStep1";
import { SmsMessageComposer } from "./SmsMessageComposer";
import {
  SmsComposeApproachCards,
  COMPOSE_APPROACH_PICK_INTRO,
  AI_COMPOSE_PROMPT_PLACEHOLDER,
  type SmsComposeApproach,
} from "./SmsComposeApproachCards";
import { SmsTemplatePicker } from "./SmsTemplatePicker";
import { CreateSmsTemplateModal } from "@/components/smsclient/modals/CreateSmsTemplateModal";
import { createUserSmsTemplate } from "@/lib/supabase/smsTemplates";
import { toCampaignSmsTemplate } from "@/lib/types/smsTemplate";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";
import type { CampaignSmsTemplate } from "@/lib/proto/campaignSmsTemplates";
import {
  DEFAULT_SMS_AI_OPTIONS,
  type SmsAiOptions,
} from "./SmsAiOptionCards";
import { SmsAiComposePanel } from "./SmsAiComposePanel";
import { SmsAiPromptField } from "./SmsAiPromptField";
import { generateCampaignSmsVariants } from "./campaignAiApi";
import { SmsManualComposeOptions } from "./SmsManualComposeOptions";
import { CampaignWizardMessageSummary } from "./CampaignWizardMessageSummary";
import {
  SmsIphonePreview,
  SMS_IPHONE_PREVIEW_WIDTH_COMPACT,
} from "./SmsIphonePreview";
import { CAMPAIGN_WIZARD_SUMMARY_COL } from "./campaignLayout";
import {
  buildDefaultCampaignTitle,
  removeExistingUrl,
  stripStopMention,
  hasStopMention,
  appendStopMention,
} from "./campaignTextUtils";
import {
  fieldBox,
  fieldLabel,
  innerInput,
  innerInp,
} from "@/components/smsclient/flowFieldStyles";
import {
  AdvancedOptionsCollapsible,
  SchedulePicker,
} from "./CampaignWizardSchedule";

export function CampaignWizard({
  step,
  onWizardStepChange,
  onWizardExit,
  requestWizardLeave,
  onComposeApproachChange,
  go,
  title,
  sender,
  setSender,
  sms,
  setSms,
  sendMode,
  setSendMode,
  scheduleAt,
  setScheduleAt,
  groups,
  groupsLoading,
  groupsLoadingMore = false,
  groupsHasMore = false,
  onGroupsLoadMore,
  groupsSearchQuery = "",
  onGroupsSearchChange,
  contacts,
  contactsLoading,
  contactsLoadingMore = false,
  contactsHasMore = false,
  onContactsLoadMore,
  contactsSearchQuery = "",
  onContactsSearchChange,
  contactsTotalCount = null,
  groupsTotalCount = null,
  recipientMode,
  setRecipientMode,
  selectedGroupNames,
  setSelectedGroupNames,
  selectedContactIds,
  setSelectedContactIds,
  setSelectedContactIdsFromGmail,
  excludedContactIds,
  setExcludedContactIds,
  eligibleAudienceFilter = null,
  eligibleAudienceCount = null,
  recipientExcludedStop,
  recipientExcludedInvalid,
  recipientCount,
  resolvedGroupMemberIds = [],
  groupMemberIdsByName = {},
  resolvedContacts = [],
  recipientsResolving = false,
  mergeFillCounts,
  mergeFillStatus,
  onCountEligibleContacts,
  onFetchEligibleContactIds,
  onCountMatchingGroups,
  onFetchMatchingGroupNames,
  creditsAvailable,
  onConfirmCampaign,
  onAddContact,
  onImportContacts,
  onCreateGroup,
  customFieldDefs = [],
}: CampaignWizardProps) {
  const { profile } = useUserProfile();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [aiOptions, setAiOptions] = useState<SmsAiOptions>(
    DEFAULT_SMS_AI_OPTIONS
  );
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedAiVariant, setSelectedAiVariant] = useState<string | null>(
    null
  );
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOptionsOpen, setAiOptionsOpen] = useState(false);
  const [smsBody, setSmsBody] = useState(() => stripStopMention(sms));
  const [advancedOpenStep3, setAdvancedOpenStep3] = useState(false);
  const [composeApproach, setComposeApproach] =
    useState<SmsComposeApproach | null>(null);

  useEffect(() => {
    onComposeApproachChange(composeApproach);
  }, [composeApproach, onComposeApproachChange]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const {
    rows: savedLinks,
    loading: linksLoading,
    refresh: refreshLinks,
    supabase,
    userId,
  } = useLinks();

  const {
    rows: customSmsTemplates,
    loading: customSmsTemplatesLoading,
    refresh: refreshSmsTemplates,
  } = useSmsTemplates();
  const [templateCreateOpen, setTemplateCreateOpen] = useState(false);

  const handleCreateSmsLink = useCallback(
    async (args: { originalUrl: string; label: string }) => {
      if (!userId) {
        return {
          data: null,
          error: "Connectez-vous pour enregistrer un lien.",
        };
      }
      const { data, error } = await createSmsShortLink(supabase, args);
      if (error) {
        return { data: null, error: error.message };
      }
      await refreshLinks();
      return { data, error: null };
    },
    [userId, supabase, refreshLinks]
  );

  const showComposeOptions =
    composeApproach === "manual" ||
    composeApproach === "ai" ||
    (composeApproach === "template" && selectedTemplateId != null);
  const showTemplatePicker =
    composeApproach === "template" && selectedTemplateId == null;

  const recipients = Math.max(0, recipientCount);

  const eligibleRecipients = useMemo(
    () =>
      resolveEligibleCampaignRecipients({
        contacts: resolvedContacts,
        recipientMode,
        selectedContactIds,
        selectedGroupNames,
        excludedContactIds,
        resolvedGroupMemberIds,
      }),
    [
      resolvedContacts,
      recipientMode,
      selectedContactIds,
      selectedGroupNames,
      excludedContactIds,
      resolvedGroupMemberIds,
    ]
  );

  const recipientFirstNames = useMemo(
    () => eligibleRecipients.map((c) => c.firstName),
    [eligibleRecipients]
  );

  const estimateLongestFirstName = useMemo(
    () => longestFirstName(recipientFirstNames),
    [recipientFirstNames]
  );

  const estimateSample = useMemo(
    () => buildEstimateMergeValues(eligibleRecipients, customFieldDefs),
    [eligibleRecipients, customFieldDefs],
  );

  const manualRecipientCount = recipientMode === "numbers" ? recipients : 0;

  const estimatedCredits = useMemo(
    () =>
      estimateCampaignCredits(
        sms,
        recipients,
        recipientFirstNames,
        eligibleRecipients,
        customFieldDefs,
      ),
    [sms, recipients, recipientFirstNames, eligibleRecipients, customFieldDefs]
  );

  const definitiveCredits = useMemo(() => {
    if (step !== 3 || eligibleRecipients.length === 0) {
      return estimatedCredits;
    }
    return definitiveCampaignCredits(
      sms,
      eligibleRecipients,
      manualRecipientCount,
      customFieldDefs,
    );
  }, [
    step,
    sms,
    eligibleRecipients,
    manualRecipientCount,
    customFieldDefs,
    estimatedCredits,
  ]);

  const activeCredits = step === 3 ? definitiveCredits : estimatedCredits;
  const totalCredits = activeCredits.totalCredits;
  const parts = activeCredits.parts;
  const hasPrenomTag = containsKnownMergeTag(sms, customFieldDefs);

  const billingMessage = useMemo(() => {
    if (!hasPrenomTag) return sms;
    return expandMergeTags(
      sms,
      buildEstimateMergeValues(eligibleRecipients, customFieldDefs),
      customFieldDefs,
    );
  }, [sms, hasPrenomTag, eligibleRecipients, customFieldDefs]);

  const smsStats = useMemo(
    () => analyzeSmsMessage(billingMessage),
    [billingMessage]
  );
  const len = smsStats.characterCount;

  const displaySender = sanitizeSender(sender).trim() || "BOULANGERIE";
  const defaultCampaignTitle = buildDefaultCampaignTitle();
  const displayTitle = title.trim() || defaultCampaignTitle;
  const hasEnoughCredits = totalCredits <= creditsAvailable;

  const confirmClearKey = `${sms}\0${recipientCount}\0${sendMode}`;
  const [prevConfirmClearKey, setPrevConfirmClearKey] = useState(confirmClearKey);
  if (confirmClearKey !== prevConfirmClearKey) {
    setPrevConfirmClearKey(confirmClearKey);
    setConfirmError(null);
  }

  const showAiPromptComposer =
    composeApproach === "ai" && aiVariants.length === 0;

  const reserveStopInCounter =
    composeApproach === "manual" || composeApproach === "template";

  const syncEffectiveSms = useCallback(
    (body: string) => {
      setSms(appendStopMention(stripStopMention(body)));
    },
    [setSms]
  );

  const applyExternalMessage = useCallback(
    (raw: string, opts?: { fromAiApi?: boolean }) => {
      const body = stripStopMention(raw);
      setSmsBody(body);
      if (opts?.fromAiApi && hasStopMention(raw)) {
        setSms(raw.trim());
      } else {
        setSms(appendStopMention(body));
      }
    },
    [setSms]
  );

  const handleSmsBodyChange = useCallback(
    (next: string) => {
      setSmsBody(next);
      syncEffectiveSms(next);
    },
    [syncEffectiveSms]
  );

  const handleComposeApproachSelect = useCallback(
    (approach: SmsComposeApproach) => {
      if (composeApproach === approach) return;
      setComposeApproach(approach);
      setSelectedTemplateId(null);
      setSelectedLinkId(null);
      setAiVariants([]);
      setAiPrompt("");
      setSelectedAiVariant(null);
      setAiGenerating(false);
      setAiOptionsOpen(false);
      if (approach === "ai") {
        setAiOptions(DEFAULT_SMS_AI_OPTIONS);
        setSmsBody("");
        syncEffectiveSms("");
      }
      if (approach === "template" || approach === "manual") {
        setSmsBody("");
        syncEffectiveSms("");
      }
    },
    [composeApproach, syncEffectiveSms]
  );

  const handleTemplateSelect = useCallback(
    (template: CampaignSmsTemplate) => {
      setSelectedTemplateId(template.id);
      applyExternalMessage(template.body);
    },
    [applyExternalMessage]
  );

  const handleCreateSmsTemplate = useCallback(
    async (args: { title: string; description: string; body: string }) => {
      if (!userId) {
        return {
          data: null,
          error: "Connectez-vous pour créer un modèle.",
        };
      }
      const { data, error } = await createUserSmsTemplate(
        supabase,
        userId,
        args
      );
      if (error || !data) {
        return { data: null, error: error?.message ?? "Création impossible." };
      }
      return { data, error: null };
    },
    [userId, supabase]
  );

  const handleSmsTemplateCreated = useCallback(
    (row: UserSmsTemplateRow) => {
      handleTemplateSelect(toCampaignSmsTemplate(row));
      void refreshSmsTemplates();
    },
    [handleTemplateSelect, refreshSmsTemplates]
  );

  const correctAndReformulateMessage = useCallback(() => {
    const corrected = (smsBody || "")
      .replace(/\s+/g, " ")
      .replace(/-20%/g, "-20 %")
      .replace(/bonjour/gi, "Bonjour")
      .replace(/sms/gi, "SMS")
      .trim();
    const wantPrenom = aiOptions.selectedMergeTags.includes("prenom");
    const defaultBase = wantPrenom
      ? `Bonjour ${SMS_PRENOM_TAG}, profitez de notre offre en boutique.`
      : "Bonjour, profitez de notre offre en boutique.";
    const base = corrected || defaultBase;
    const reformulated = base
      .replace("profitez de", "bénéficiez de")
      .replace("cette semaine", "en ce moment")
      .replace("dans votre boulangerie", "dans notre boutique")
      .trim();
    const withPrenom = wantPrenom
      ? ensurePrenomInMessage(reformulated)
      : removePrenomTag(reformulated);
    handleSmsBodyChange(withPrenom);
  }, [smsBody, handleSmsBodyChange, aiOptions.selectedMergeTags]);

  const applyLinkToSms = useCallback(
    (link: LinkRowData | null, forceShortUrl: boolean) => {
      const next = removeExistingUrl(smsBody);
      if (!link) {
        handleSmsBodyChange(next.trim());
        return;
      }
      const urlForSms = forceShortUrl ? link.shortUrl : link.originalUrl;
      handleSmsBodyChange(`${next} ${urlForSms}`.trim());
    },
    [smsBody, handleSmsBodyChange]
  );

  const handleAiOptionsChange = useCallback(
    (patch: Partial<SmsAiOptions>) => {
      let runOptimize = false;
      let disableLinkTracking = false;

      setAiOptions((prev) => {
        runOptimize = patch.autoOptimize === true && !prev.autoOptimize;
        disableLinkTracking = patch.linkTracking === false && prev.linkTracking;
        return { ...prev, ...patch };
      });

      if (composeApproach === "ai") {
        if (disableLinkTracking) setSelectedLinkId(null);
        return;
      }

      if (disableLinkTracking) {
        setSelectedLinkId(null);
        applyLinkToSms(null, true);
      }
      if (runOptimize) correctAndReformulateMessage();
    },
    [
      composeApproach,
      correctAndReformulateMessage,
      applyLinkToSms,
    ]
  );

  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [stepWarnings, setStepWarnings] = useState<string[]>([]);

  const handleGenerateAiMessage = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (aiGenerating) return;
    if (!prompt) {
      setStepErrors(["Décrivez le message à générer."]);
      return;
    }
    setStepErrors([]);

    setAiGenerating(true);
    try {
      const link = selectedLinkId
        ? savedLinks.find((l) => l.id === selectedLinkId)
        : undefined;
      const variants = await generateCampaignSmsVariants({
        prompt,
        campaignTitle: displayTitle,
        options: aiOptions,
        customFieldDefs,
        linkUrl:
          aiOptions.linkTracking && link ? link.shortUrl : undefined,
      });
      setAiVariants(variants);
      if (variants[0]) {
        setSelectedAiVariant(variants[0]);
        applyExternalMessage(variants[0], { fromAiApi: true });
      } else {
        setSelectedAiVariant(null);
      }
    } finally {
      setAiGenerating(false);
    }
  }, [
    aiPrompt,
    aiGenerating,
    selectedLinkId,
    savedLinks,
    displayTitle,
    aiOptions,
    customFieldDefs,
    applyExternalMessage,
  ]);

  const handleSelectAiVariant = useCallback(
    (variant: string) => {
      setSelectedAiVariant(variant);
      applyExternalMessage(variant, { fromAiApi: true });
    },
    [applyExternalMessage]
  );

  const handleAiLinkSelect = useCallback(
    (link: LinkRowData) => {
      if (composeApproach === "ai") {
        setSelectedLinkId((prev) => (prev === link.id ? null : link.id));
        return;
      }
      if (selectedLinkId === link.id) {
        setSelectedLinkId(null);
        applyLinkToSms(null, true);
        return;
      }
      setSelectedLinkId(link.id);
      applyLinkToSms(link, true);
    },
    [composeApproach, selectedLinkId, applyLinkToSms]
  );

  const insertSavedLink = useCallback(
    (link: LinkRowData) => {
      applyLinkToSms(link, true);
    },
    [applyLinkToSms]
  );

  const handleConfirm = useCallback(async () => {
    if (!onConfirmCampaign) {
      onWizardExit();
      go("campagnes");
      return;
    }
    setConfirmError(null);
    setConfirmLoading(true);
    try {
      await onConfirmCampaign();
      onWizardExit();
      go("campagnes");
    } catch (e) {
      setConfirmError(
        e instanceof Error ? e.message : "Enregistrement impossible."
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [onConfirmCampaign, go, onWizardExit]);

  const destinatairesLabel =
    recipients === 1
      ? "1 destinataire"
      : `${formatInt(recipients)} destinataires`;

  const maxSmsLen = maxBillableCharacters(smsStats.encoding);
  const scheduleInPast =
    sendMode === "sched" && !!scheduleAt && isParisDateInPast(scheduleAt);

  const stepClearKey = `${step}\0${recipients}\0${sms}\0${sender}\0${sendMode}\0${scheduleAt}`;
  const [prevStepClearKey, setPrevStepClearKey] = useState(stepClearKey);
  if (stepClearKey !== prevStepClearKey) {
    setPrevStepClearKey(stepClearKey);
    setStepErrors([]);
    setStepWarnings([]);
  }

  const validateStep2 = useCallback((): boolean => {
    const errors: string[] = [];
    if (!composeApproach) {
      errors.push("Choisissez comment rédiger votre message.");
    }
    if (composeApproach === "template" && !selectedTemplateId) {
      errors.push("Sélectionnez un modèle SMS.");
    }
    if (!smsBody.trim()) errors.push("Le message SMS ne peut pas être vide.");
    if (len > maxSmsLen)
      errors.push(
        `Le message dépasse la limite de ${formatInt(maxSmsLen)} caractères (${
          SMS_LIMITS.MAX_SEGMENTS
        } SMS max).`
      );
    if (smsStats.exceedsMaxSegments)
      errors.push(
        `Le message dépasse ${SMS_LIMITS.MAX_SEGMENTS} SMS — raccourcis-le ou envoie plusieurs campagnes.`
      );
    setStepErrors(errors);
    setStepWarnings([]);
    return errors.length === 0;
  }, [
    composeApproach,
    selectedTemplateId,
    smsBody,
    len,
    maxSmsLen,
    smsStats.exceedsMaxSegments,
  ]);

  const validateStep3 = useCallback((): boolean => {
    const errors: string[] = [];
    if (!sanitizeSender(sender).trim())
      errors.push("Le nom d\u0027expéditeur est requis (11 car. max).");
    if (scheduleInPast)
      errors.push("La date de programmation est dans le passé.");
    if (!hasEnoughCredits)
      errors.push(
        `Crédits insuffisants : ${formatInt(
          totalCredits
        )} nécessaires, ${formatInt(creditsAvailable)} disponibles.`
      );
    if (recipients === 0)
      errors.push("Aucun destinataire éligible sélectionné.");
    if (recipientsResolving)
      errors.push("Chargement des destinataires en cours…");
    if (!sms.trim()) errors.push("Le message SMS est vide.");
    setStepErrors(errors);
    return errors.length === 0;
  }, [
    sender,
    scheduleInPast,
    hasEnoughCredits,
    totalCredits,
    creditsAvailable,
    recipients,
    recipientsResolving,
    sms,
  ]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      if (!validateStep2()) return;
      onWizardStepChange(3);
    }
  }, [step, validateStep2, onWizardStepChange]);

  const handleStep1Continue = useCallback(
    (ready: { contactIds: string[]; groupNames: string[] }) => {
      const hasSelection =
        ready.contactIds.length > 0 ||
        ready.groupNames.length > 0 ||
        recipients > 0;
      if (!hasSelection) {
        setStepErrors(["Sélectionnez au moins un destinataire éligible."]);
        setStepWarnings([]);
        return;
      }
      setStepErrors([]);
      setStepWarnings([]);
      onWizardStepChange(2);
    },
    [recipients, onWizardStepChange]
  );

  const handleConfirmWithValidation = useCallback(async () => {
    if (!validateStep3()) return;
    await handleConfirm();
  }, [validateStep3, handleConfirm]);

  const step1Props = {
    groups,
    groupsLoading,
    groupsLoadingMore,
    groupsHasMore,
    onGroupsLoadMore,
    groupsSearchQuery,
    onGroupsSearchChange,
    contacts,
    contactsLoading,
    contactsLoadingMore,
    contactsHasMore,
    onContactsLoadMore,
    contactsSearchQuery,
    onContactsSearchChange,
    contactsTotalCount,
    groupsTotalCount,
    recipientMode,
    setRecipientMode,
    selectedGroupNames,
    setSelectedGroupNames,
    selectedContactIds,
    setSelectedContactIds,
    setSelectedContactIdsFromGmail,
    excludedContactIds,
    setExcludedContactIds,
    eligibleAudienceFilter,
    eligibleAudienceCount,
    recipientExcludedStop,
    recipientExcludedInvalid,
    recipientCount,
    resolvedGroupMemberIds,
    groupMemberIdsByName,
    recipientsResolving,
    onGoToContacts: (intent: "add" | "import") =>
      requestWizardLeave(
        "contacts",
        intent === "add" ? onAddContact : onImportContacts,
      ),
    onGoToGroups: () => requestWizardLeave("groupes", onCreateGroup),
    onCountEligibleContacts,
    onFetchEligibleContactIds,
    onCountMatchingGroups,
    onFetchMatchingGroupNames,
  };

  const compactNavBtn =
    step < 3
      ? "h-9 w-auto max-w-[180px] flex-none rounded-[12px] px-3 text-[13px]"
      : "min-w-0 flex-1";

  const summaryIphone = (
    <div className="shrink-0">
      <SmsIphonePreview
        message={step === 2 ? smsBody : sms}
        sender={displaySender}
        width={SMS_IPHONE_PREVIEW_WIDTH_COMPACT}
        customFieldDefs={customFieldDefs}
      />
    </div>
  );

  const wizardActions = (
    <div
      className={cn(
        "flex w-full shrink-0 gap-2",
        step < 3 && "justify-between",
      )}
    >
      <Button
        variant="outline"
        size="lg"
        className={cn(brandBtnCls, compactNavBtn)}
        onClick={() => {
          if (step === 1) {
            requestWizardLeave("campagnes");
            return;
          }
          onWizardStepChange((step - 1) as 1 | 2);
        }}
      >
        {step === 1 ? (
          "Annuler"
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </>
        )}
      </Button>
      {step < 3 &&
        (step === 1 ? (
          <CampaignWizardStep1ContinueButton
            className={cn(brandBtnPrimaryCls, compactNavBtn)}
            onContinue={handleStep1Continue}
          />
        ) : (
          <Button
            variant="default"
            size="lg"
            className={cn(brandBtnPrimaryCls, compactNavBtn)}
            disabled={composeApproach == null}
            onClick={handleNext}
          >
            Continuer
            <ChevronRight className="h-4 w-4" />
          </Button>
        ))}
      {step === 3 && (
        <Button
          variant="default"
          size="lg"
          className={cn(brandBtnPrimaryCls, "min-w-0 flex-1")}
          disabled={confirmLoading || recipientsResolving}
          onClick={handleConfirmWithValidation}
        >
          {confirmLoading
            ? "Envoi…"
            : recipientsResolving
              ? "Chargement…"
              : sendMode === "sched"
            ? "Programmer l\u0027envoi"
            : "Confirmer l\u0027envoi"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CampaignWizardStep1Provider {...step1Props}>
        {step === 1 ? (
          <div
            className={cn(
              "grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden",
              CAMPAIGN_WIZARD_SUMMARY_COL,
            )}
          >
            <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
              {stepErrors.length > 0 && (
                <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  {stepErrors.map((e, i) => (
                    <p key={i} className="m-0 text-sm font-bold text-rose-800">
                      {e}
                    </p>
                  ))}
                </div>
              )}
              {stepWarnings.length > 0 && (
                <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  {stepWarnings.map((w, i) => (
                    <p key={i} className="m-0 text-sm font-bold text-amber-800">
                      {w}
                    </p>
                  ))}
                </div>
              )}
              <CampaignWizardStep1Main />
              {wizardActions}
            </div>
            <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-px">
              {summaryIphone}
              <CampaignWizardStep1MessageSummary
                parts={parts}
                partsMin={activeCredits.partsMin}
                partsMax={activeCredits.partsMax}
                totalCredits={totalCredits}
                creditsAvailable={creditsAvailable}
                hasEnoughCredits={hasEnoughCredits}
                pendingSms
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden",
              CAMPAIGN_WIZARD_SUMMARY_COL,
            )}
          >
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            {stepErrors.length > 0 && (
              <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                {stepErrors.map((e, i) => (
                  <p key={i} className="m-0 text-sm font-bold text-rose-800">
                    {e}
                  </p>
                ))}
              </div>
            )}
            {stepWarnings.length > 0 && (
              <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                {stepWarnings.map((w, i) => (
                  <p key={i} className="m-0 text-sm font-bold text-amber-800">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Step 2 — Message */}
            {step === 2 && (
              <div
                className={cn(
                  fieldBox,
                  "flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden py-3 shadow-none"
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="m-0 text-lg font-normal leading-snug text-foreground">
                      Votre message
                    </h2>
                    <p className="m-0 mt-1 text-sm font-normal text-muted-foreground">
                      {COMPOSE_APPROACH_PICK_INTRO}
                    </p>
                  </div>
                </div>

                {composeApproach == null ? (
                  <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                    <SmsComposeApproachCards
                      selected={null}
                      onSelect={handleComposeApproachSelect}
                    />
                  </div>
                ) : (
                  <>
                    <div className="shrink-0">
                      <SmsComposeApproachCards
                        compact
                        selected={composeApproach}
                        onSelect={handleComposeApproachSelect}
                      />
                    </div>
                    {showTemplatePicker ? (
                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                        <SmsTemplatePicker
                          selectedId={selectedTemplateId}
                          onSelect={handleTemplateSelect}
                          businessActivity={profile?.businessActivity ?? ""}
                          customTemplates={customSmsTemplates}
                          customLoading={customSmsTemplatesLoading}
                          onCreateCustomTemplate={() =>
                            setTemplateCreateOpen(true)
                          }
                          onManageCustomTemplates={() =>
                            requestWizardLeave("modeles-sms")
                          }
                        />
                      </div>
                    ) : null}

                    {showComposeOptions ? (
                      <>
                        {showAiPromptComposer ? (
                          <SmsAiPromptField
                            value={aiPrompt}
                            onChange={setAiPrompt}
                            placeholder={AI_COMPOSE_PROMPT_PLACEHOLDER}
                            hasError={stepErrors.length > 0 && !aiPrompt.trim()}
                            disabled={aiGenerating}
                          />
                        ) : (
                          <>
                            <SmsMessageComposer
                              value={smsBody}
                              onChange={handleSmsBodyChange}
                              hasError={stepErrors.length > 0 && !smsBody.trim()}
                              estimateFirstName={estimateLongestFirstName}
                              estimateSample={estimateSample}
                              customFieldDefs={customFieldDefs}
                              reserveStop={reserveStopInCounter}
                              billableMessage={
                                reserveStopInCounter ? undefined : sms
                              }
                              placeholder="Ex. Bonjour [Prénom], -20 % cette semaine en boutique."
                              mergeFillCounts={mergeFillCounts}
                              mergeFillStatus={mergeFillStatus}
                            />
                          </>
                        )}

                        {composeApproach === "ai" ? (
                          <SmsAiComposePanel
                            options={aiOptions}
                            onOptionsChange={handleAiOptionsChange}
                            savedLinks={savedLinks}
                            linksLoading={linksLoading}
                            selectedLinkId={selectedLinkId}
                            onSelectLink={handleAiLinkSelect}
                            onCreateLink={handleCreateSmsLink}
                            generating={aiGenerating}
                            onGenerate={() => void handleGenerateAiMessage()}
                            optionsOpen={aiOptionsOpen}
                            onOptionsOpenChange={setAiOptionsOpen}
                            variants={aiVariants}
                            selectedVariant={selectedAiVariant}
                            onSelectVariant={handleSelectAiVariant}
                            customFieldDefs={customFieldDefs}
                            mergeFillCounts={mergeFillCounts}
                            mergeFillStatus={mergeFillStatus}
                          />
                        ) : (
                          <SmsManualComposeOptions
                            onCorrectAndReformulate={
                              correctAndReformulateMessage
                            }
                            savedLinks={savedLinks}
                            linksLoading={linksLoading}
                            onSelectLink={insertSavedLink}
                            onCreateLink={handleCreateSmsLink}
                          />
                        )}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {step === 2 ? wizardActions : null}

            {/* Step 3 — Confirmation */}
            {step === 3 && (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden gap-2">
                {confirmError && (
                  <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                    {confirmError}
                  </div>
                )}
                <div className={cn(fieldBox, "min-h-0 flex-1 overflow-y-auto")}>
                      <h2 className="m-0 text-base font-black">Envoi</h2>
                      <p className="mt-2 text-sm font-bold text-slate-700">
                        {destinatairesLabel}
                        <span className="text-slate-400"> · </span>
                        <span
                          className={cn(!hasEnoughCredits && "text-rose-700")}
                        >
                          {formatInt(totalCredits)} crédit
                          {totalCredits !== 1 ? "s" : ""}
                          {hasPrenomTag ? " (définitif)" : ""}
                        </span>
                      </p>
                      {hasPrenomTag ? (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          Coût calculé selon le prénom de chaque destinataire.
                        </p>
                      ) : null}
                      {recipientsResolving ? (
                        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                          Calcul des crédits définitifs…
                        </p>
                      ) : null}
                      {!hasEnoughCredits && (
                        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-800">
                          Crédits insuffisants — rechargez votre compte avant
                          l&apos;envoi.
                        </p>
                      )}
                      {recipients === 0 && (
                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-800">
                          Aucun destinataire éligible sélectionné.
                        </p>
                      )}

                      <label className={cn(fieldLabel, "mt-3")}>
                        <span>Expéditeur SMS</span>
                        <span className="text-xs text-slate-500">
                          {sanitizeSender(sender).length}/11
                        </span>
                      </label>
                      <div
                        className={cn(
                          innerInput,
                          stepErrors.length > 0 &&
                            !sanitizeSender(sender).trim() &&
                            "border-rose-300 ring-2 ring-rose-100"
                        )}
                      >
                        <input
                          className={innerInp}
                          maxLength={11}
                          value={sender}
                          onChange={(e) =>
                            setSender(sanitizeSender(e.target.value).slice(0, 11))
                          }
                          placeholder="Ex. BOULANGERIE"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSendMode("now")}
                          className={cn(
                            "flex min-w-[140px] flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-extrabold",
                            sendMode === "now" &&
                              "border-ring bg-accent text-foreground"
                          )}
                        >
                          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                          Maintenant
                        </button>
                        <button
                          type="button"
                          onClick={() => setSendMode("sched")}
                          className={cn(
                            "flex min-w-[140px] flex-1 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-extrabold",
                            sendMode === "sched" &&
                              "border-ring bg-accent text-foreground"
                          )}
                        >
                          <Clock className="h-4 w-4 shrink-0" aria-hidden />
                          Programmer
                        </button>
                      </div>

                      {sendMode === "sched" && (
                        <div className="mt-3 shrink-0">
                          <SchedulePicker
                            value={scheduleAt}
                            onChange={setScheduleAt}
                            hasError={stepErrors.length > 0 && scheduleInPast}
                          />
                          {scheduleInPast && (
                            <p className="mt-1.5 text-xs font-bold text-rose-600">
                              Cette date est dans le passé.
                            </p>
                          )}
                        </div>
                      )}

                      <AdvancedOptionsCollapsible
                        open={advancedOpenStep3}
                        onToggle={() => setAdvancedOpenStep3((v) => !v)}
                      >
                        <div className="grid gap-2 text-sm font-extrabold">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">Campagne</span>
                            <strong className="text-right">
                              {displayTitle}
                            </strong>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                              SMS par contact
                            </span>
                            <strong>
                              {formatSmsPartsPerContact(
                                parts,
                                definitiveCredits.partsMin,
                                definitiveCredits.partsMax
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                              Solde disponible
                            </span>
                            <strong>
                              {formatInt(creditsAvailable)} crédit
                              {creditsAvailable !== 1 ? "s" : ""}
                            </strong>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">Après envoi</span>
                            <strong
                              className={cn(
                                hasEnoughCredits
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              )}
                            >
                              {formatInt(creditsAvailable - totalCredits)}{" "}
                              crédit
                              {creditsAvailable - totalCredits !== 1 ? "s" : ""}
                            </strong>
                          </div>
                        </div>
                      </AdvancedOptionsCollapsible>
                </div>
                {wizardActions}
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-px">
            {summaryIphone}
            <CampaignWizardMessageSummary
              recipients={recipients}
              parts={parts}
              partsMin={activeCredits.partsMin}
              partsMax={activeCredits.partsMax}
              totalCredits={totalCredits}
              creditsAvailable={creditsAvailable}
              hasEnoughCredits={hasEnoughCredits}
              pendingSms={false}
            />
          </div>
        </div>
        )}
      </CampaignWizardStep1Provider>

      <CreateSmsTemplateModal
        open={templateCreateOpen}
        onClose={() => setTemplateCreateOpen(false)}
        onCreate={handleCreateSmsTemplate}
        onCreated={handleSmsTemplateCreated}
        customFieldDefs={customFieldDefs}
      />
    </div>
  );
}

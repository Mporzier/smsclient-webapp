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
  containsPrenomTag,
  definitiveCampaignCredits,
  ensurePrenomInMessage,
  estimateCampaignCredits,
  expandPrenomTag,
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
  CampaignWizardStep1Summary,
} from "./CampaignWizardStep1";
import { SmsMessageComposer } from "./SmsMessageComposer";
import {
  SmsComposeApproachCards,
  SmsComposeApproachSelectedCard,
  getComposeApproachStepHint,
  AI_COMPOSE_PROMPT_PLACEHOLDER,
  type SmsComposeApproach,
} from "./SmsComposeApproachCards";
import { SmsTemplatePicker } from "./SmsTemplatePicker";
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
  SMS_IPHONE_PREVIEW_COLUMN,
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
  setTitle,
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
  contacts,
  contactsLoading,
  recipientMode,
  setRecipientMode,
  selectedGroupNames,
  setSelectedGroupNames,
  selectedContactIds,
  setSelectedContactIds,
  excludedContactIds,
  setExcludedContactIds,
  recipientExcludedStop,
  recipientExcludedInvalid,
  recipientCount,
  creditsAvailable,
  onConfirmCampaign,
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
        contacts,
        recipientMode,
        selectedContactIds,
        selectedGroupNames,
        excludedContactIds,
      }),
    [
      contacts,
      recipientMode,
      selectedContactIds,
      selectedGroupNames,
      excludedContactIds,
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

  const manualRecipientCount = recipientMode === "numbers" ? recipients : 0;

  const estimatedCredits = useMemo(
    () => estimateCampaignCredits(sms, recipients, recipientFirstNames),
    [sms, recipients, recipientFirstNames]
  );

  const definitiveCredits = useMemo(
    () =>
      definitiveCampaignCredits(sms, eligibleRecipients, manualRecipientCount),
    [sms, eligibleRecipients, manualRecipientCount]
  );

  const activeCredits = step === 3 ? definitiveCredits : estimatedCredits;
  const totalCredits = activeCredits.totalCredits;
  const parts = activeCredits.parts;
  const hasPrenomTag = containsPrenomTag(sms);

  const billingMessage = useMemo(() => {
    if (hasPrenomTag) {
      return expandPrenomTag(sms, estimateLongestFirstName);
    }
    return sms;
  }, [sms, hasPrenomTag, estimateLongestFirstName]);

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
      if (showAiPromptComposer) return;
      setAiOptions((prev) => {
        const hasTag = containsPrenomTag(next);
        return prev.includeFirstName === hasTag
          ? prev
          : { ...prev, includeFirstName: hasTag };
      });
    },
    [syncEffectiveSms, showAiPromptComposer]
  );

  const handleComposeApproachSelect = useCallback(
    (approach: SmsComposeApproach) => {
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
    [syncEffectiveSms]
  );

  const handleTemplateSelect = useCallback(
    (template: CampaignSmsTemplate) => {
      setSelectedTemplateId(template.id);
      applyExternalMessage(template.body);
    },
    [applyExternalMessage]
  );

  const handleResetComposeApproach = useCallback(() => {
    setComposeApproach(null);
    setSelectedTemplateId(null);
    setSelectedLinkId(null);
    setAiOptions(DEFAULT_SMS_AI_OPTIONS);
    setAiVariants([]);
    setAiPrompt("");
    setSelectedAiVariant(null);
    setAiGenerating(false);
    setAiOptionsOpen(false);
  }, []);

  const correctAndReformulateMessage = useCallback(() => {
    const corrected = (smsBody || "")
      .replace(/\s+/g, " ")
      .replace(/-20%/g, "-20 %")
      .replace(/bonjour/gi, "Bonjour")
      .replace(/sms/gi, "SMS")
      .trim();
    const defaultBase = aiOptions.includeFirstName
      ? `Bonjour ${SMS_PRENOM_TAG}, profitez de notre offre en boutique.`
      : "Bonjour, profitez de notre offre en boutique.";
    const base = corrected || defaultBase;
    const reformulated = base
      .replace("profitez de", "bénéficiez de")
      .replace("cette semaine", "en ce moment")
      .replace("dans votre boulangerie", "dans notre boutique")
      .trim();
    const withPrenom = aiOptions.includeFirstName
      ? ensurePrenomInMessage(reformulated)
      : removePrenomTag(reformulated);
    handleSmsBodyChange(withPrenom);
  }, [smsBody, handleSmsBodyChange, aiOptions.includeFirstName]);

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
      let enablePrenom = false;
      let disablePrenom = false;
      let disableLinkTracking = false;

      setAiOptions((prev) => {
        runOptimize = patch.autoOptimize === true && !prev.autoOptimize;
        enablePrenom =
          patch.includeFirstName === true && !prev.includeFirstName;
        disablePrenom =
          patch.includeFirstName === false && prev.includeFirstName;
        disableLinkTracking = patch.linkTracking === false && prev.linkTracking;
        return { ...prev, ...patch };
      });

      if (composeApproach === "ai") {
        if (disableLinkTracking) setSelectedLinkId(null);
        return;
      }

      if (enablePrenom) handleSmsBodyChange(ensurePrenomInMessage(smsBody));
      if (disablePrenom) handleSmsBodyChange(removePrenomTag(smsBody));
      if (disableLinkTracking) {
        setSelectedLinkId(null);
        applyLinkToSms(null, true);
      }
      if (runOptimize) correctAndReformulateMessage();
    },
    [
      composeApproach,
      correctAndReformulateMessage,
      handleSmsBodyChange,
      smsBody,
      applyLinkToSms,
    ]
  );

  const handleGenerateAiMessage = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiGenerating) return;

    setAiGenerating(true);
    try {
      const link = selectedLinkId
        ? savedLinks.find((l) => l.id === selectedLinkId)
        : undefined;
      const variants = await generateCampaignSmsVariants({
        prompt,
        campaignTitle: displayTitle,
        options: aiOptions,
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

  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [stepWarnings, setStepWarnings] = useState<string[]>([]);

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

  const validateStep1 = useCallback((): boolean => {
    const errors: string[] = [];
    if (recipients === 0)
      errors.push("Sélectionnez au moins un destinataire éligible.");
    setStepErrors(errors);
    setStepWarnings([]);
    return errors.length === 0;
  }, [recipients]);

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
    sms,
  ]);

  const canContinueStep1 = recipients > 0;
  const canContinueStep2 =
    composeApproach != null &&
    !showAiPromptComposer &&
    smsBody.trim().length > 0;
  const canContinue =
    step === 1 ? canContinueStep1 : step === 2 ? canContinueStep2 : true;

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!canContinueStep1 || !validateStep1()) return;
      onWizardStepChange(2);
      return;
    }
    if (step === 2) {
      if (!canContinueStep2 || !validateStep2()) return;
      onWizardStepChange(3);
    }
  }, [
    step,
    canContinueStep1,
    canContinueStep2,
    validateStep1,
    validateStep2,
    onWizardStepChange,
  ]);

  const handleConfirmWithValidation = useCallback(async () => {
    if (!validateStep3()) return;
    await handleConfirm();
  }, [validateStep3, handleConfirm]);

  const step1Props = {
    groups,
    groupsLoading,
    contacts,
    contactsLoading,
    recipientMode,
    setRecipientMode,
    selectedGroupNames,
    setSelectedGroupNames,
    selectedContactIds,
    setSelectedContactIds,
    excludedContactIds,
    setExcludedContactIds,
    recipientExcludedStop,
    recipientExcludedInvalid,
    recipientCount,
  };

  const wizardActions = (
    <div className="flex w-full shrink-0 gap-2">
      <Button
        variant="outline"
        size="lg"
        className={cn(brandBtnCls, "min-w-0 flex-1")}
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
      {step < 3 && (
        <Button
          variant="default"
          size="lg"
          className={cn(brandBtnPrimaryCls, "min-w-0 flex-1")}
          disabled={!canContinue}
          onClick={handleNext}
        >
          Continuer
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      {step === 3 && (
        <Button
          variant="default"
          size="lg"
          className={cn(brandBtnPrimaryCls, "min-w-0 flex-1")}
          disabled={confirmLoading}
          onClick={handleConfirmWithValidation}
        >
          {confirmLoading
            ? "Envoi…"
            : sendMode === "sched"
            ? "Programmer l\u0027envoi"
            : "Confirmer l\u0027envoi"}
        </Button>
      )}
    </div>
  );

  const campaignNameField = (
    <div className={cn(fieldBox, "shrink-0 py-2.5")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-[13px] font-black text-slate-900">
            Nom de la campagne
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex h-9 items-center rounded-xl border border-border bg-card px-3">
        <input
          className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultCampaignTitle}
          aria-label="Nom de la campagne"
        />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {step === 1 ? (
        <CampaignWizardStep1Provider {...step1Props}>
          <div
            className={cn(
              "grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden",
              CAMPAIGN_WIZARD_SUMMARY_COL
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
              {campaignNameField}
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
            <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
              <CampaignWizardStep1Summary />
            </div>
          </div>
        </CampaignWizardStep1Provider>
      ) : (
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden",
            CAMPAIGN_WIZARD_SUMMARY_COL
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
                  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="m-0 text-sm font-black leading-snug text-slate-900">
                      Votre message
                    </h2>
                    <p className="m-0 mt-1 text-xs font-semibold text-slate-500">
                      {getComposeApproachStepHint(
                        composeApproach,
                        showTemplatePicker,
                      )}
                    </p>
                  </div>
                  {composeApproach != null ? (
                    <SmsComposeApproachSelectedCard
                      approach={composeApproach}
                      onChange={handleResetComposeApproach}
                    />
                  ) : null}
                </div>

                {composeApproach == null ? (
                  <div className="mt-3 shrink-0">
                    <SmsComposeApproachCards
                      onSelect={handleComposeApproachSelect}
                    />
                  </div>
                ) : (
                  <>
                    {showTemplatePicker ? (
                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                        <SmsTemplatePicker
                          selectedId={selectedTemplateId}
                          onSelect={handleTemplateSelect}
                          businessActivity={profile?.businessActivity ?? ""}
                          customTemplates={customSmsTemplates}
                          customLoading={customSmsTemplatesLoading}
                          onManageCustomTemplates={() => {
                            void refreshSmsTemplates();
                            go("modeles-sms");
                          }}
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
                              allowSpecialChars={aiOptions.allowSpecialChars}
                              estimateFirstName={estimateLongestFirstName}
                              reserveStop={reserveStopInCounter}
                              billableMessage={
                                reserveStopInCounter ? undefined : sms
                              }
                              placeholder="Écrivez votre SMS ici…"
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
                            canGenerate={aiPrompt.trim().length > 0}
                            generating={aiGenerating}
                            onGenerate={handleGenerateAiMessage}
                            optionsOpen={aiOptionsOpen}
                            onOptionsOpenChange={setAiOptionsOpen}
                            variants={aiVariants}
                            selectedVariant={selectedAiVariant}
                            onSelectVariant={handleSelectAiVariant}
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

                <div
                  className="grid min-h-0 flex-1 gap-3 overflow-hidden max-[900px]:grid-cols-1"
                  style={{
                    gridTemplateColumns: `${SMS_IPHONE_PREVIEW_COLUMN}px minmax(0, 1fr)`,
                  }}
                >
                  <div className="flex min-h-0 shrink-0 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 max-[900px]:hidden">
                    <SmsIphonePreview message={sms} sender={displaySender} />
                  </div>

                  <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
                    <div className={fieldBox}>
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
                        <label className={fieldLabel}>
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
                            onChange={(e) => setSender(e.target.value)}
                            placeholder="BOULANGERIE"
                          />
                        </div>
                      </AdvancedOptionsCollapsible>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            {step === 3 ? wizardActions : null}
            {step === 2 && (
              <>
                <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2">
                  <SmsIphonePreview
                    message={smsBody}
                    sender={displaySender}
                    width={SMS_IPHONE_PREVIEW_WIDTH_COMPACT}
                  />
                </div>
                <CampaignWizardMessageSummary
                  destinatairesLabel={destinatairesLabel}
                  parts={parts}
                  partsMin={activeCredits.partsMin}
                  partsMax={activeCredits.partsMax}
                  totalCredits={totalCredits}
                  creditsAvailable={creditsAvailable}
                  hasEnoughCredits={hasEnoughCredits}
                  indicative={estimatedCredits.indicative}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

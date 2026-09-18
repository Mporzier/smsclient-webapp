"use client";

import { DashboardCampaignCalendarCard } from "@/components/smsclient/views/dashboard/DashboardCampaignCalendarCard";
import { DashboardMerchantQrCard } from "@/components/smsclient/views/dashboard/DashboardMerchantQrCard";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { CampaignRowData } from "@/lib/types/campaign";
import type { BusinessActivityId } from "@/lib/types/businessActivity";
import { Play, Send } from "lucide-react";
import type { ReactNode } from "react";

const DASHBOARD_HOME_PRODUCT_IMAGE = "/dashboard/home-product.png";

type DashboardCampaignHomeGridProps = {
  greetingName: string;
  campaignRows: CampaignRowData[];
  businessActivity?: BusinessActivityId | "";
  campaignsLoading?: boolean;
  qrPublicUrl: string;
  qrLoading: boolean;
  qrError: string | null;
  onNewCampaign: () => void;
  onGo: (hash: string) => void;
};

function DashboardHomeCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-h-0 min-w-0", className)}>{children}</div>
  );
}

export function DashboardCampaignHomeGrid({
  greetingName,
  campaignRows,
  businessActivity = "",
  campaignsLoading = false,
  qrPublicUrl,
  qrLoading,
  qrError,
  onNewCampaign,
  onGo,
}: DashboardCampaignHomeGridProps) {
  const { t } = useI18n();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-3">
      <div className="flex min-h-0 flex-col gap-3">
        <DashboardHomeCard className="flex min-h-0 flex-[2] flex-col">
          <Card
            className="relative flex h-full min-h-0 flex-col justify-between gap-0 overflow-hidden border-0 bg-[#eef1f6] p-4 shadow-none !ring-0 md:p-5"
            aria-label={t("dashboard.homeProductVisualAlt")}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-center scale-[1.14] bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${DASHBOARD_HOME_PRODUCT_IMAGE}')`,
              }}
            />
            <div className="relative z-10 min-w-0 max-w-[min(100%,17rem)]">
              <CardTitle className="text-xl font-extrabold leading-tight md:text-2xl">
                {t("dashboard.hello", { name: greetingName })}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {t("dashboard.whatToDo")}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={onNewCampaign}
              className="relative z-10 w-fit shrink-0 bg-chart-1 font-semibold text-primary-foreground shadow-xs hover:bg-chart-2"
            >
              <Send
                data-icon="inline-start"
                className="size-4"
                strokeWidth={2.25}
                aria-hidden
              />
              {t("dashboard.launchCampaign")}
            </Button>
          </Card>
        </DashboardHomeCard>

        <DashboardHomeCard className="min-h-0 flex-[3]">
          <DashboardCampaignCalendarCard
            className="h-full min-h-0"
            campaignRows={campaignRows}
            businessActivity={businessActivity}
            loading={campaignsLoading}
          />
        </DashboardHomeCard>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <DashboardHomeCard className="min-h-0 flex-1">
          <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden p-2 ring-border">
            <button
              type="button"
              className="group/video relative isolate flex h-full min-h-0 w-full cursor-pointer flex-col overflow-hidden rounded-lg border-0 bg-card p-0 text-left transition-shadow duration-300 ease-out hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("dashboard.videoTitle")}
            >
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                aria-hidden
              >
                <div className="absolute inset-0 scale-110 rounded-xl bg-gradient-to-br from-chart-1/18 via-primary/10 to-sky-300/20 blur-xl transition-transform duration-500 ease-out group-hover/video:scale-125" />
                <div className="absolute inset-0 rounded-xl bg-background/65 backdrop-blur-sm transition-colors duration-300 group-hover/video:bg-background/50" />
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-background/80 shadow-lg backdrop-blur-sm transition-transform duration-300 ease-out group-hover/video:scale-110 group-hover/video:border-primary/30 group-hover/video:shadow-xl">
                  <Play
                    className="h-6 w-6 text-primary transition-transform duration-300 ease-out group-hover/video:scale-110"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
              </div>
              <div className="relative z-10 shrink-0 rounded-b-xl p-3 pt-0">
                <p className="m-0 text-sm font-extrabold leading-snug text-foreground">
                  {t("dashboard.videoTitle")}
                </p>
                <p className="m-0 mt-0.5 text-xs font-medium leading-snug text-muted-foreground">
                  {t("dashboard.videoSubtitle")}
                </p>
              </div>
            </button>
          </Card>
        </DashboardHomeCard>

        <DashboardHomeCard className="min-h-0 flex-1">
          <DashboardMerchantQrCard
            className="h-full min-h-0"
            publicUrl={qrPublicUrl}
            loading={qrLoading}
            error={qrError}
            onGoQr={() => onGo("qr-boutique")}
          />
        </DashboardHomeCard>
      </div>
    </div>
  );
}

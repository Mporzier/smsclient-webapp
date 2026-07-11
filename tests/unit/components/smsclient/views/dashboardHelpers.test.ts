import {
  countSentSms,
  hasUserSentSms,
} from "@/components/smsclient/views/dashboard/dashboardHelpers";
import type { CampaignRowData } from "@/lib/types/campaign";
import { describe, expect, it } from "vitest";

function campaign(
  partial: Partial<CampaignRowData> & Pick<CampaignRowData, "status">,
): CampaignRowData {
  return {
    id: "1",
    createdLabel: "01/01/2026",
    name: "Test",
    recipients: 10,
    status: partial.status,
    sendLabel: "—",
    creditsLabel: "1",
    ...partial,
  };
}

describe("dashboardHelpers", () => {
  it("hasUserSentSms est vrai dès qu'une campagne est envoyée", () => {
    expect(
      hasUserSentSms([
        campaign({ status: "draft" }),
        campaign({ status: "sent", sentAt: "2026-06-01T10:00:00.000Z" }),
      ]),
    ).toBe(true);
  });

  it("hasUserSentSms est faux sans campagne envoyée", () => {
    expect(
      hasUserSentSms([
        campaign({ status: "draft" }),
        campaign({ status: "scheduled" }),
      ]),
    ).toBe(false);
  });

  it("countSentSms additionne les destinataires des campagnes envoyées", () => {
    expect(
      countSentSms([
        campaign({ status: "sent", recipients: 12 }),
        campaign({ status: "sent", recipients: 8 }),
        campaign({ status: "draft", recipients: 100 }),
      ]),
    ).toBe(20);
  });
});

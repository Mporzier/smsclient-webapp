import { describe, expect, it } from "vitest";
import {
  campaignSortToOrders,
  groupSortToOrders,
  linkSortToOrders,
  purchaseSortToOrders,
  templateSortToOrders,
} from "@/lib/proto/listSort";

describe("listSort maps", () => {
  it("group defaults created_at asc", () => {
    expect(groupSortToOrders(null)).toEqual([
      { column: "created_at", ascending: true },
      { column: "id", ascending: true },
    ]);
  });

  it("group maps name and lastCampaign", () => {
    expect(groupSortToOrders({ id: "name", desc: false })).toEqual([
      { column: "name", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(groupSortToOrders({ id: "lastCampaignLabel", desc: true })).toEqual([
      { column: "last_campaign_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(groupSortToOrders({ id: "contactCount", desc: false })).toEqual([
      { column: "member_count", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(groupSortToOrders({ id: "contactCount", desc: true })).toEqual([
      { column: "member_count", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(groupSortToOrders({ id: "unknownCol", desc: false })).toEqual([
      { column: "created_at", ascending: true },
      { column: "id", ascending: true },
    ]);
  });

  it("campaign maps title and recipients", () => {
    expect(campaignSortToOrders({ id: "name", desc: true })).toEqual([
      { column: "title", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(campaignSortToOrders({ id: "recipients", desc: false })).toEqual([
      { column: "recipient_count", ascending: true },
      { column: "id", ascending: true },
    ]);
  });

  it("link, template and purchase maps", () => {
    expect(linkSortToOrders({ id: "clickCount", desc: true })).toEqual([
      { column: "click_count", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(templateSortToOrders({ id: "title", desc: false })).toEqual([
      { column: "title", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(purchaseSortToOrders({ id: "amountLabel", desc: true })).toEqual([
      { column: "amount_cents", ascending: false },
      { column: "id", ascending: false },
    ]);
  });
});

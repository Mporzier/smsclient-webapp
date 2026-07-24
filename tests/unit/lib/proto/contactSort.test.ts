import { describe, expect, it } from "vitest";
import { contactSortToOrders } from "@/lib/proto/contactSort";

describe("contactSortToOrders", () => {
  it("defaults to created_at desc, id desc when sort empty", () => {
    expect(contactSortToOrders(null)).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(contactSortToOrders(undefined)).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });

  it("maps native columns and tie-breaks with id same direction", () => {
    expect(contactSortToOrders({ id: "firstName", desc: false })).toEqual([
      { column: "first_name", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(contactSortToOrders({ id: "lastSms", desc: true })).toEqual([
      { column: "last_sms_sent_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(contactSortToOrders({ id: "phone", desc: false })).toEqual([
      { column: "phone_e164", ascending: true },
      { column: "id", ascending: true },
    ]);
    expect(contactSortToOrders({ id: "created", desc: true })).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });

  it("maps custom_<uuid> to jsonb text path", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(contactSortToOrders({ id: `custom_${id}`, desc: false })).toEqual([
      { column: `custom_fields->>${id}`, ascending: true },
      { column: "id", ascending: true },
    ]);
  });

  it("falls back to default for unknown or unsafe column ids", () => {
    expect(contactSortToOrders({ id: "groups", desc: false })).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
    expect(
      contactSortToOrders({ id: "custom_evil,id.desc", desc: false }),
    ).toEqual([
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ]);
  });
});

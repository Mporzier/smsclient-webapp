import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  shouldShowExpandBanner,
  useGmailSelectAll,
} from "@/hooks/useGmailSelectAll";

describe("shouldShowExpandBanner", () => {
  it("true when page select and total exceeds selection", () => {
    expect(
      shouldShowExpandBanner({
        pageSelectActive: true,
        matchTotal: 10,
        selectedCount: 2,
      }),
    ).toBe(true);
  });

  it("false when totals equal", () => {
    expect(
      shouldShowExpandBanner({
        pageSelectActive: true,
        matchTotal: 2,
        selectedCount: 2,
      }),
    ).toBe(false);
  });

  it("true while counting if expandCandidate", () => {
    expect(
      shouldShowExpandBanner({
        pageSelectActive: true,
        matchTotal: null,
        selectedCount: 2,
        expandCandidate: true,
        counting: true,
      }),
    ).toBe(true);
  });
});

describe("useGmailSelectAll", () => {
  it("shows banner immediately when expandCandidate before count", async () => {
    let selected: string[] = [];
    const setSelectedIds = vi.fn((ids: string[]) => {
      selected = ids;
    });
    let resolveCount!: (v: { count: number; error: Error | null }) => void;
    const countPromise = new Promise<{ count: number; error: Error | null }>(
      (r) => {
        resolveCount = r;
      },
    );

    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useGmailSelectAll({
          search: "",
          loadedIds: ["a", "b"],
          selectedIds,
          setSelectedIds,
          countMatch: () => countPromise,
          fetchAllIds: async () => ({ data: ["a", "b", "c"], error: null }),
          expandCandidate: true,
        }),
      { initialProps: { selectedIds: selected } },
    );

    await act(async () => {
      result.current.selectLoaded();
    });
    rerender({ selectedIds: selected });

    expect(result.current.showExpandBanner).toBe(true);
    expect(result.current.counting).toBe(true);

    await act(async () => {
      resolveCount({ count: 10, error: null });
      await countPromise;
    });
    rerender({ selectedIds: selected });

    expect(result.current.matchTotal).toBe(10);
    expect(result.current.counting).toBe(false);
  });

  it("sets displaySelectedCount from matchTotal immediately on expand", async () => {
    const setSelectedIds = vi.fn();
    let resolveFetch!: (v: { data: string[]; error: Error | null }) => void;
    const fetchPromise = new Promise<{ data: string[]; error: Error | null }>(
      (r) => {
        resolveFetch = r;
      },
    );

    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useGmailSelectAll({
          search: "",
          loadedIds: ["a"],
          selectedIds,
          setSelectedIds,
          countMatch: async () => ({ count: 100, error: null }),
          fetchAllIds: () => fetchPromise,
          expandCandidate: true,
        }),
      { initialProps: { selectedIds: ["a"] as string[] } },
    );

    await act(async () => {
      result.current.selectLoaded();
    });
    expect(result.current.matchTotal).toBe(100);

    let expandPromise!: Promise<string[]>;
    await act(async () => {
      expandPromise = result.current.expandToMatchAll();
    });
    expect(result.current.displaySelectedCount).toBe(100);
    await act(async () => {
      resolveFetch({
        data: Array.from({ length: 100 }, (_, i) => `id-${i}`),
        error: null,
      });
      await expandPromise;
    });
    rerender({
      selectedIds: Array.from({ length: 100 }, (_, i) => `id-${i}`),
    });
    expect(result.current.displaySelectedCount).toBe(100);
  });

  it("seeds matchTotal from listMatchTotal on selectLoaded", async () => {
    let selected: string[] = [];
    const setSelectedIds = vi.fn((ids: string[]) => {
      selected = ids;
    });

    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useGmailSelectAll({
          search: "",
          loadedIds: ["a", "b"],
          selectedIds,
          setSelectedIds,
          countMatch: async () => ({ count: 1999, error: null }),
          fetchAllIds: async () => ({ data: [], error: null }),
          expandCandidate: true,
          listMatchTotal: 1999,
        }),
      { initialProps: { selectedIds: selected } },
    );

    await act(async () => {
      result.current.selectLoaded();
    });
    rerender({ selectedIds: selected });

    expect(result.current.matchTotal).toBe(1999);
    expect(result.current.counting).toBe(false);
  });

  it("shows expand banner again after expand then re-select page", async () => {
    let selected: string[] = [];
    const setSelectedIds = vi.fn((ids: string[]) => {
      selected = ids;
    });
    const allIds = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    const loadedIds = allIds.slice(0, 2);

    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useGmailSelectAll({
          search: "",
          loadedIds,
          selectedIds,
          setSelectedIds,
          countMatch: async () => ({ count: 100, error: null }),
          fetchAllIds: async () => ({ data: allIds, error: null }),
          expandCandidate: true,
          listMatchTotal: 100,
        }),
      { initialProps: { selectedIds: selected } },
    );

    await act(async () => {
      result.current.selectLoaded();
    });
    rerender({ selectedIds: selected });

    await act(async () => {
      await result.current.expandToMatchAll();
    });
    rerender({ selectedIds: selected });
    expect(selected).toHaveLength(100);

    await act(async () => {
      result.current.selectLoaded();
    });
    rerender({ selectedIds: selected });
    expect(result.current.showExpandBanner).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });
    rerender({ selectedIds: loadedIds });
    expect(result.current.showExpandBanner).toBe(true);
    expect(result.current.expanding).toBe(false);
  });

  it("clears expanding when re-selecting page after expand", async () => {
    let selected: string[] = [];
    const setSelectedIds = vi.fn((ids: string[]) => {
      selected = ids;
    });
    const allIds = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    const loadedIds = allIds.slice(0, 2);
    let resolveFetch!: (v: { data: string[]; error: Error | null }) => void;
    const fetchPromise = new Promise<{ data: string[]; error: Error | null }>(
      (r) => {
        resolveFetch = r;
      },
    );

    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useGmailSelectAll({
          search: "",
          loadedIds,
          selectedIds,
          setSelectedIds,
          countMatch: async () => ({ count: 100, error: null }),
          fetchAllIds: () => fetchPromise,
          expandCandidate: true,
          listMatchTotal: 100,
        }),
      { initialProps: { selectedIds: selected } },
    );

    await act(async () => {
      result.current.selectLoaded();
    });
    rerender({ selectedIds: selected });

    await act(async () => {
      void result.current.expandToMatchAll();
    });
    expect(result.current.expanding).toBe(true);

    await act(async () => {
      result.current.selectLoaded();
    });
    expect(result.current.expanding).toBe(false);
    expect(result.current.showExpandBanner).toBe(true);

    await act(async () => {
      resolveFetch({ data: allIds, error: null });
      await fetchPromise;
    });
    rerender({ selectedIds: loadedIds });

    expect(result.current.expanding).toBe(false);
    expect(result.current.showExpandBanner).toBe(true);
  });
});

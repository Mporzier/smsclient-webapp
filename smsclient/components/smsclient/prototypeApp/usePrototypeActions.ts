"use client";

import { useContactActions } from "./actions/useContactActions";
import { useGroupActions } from "./actions/useGroupActions";
import { useMiscPrototypeActions } from "./actions/useMiscPrototypeActions";
import type { PrototypeData } from "./usePrototypeData";
import type { PrototypeModals } from "./usePrototypeModals";

type PrototypeActionsOptions = {
  data: PrototypeData;
  modals: PrototypeModals;
};

export function usePrototypeActions(opts: PrototypeActionsOptions) {
  const contacts = useContactActions(opts);
  const groups = useGroupActions(opts);
  const misc = useMiscPrototypeActions(opts);
  return { ...contacts, ...groups, ...misc };
}

export type PrototypeActions = ReturnType<typeof usePrototypeActions>;

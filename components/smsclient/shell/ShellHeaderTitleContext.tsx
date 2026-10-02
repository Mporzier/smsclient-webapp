"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ShellHeaderBackAction = {
  label: string;
  ariaLabel: string;
  onBack: () => void;
};

type ShellHeaderTitleContextValue = {
  titleOverride: string | null;
  setTitleOverride: (title: string | null) => void;
  headerBack: ShellHeaderBackAction | null;
  setHeaderBack: (action: ShellHeaderBackAction | null) => void;
};

const ShellHeaderTitleContext =
  createContext<ShellHeaderTitleContextValue | null>(null);

export function ShellHeaderTitleProvider({ children }: { children: ReactNode }) {
  const [titleOverride, setTitleOverrideState] = useState<string | null>(null);
  const [headerBack, setHeaderBackState] =
    useState<ShellHeaderBackAction | null>(null);
  const setTitleOverride = useCallback((title: string | null) => {
    setTitleOverrideState(title);
  }, []);
  const setHeaderBack = useCallback((action: ShellHeaderBackAction | null) => {
    setHeaderBackState(action);
  }, []);

  const value = useMemo(
    () => ({
      titleOverride,
      setTitleOverride,
      headerBack,
      setHeaderBack,
    }),
    [titleOverride, setTitleOverride, headerBack, setHeaderBack],
  );

  return (
    <ShellHeaderTitleContext.Provider value={value}>
      {children}
    </ShellHeaderTitleContext.Provider>
  );
}

export function useShellHeaderTitle() {
  const ctx = useContext(ShellHeaderTitleContext);
  if (!ctx) {
    throw new Error(
      "useShellHeaderTitle must be used within ShellHeaderTitleProvider",
    );
  }
  return ctx;
}

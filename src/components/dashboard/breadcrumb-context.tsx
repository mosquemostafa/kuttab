"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type BreadcrumbState = Record<string, string>;

type BreadcrumbActions = {
  setBreadcrumbOverride: (segment: string, label: string) => void;
  clearBreadcrumbOverride: (segment: string) => void;
};

const BreadcrumbStateContext = createContext<BreadcrumbState>({});
const BreadcrumbActionsContext = createContext<BreadcrumbActions>({
  setBreadcrumbOverride: () => {},
  clearBreadcrumbOverride: () => {},
});

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<BreadcrumbState>({});

  const setBreadcrumbOverride = useCallback(
    (segment: string, label: string) => {
      setOverrides((prev) => {
        if (prev[segment] === label) return prev;
        return { ...prev, [segment]: label };
      });
    },
    [],
  );

  const clearBreadcrumbOverride = useCallback((segment: string) => {
    setOverrides((prev) => {
      if (!(segment in prev)) return prev;
      const next = { ...prev };
      delete next[segment];
      return next;
    });
  }, []);

  const actions = useMemo(
    () => ({
      setBreadcrumbOverride,
      clearBreadcrumbOverride,
    }),
    [setBreadcrumbOverride, clearBreadcrumbOverride],
  );

  return (
    <BreadcrumbActionsContext.Provider value={actions}>
      <BreadcrumbStateContext.Provider value={overrides}>
        {children}
      </BreadcrumbStateContext.Provider>
    </BreadcrumbActionsContext.Provider>
  );
}

export function useBreadcrumb() {
  const overrides = useContext(BreadcrumbStateContext);
  const actions = useContext(BreadcrumbActionsContext);
  return {
    overrides,
    ...actions,
  };
}

/**
 * Hook to set or override the display label of a breadcrumb segment (e.g. replacing a bookId with the book's title).
 * Subscribes only to actions (not state), avoiding re-render loops.
 * Automatically cleans up on unmount or when the parameters change.
 */
export function useSetBreadcrumb(
  segment?: string | null,
  label?: string | null,
) {
  const { setBreadcrumbOverride, clearBreadcrumbOverride } = useContext(
    BreadcrumbActionsContext,
  );

  useEffect(() => {
    if (!segment || !label) return;

    setBreadcrumbOverride(segment, label);

    return () => {
      clearBreadcrumbOverride(segment);
    };
  }, [segment, label, setBreadcrumbOverride, clearBreadcrumbOverride]);
}

/**
 * Declarative component to set a breadcrumb segment override in JSX.
 */
export function BreadcrumbOverride({
  segment,
  label,
}: {
  segment?: string | null;
  label?: string | null;
}) {
  useSetBreadcrumb(segment, label);
  return null;
}

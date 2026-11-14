"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CustomSidebarActions = {
  setCustomSidebar: (content: React.ReactNode | null) => void;
};

const CustomSidebarStateContext = createContext<React.ReactNode | null>(null);
const CustomSidebarActionsContext = createContext<CustomSidebarActions>({
  setCustomSidebar: () => {},
});

export function CustomSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customSidebar, setCustomSidebarState] =
    useState<React.ReactNode | null>(null);

  const setCustomSidebar = useCallback((content: React.ReactNode | null) => {
    setCustomSidebarState(content);
  }, []);

  const actions = useMemo(() => ({ setCustomSidebar }), [setCustomSidebar]);

  return (
    <CustomSidebarActionsContext.Provider value={actions}>
      <CustomSidebarStateContext.Provider value={customSidebar}>
        {children}
      </CustomSidebarStateContext.Provider>
    </CustomSidebarActionsContext.Provider>
  );
}

export function useCustomSidebar() {
  const customSidebar = useContext(CustomSidebarStateContext);
  const { setCustomSidebar } = useContext(CustomSidebarActionsContext);
  return { customSidebar, setCustomSidebar };
}

/**
 * Declarative component to set a custom sidebar override.
 * Cleans up and restores the default sidebar on unmount.
 */
export function CustomSidebarOverride({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setCustomSidebar } = useContext(CustomSidebarActionsContext);

  useEffect(() => {
    setCustomSidebar(children);
    return () => {
      setCustomSidebar(null);
    };
  }, [children, setCustomSidebar]);

  return null;
}

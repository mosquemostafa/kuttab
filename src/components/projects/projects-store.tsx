"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { apiClient } from "@/lib/api/api-client";
import type { ProjectDTO } from "@/shared/types/project.types";

const ACTIVE_PROJECTS_LIMIT = 100 as const;
const PROJECTS_CACHE_TTL_MINUTES = 10 as const;
const PROJECTS_CACHE_TTL_MS = PROJECTS_CACHE_TTL_MINUTES * 60 * 1000;

type ProjectsStore = {
  projects: ProjectDTO[];
  getProjectById: (projectId: string) => ProjectDTO | undefined;
  isProjectsLoading: boolean;
  mutateProjects: () => Promise<void>;
};

async function fetchActiveProjects(): Promise<ProjectDTO[]> {
  const { items } = await apiClient.projects.list({
    isArchived: false,
    limit: ACTIVE_PROJECTS_LIMIT,
    page: 1,
    sortBy: "updatedAt",
  });
  return items;
}

type ProjectsStoreState = ProjectsStore & {
  lastFetchedAt: number;
  projectsMap: Map<string, ProjectDTO>;
  setProjects: (items: ProjectDTO[]) => void;
  bootstrapProjects: () => Promise<void>;
};

type PersistedProjectsState = Pick<
  ProjectsStoreState,
  "projects" | "lastFetchedAt"
>;

const useProjectsZustandStore = create<ProjectsStoreState>()(
  persist(
    (set, get) => ({
      projects: [],
      projectsMap: new Map(),
      lastFetchedAt: 0,
      isProjectsLoading: true,
      setProjects: (items) => {
        set({
          projects: items,
          projectsMap: new Map(items.map((p) => [p.id, p])),
          lastFetchedAt: Date.now(),
        });
      },
      getProjectById: (projectId) => get().projectsMap.get(projectId),
      mutateProjects: async () => {
        const items = await fetchActiveProjects();
        get().setProjects(items);
      },
      bootstrapProjects: async () => {
        if (!get().isProjectsLoading) {
          return;
        }

        const { projects, lastFetchedAt, mutateProjects } = get();
        const hasCachedProjects = projects.length >= 0;
        const isCacheFresh =
          hasCachedProjects &&
          Date.now() - lastFetchedAt <= PROJECTS_CACHE_TTL_MS;

        if (isCacheFresh) {
          set({ isProjectsLoading: false });
          return;
        }

        if (hasCachedProjects) {
          set({ isProjectsLoading: false });
          void mutateProjects();
          return;
        }

        try {
          await mutateProjects();
        } finally {
          set({ isProjectsLoading: false });
        }
      },
    }),
    {
      name: "projects-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedProjectsState => ({
        projects: state.projects,
        lastFetchedAt: state.lastFetchedAt,
      }),
      merge: (persistedState, currentState) => {
        const persisted =
          (persistedState as Partial<PersistedProjectsState> | undefined) ?? {};
        const projects = persisted.projects ?? currentState.projects;
        const lastFetchedAt =
          persisted.lastFetchedAt ?? currentState.lastFetchedAt;

        return {
          ...currentState,
          ...persisted,
          projects,
          lastFetchedAt,
          projectsMap: new Map(projects.map((p) => [p.id, p])),
        };
      },
    },
  ),
);

export function ProjectsStoreInitializer({
  children,
}: {
  children: ReactNode;
}) {
  const bootstrapProjects = useProjectsZustandStore(
    (state) => state.bootstrapProjects,
  );
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }
    hasBootstrappedRef.current = true;

    void bootstrapProjects();
  }, [bootstrapProjects]);

  return <>{children}</>;
}

export function useProjectsStore(): ProjectsStore {
  const projects = useProjectsZustandStore((state) => state.projects);
  const getProjectById = useProjectsZustandStore(
    (state) => state.getProjectById,
  );
  const isProjectsLoading = useProjectsZustandStore(
    (state) => state.isProjectsLoading,
  );
  const mutateProjects = useProjectsZustandStore(
    (state) => state.mutateProjects,
  );

  return useMemo(
    () => ({
      projects,
      getProjectById,
      isProjectsLoading,
      mutateProjects,
    }),
    [projects, getProjectById, isProjectsLoading, mutateProjects],
  );
}

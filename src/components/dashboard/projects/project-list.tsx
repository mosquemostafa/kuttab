"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Undo2 } from "lucide-react";

import { isApiClientError } from "@/lib/api/api-error";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { ProjectFormDialog } from "@/components/dashboard/projects/project-form-dialog";
import { ProjectCreateFolderTile } from "@/components/dashboard/projects/project-create-folder-tile";
import { ProjectFolderTile } from "@/components/dashboard/projects/project-folder-tile";
import { ProjectGridToolbar } from "@/components/dashboard/projects/project-grid-toolbar";
import { ProjectGridSkeleton } from "@/components/dashboard/projects/project-grid-skeleton";
import { useProjectsStore } from "@/components/projects/projects-store";
import { apiClient } from "@/lib/api/api-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { CreateProjectBody } from "@/server/modules/projects/project.dto";
import type { UpdateProjectDTO } from "@/server/modules/projects/project.dto";
import type { ProjectDTO } from "@/shared/types/project.types";
import type { PaginatedResponse } from "@/shared/types/pagination.types";

const DEFAULT_LIMIT = 12;
const LIST_SORT_BY = "updatedAt" as const;

type ProjectListProps = {
  mode?: "active" | "archived";
  title?: string;
  subtitle?: string;
};

export function ProjectList({
  mode = "active",
  title,
  subtitle,
}: ProjectListProps = {}) {
  const { mutateProjects } = useProjectsStore();
  const t = useTranslations("projects");
  const getErrorMessage = useApiErrorMessage();
  const isArchivedMode = mode === "archived";

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editing, setEditing] = useState<ProjectDTO | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ProjectDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  /** Bumped per project id on archive or undo so stale in-flight archive responses skip mutate. */
  const projectArchiveOpGenRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  useEffect(() => {
    if (!isHydrated || isArchivedMode) {
      return;
    }

    void mutateProjects();
  }, [isHydrated, isArchivedMode, mutateProjects]);

  const listQuery = useMemo(() => {
    return {
      ...(debouncedQ ? { q: debouncedQ } : {}),
      isArchived: isArchivedMode,
      sortBy: LIST_SORT_BY,
      page,
      limit: DEFAULT_LIMIT,
    };
  }, [debouncedQ, isArchivedMode, page]);

  const swrKey = useMemo(() => ["projects", listQuery] as const, [listQuery]);

  const { data, error, isLoading, mutate } = useSWR(
    isHydrated ? swrKey : null,
    ([, query]) => apiClient.projects.list(query),
  );

  const projects = data?.items ?? [];
  const meta = data?.meta ?? {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  };

  const optimisticRemoveProject = (project: ProjectDTO) => {
    mutate((prev: PaginatedResponse<ProjectDTO> | undefined) => {
      if (!prev) return prev;
      if (!prev.items.some((p) => p.id === project.id)) return prev;
      const newItems = prev.items.filter((p) => p.id !== project.id);
      const newTotal = Math.max(0, prev.meta.total - 1);
      const limit = prev.meta.limit;
      const totalPages = Math.max(1, Math.ceil(newTotal / limit));
      return {
        items: newItems,
        meta: { ...prev.meta, total: newTotal, totalPages },
      };
    }, false);
  };

  const rollbackOptimisticRemoveProject = (project: ProjectDTO) => {
    mutate((prev: PaginatedResponse<ProjectDTO> | undefined) => {
      if (!prev) return prev;
      if (prev.items.some((p) => p.id === project.id)) return prev;
      const newTotal = prev.meta.total + 1;
      const limit = prev.meta.limit;
      const totalPages = Math.max(1, Math.ceil(newTotal / limit));
      return {
        items: [project, ...prev.items],
        meta: { ...prev.meta, total: newTotal, totalPages },
      };
    }, false);
  };

  const router = useRouter();

  async function handleCreateSubmit(
    payload: CreateProjectBody,
  ): Promise<boolean> {
    setIsCreating(true);
    try {
      await apiClient.projects.create(payload);
      toast.success(t("actions.success.created"));
      await mutate();
      void mutateProjects();
      return true;
    } catch (error) {
      if (isApiClientError(error) && error.code === "PLAN_LIMIT_EXCEEDED") {
        toast.error(t("actions.errors.projectLimitReached"));
        router.push("/dashboard/subscription");
      } else {
        toast.error(getErrorMessage(error));
      }
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  async function handleEditSubmit(
    id: string,
    payload: UpdateProjectDTO,
  ): Promise<boolean> {
    setIsSavingEdit(true);
    try {
      await apiClient.projects.update(id, payload);
      toast.success(t("actions.success.updated"));
      await mutate();
      void mutateProjects();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleArchiveToggle(project: ProjectDTO) {
    if (project.isArchived) {
      if (isArchivedMode) {
        const opGen = (projectArchiveOpGenRef.current[project.id] ?? 0) + 1;
        projectArchiveOpGenRef.current[project.id] = opGen;

        optimisticRemoveProject(project);

        setBusyId(project.id);
        try {
          await apiClient.projects.unarchive(project.id);

          if (projectArchiveOpGenRef.current[project.id] !== opGen) {
            return;
          }

          toast.success(t("actions.success.unarchived"));
          await mutate();
          void mutateProjects();
        } catch (error) {
          rollbackOptimisticRemoveProject(project);
          toast.error(getErrorMessage(error));
          return;
        } finally {
          setBusyId(null);
        }
        return;
      }

      setBusyId(project.id);
      try {
        await apiClient.projects.unarchive(project.id);
        toast.success(t("actions.success.unarchived"));
        await mutate();
        void mutateProjects();
      } catch (error) {
        toast.error(getErrorMessage(error));
        return;
      } finally {
        setBusyId(null);
      }
      return;
    }

    const opGen = (projectArchiveOpGenRef.current[project.id] ?? 0) + 1;
    projectArchiveOpGenRef.current[project.id] = opGen;

    optimisticRemoveProject(project);

    let archiveToastId: string | undefined;
    archiveToastId = toast.success(
      (toastItem) => (
        <span className="flex w-full max-w-70 items-center gap-2 sm:max-w-xs">
          <span className="min-w-0 flex-1 text-sm leading-snug">
            {t("list.archivedToast")}
          </span>
          <button
            type="button"
            aria-label={t("list.unarchive")}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-inherit opacity-80 transition-opacity hover:bg-foreground/10 hover:opacity-100"
            onClick={() => {
              toast.dismiss(toastItem.id);
              projectArchiveOpGenRef.current[project.id] =
                (projectArchiveOpGenRef.current[project.id] ?? 0) + 1;
              rollbackOptimisticRemoveProject(project);
              void (async () => {
                try {
                  await apiClient.projects.unarchive(project.id);
                  await mutate();
                  void mutateProjects();
                } catch (error) {
                  optimisticRemoveProject(project);
                  toast.error(getErrorMessage(error));
                  return;
                }
              })();
            }}
          >
            <Undo2 className="size-4" aria-hidden />
          </button>
        </span>
      ),
      { duration: 2000 },
    );

    try {
      await apiClient.projects.archive(project.id);
    } catch (error) {
      rollbackOptimisticRemoveProject(project);
      if (archiveToastId) {
        toast.remove(archiveToastId);
      }
      toast.error(getErrorMessage(error));
      return;
    }

    if (projectArchiveOpGenRef.current[project.id] !== opGen) {
      return;
    }

    await mutate();
    void mutateProjects();
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.projects.delete(pendingDelete.id);
      toast.success(t("actions.success.deleted"));
      setPendingDelete(null);
      await mutate();
      void mutateProjects();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  const toolbarLabels = {
    searchPlaceholder: t("list.searchPlaceholder"),
  };

  const tileLabels = {
    archivedBadge: t("list.archivedBadge"),
    edit: t("list.edit"),
    archive: t("list.archive"),
    unarchive: t("list.unarchive"),
    delete: t("list.delete"),
    menuAria: t("list.openProjectMenu"),
  };

  const showEmpty = isHydrated && !isLoading && !error && projects.length === 0;
  const emptyMessage = debouncedQ
    ? t("list.emptyFiltered")
    : isArchivedMode
      ? t("list.emptyArchived")
      : t("list.empty");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 shrink">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {title ?? t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {subtitle ?? t("subtitle")}
          </p>
        </div>
        <ProjectGridToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          labels={toolbarLabels}
          className="w-full shrink-0 lg:max-w-md lg:pt-0.5"
        />
      </div>

      {!isHydrated || isLoading ? (
        <ProjectGridSkeleton />
      ) : error ? (
        <p className="text-sm text-destructive">{t("list.loadError")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {!isArchivedMode ? (
              <ProjectCreateFolderTile
                label={t("list.createFolderTileHint")}
                onClick={() => setCreateOpen(true)}
              />
            ) : null}
            {projects.map((project) => (
              <ProjectFolderTile
                key={project.id}
                project={project}
                labels={tileLabels}
                isBusy={busyId === project.id}
                onEdit={() => setEditing(project)}
                onArchiveToggle={() => void handleArchiveToggle(project)}
                onDelete={() => setPendingDelete(project)}
              />
            ))}
          </div>

          {showEmpty ? (
            <p className="text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : null}

          {meta.totalPages > 1 ? (
            <div className="space-y-2 pt-4">
              <p className="text-center text-xs text-muted-foreground">
                {t("list.pagination.page", {
                  page: meta.page,
                  totalPages: meta.totalPages,
                })}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("list.pagination.previous")}
                      ariaLabel={t("list.pagination.previousAria")}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      aria-disabled={meta.page === 1}
                      tabIndex={meta.page === 1 ? -1 : 0}
                      className={
                        meta.page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: meta.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === meta.page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      text={t("list.pagination.next")}
                      ariaLabel={t("list.pagination.nextAria")}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(meta.totalPages, p + 1));
                      }}
                      aria-disabled={meta.page === meta.totalPages}
                      tabIndex={meta.page === meta.totalPages ? -1 : 0}
                      className={
                        meta.page === meta.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </>
      )}

      {!isArchivedMode ? (
        <ProjectFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreateSubmit}
          isPending={isCreating}
        />
      ) : null}

      <ProjectFormDialog
        mode="edit"
        project={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={handleEditSubmit}
        isPending={isSavingEdit}
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => !isDeleting && setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("list.deleteTitle")}
        description={
          pendingDelete
            ? t("list.deleteDescription", { name: pendingDelete.name })
            : ""
        }
        confirmText={isDeleting ? t("list.deleting") : t("list.confirmDelete")}
        cancelText={t("list.cancel")}
        confirmVariant="destructive"
      />
    </div>
  );
}

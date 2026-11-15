import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { projectService } from "@/server/modules/projects/project.service";
import { auth } from "@/server/lib/auth";
import { ProjectDetailTabs } from "@/components/dashboard/projects/project-detail-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}): Promise<Metadata> {
  const { locale, projectId } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const project = await projectService.getProjectById(
      session.user.id,
      projectId,
    );

    const title = t("dashboard.projects.detailTitle", { name: project.name });
    const description = t("dashboard.projects.detailDescription", {
      name: project.name,
    });

    return {
      title,
      description,
      openGraph: { title, description },
      twitter: { title, description },
    };
  } catch {
    const title = t("dashboard.projects.detailNotFoundTitle");
    const description = t("dashboard.projects.detailNotFoundDescription");
    return {
      title,
      description,
      openGraph: { title, description },
      twitter: { title, description },
    };
  }
}

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    notFound();
  }

  const userId = session.user.id;

  let project;
  try {
    project = await projectService.getProjectById(userId, projectId);
  } catch {
    notFound();
  }

  const { todos: todosCount } = await projectService.getProjectContentAnalytics(
    userId,
    {
      projectId: project.id,
    },
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <ProjectDetailTabs
        project={project}
        counts={{
          todos: todosCount,
        }}
      />
    </div>
  );
}

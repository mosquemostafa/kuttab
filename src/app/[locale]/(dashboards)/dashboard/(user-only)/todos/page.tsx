import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TodoList } from "@/components/dashboard/todos/todo-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });

  const title = t("dashboard.todos.title");
  const description = t("dashboard.todos.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function DashboardTodosPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <TodoList />
    </div>
  );
}

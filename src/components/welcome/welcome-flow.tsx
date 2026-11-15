"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { request } from "@/lib/api/api-core";
import LanguageSettings from "@/components/dashboard/language-settings";
import ThemeSettings from "@/components/dashboard/theme-settings";
import NotificationSettings from "@/components/dashboard/notification-settings";

const TOTAL_STEPS = 6;
const STEP_STORAGE_KEY = "welcome-step";

function readStoredStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(STEP_STORAGE_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), TOTAL_STEPS - 1);
}

function writeStoredStep(step: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STEP_STORAGE_KEY, String(step));
}

function clearStoredStep(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STEP_STORAGE_KEY);
}

function StepHeading({
  title,
  changeLater,
}: {
  title: string;
  changeLater: string;
}) {
  return (
    <div className="mb-4 space-y-1.5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Sparkles className="size-3.5" />
        {changeLater}
      </span>
    </div>
  );
}

export default function WelcomeFlow({
  locale,
  userName,
}: {
  locale: string;
  userName: string;
}) {
  const t = useTranslations("welcome");
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const restoredRef = useRef(false);

  // Restore the step after mount so a locale switch (which navigates to a new
  // URL and re-mounts this component) doesn't reset the user back to step 0.
  // Reading sessionStorage during render would break SSR hydration, so we do
  // it in an effect and guard writes until the restore is done.
  useEffect(() => {
    const saved = readStoredStep();
    if (saved > 0) {
      setCurrent(saved);
    }
    restoredRef.current = true;
  }, []);

  useEffect(() => {
    if (restoredRef.current) {
      writeStoredStep(current);
    }
  }, [current]);

  const isLast = current === TOTAL_STEPS - 1;
  const isRtl = locale === "ar";

  async function completeOnboarding() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request<null>("/onboarding/complete", { method: "POST" });
      clearStoredStep();
      router.replace("/dashboard/overview", { locale });
    } catch {
      setIsSubmitting(false);
      toast.error(t("errors.completeFailed"));
    }
  }

  function handleNext() {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setCurrent((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setCurrent((s) => Math.max(s - 1, 0));
  }

  function renderStep() {
    switch (current) {
      case 0:
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("steps.welcome.title", { name: userName })}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              {t("steps.welcome.intro")}
            </p>
          </div>
        );

      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PlayCircle className="size-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("steps.demo.title")}
            </h1>
            <p className="mx-auto mt-4 mb-8 max-w-md text-muted-foreground">
              {t("steps.demo.description")}
            </p>
            <div className="mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-xl border bg-muted/50">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/_XGo_-mqlDo"
                title="Application Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <StepHeading
              title={t("steps.language.title")}
              changeLater={t("changeLater")}
            />
            <LanguageSettings />
          </div>
        );

      case 3:
        return (
          <div>
            <StepHeading
              title={t("steps.appearance.title")}
              changeLater={t("changeLater")}
            />
            <div className="space-y-4">
              <ThemeSettings />
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <StepHeading
              title={t("steps.notifications.title")}
              changeLater={t("changeLater")}
            />
            <NotificationSettings />
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="size-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("steps.ready.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              {t("steps.ready.description")}
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= current ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-8">
          {renderStep()}
        </div>
      </div>

      <footer className="sticky bottom-0 z-10 border-t bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div>
            {current > 0 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ChevronLeft className={cn("size-4", isRtl && "rotate-180")} />
                {t("actions.back")}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLast && (
              <Button
                variant="ghost"
                onClick={completeOnboarding}
                disabled={isSubmitting}
              >
                {t("actions.skip")}
              </Button>
            )}
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isLast ? t("actions.getStarted") : t("actions.next")}
              {!isLast && (
                <ChevronRight className={cn("size-4", isRtl && "rotate-180")} />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

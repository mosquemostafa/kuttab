"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  invokePwaInstallPrompt,
  isIOS,
  isRunningAsInstalledPwa,
  isSafari,
  subscribeBeforeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install-prompt";

const STORAGE_KEY = "saas-dashboard-pwa-install-dismissed";

export function DashboardInstallPwaBar() {
  const t = useTranslations();

  const [storageChecked, setStorageChecked] = useState(false);
  const [dismissedStored, setDismissedStored] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  const isiOSInstallFlow = useMemo(() => isIOS() && isSafari(), []);

  useEffect(() => {
    setIsStandalone(isRunningAsInstalledPwa());
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setDismissedStored(true);
      }
    } catch {
      // ignore
    }
    setStorageChecked(true);

    if (isiOSInstallFlow) return;

    return subscribeBeforeInstallPrompt(setDeferredPrompt);
  }, [isiOSInstallFlow]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissedStored(true);
  };

  const handleInstall = async () => {
    if (isiOSInstallFlow) {
      setIosDialogOpen(true);
      return;
    }

    if (!deferredPrompt) return;

    const choice = await invokePwaInstallPrompt(deferredPrompt);
    if (choice.outcome === "accepted") {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  const visible =
    storageChecked &&
    !isStandalone &&
    !dismissedStored &&
    (deferredPrompt !== null || isiOSInstallFlow);

  if (!visible) return null;

  return (
    <>
      <aside
        className={cn(
          "relative shrink-0 border-b border-border/80",
          "bg-gradient-to-r from-primary/10 via-primary/5 to-background",
          "px-3.5 py-2.5 sm:px-4 sm:py-2 text-foreground transition-all",
        )}
        role="region"
        aria-label={t("dashboard.installPwaBanner.ariaLabel")}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Header row on mobile / Left group on desktop */}
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-2xs mt-0.5 sm:mt-0"
              aria-hidden
            >
              <Download className="size-4" />
            </div>
            <p className="min-w-0 flex-1 text-xs sm:text-sm font-medium leading-relaxed sm:leading-snug text-foreground/90">
              {t("dashboard.installPwaBanner.message")}
            </p>
            {/* Corner close button on mobile */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-background/80 sm:hidden -me-1 -mt-0.5 rounded-full"
              onClick={handleDismiss}
              aria-label={t("dashboard.installPwaBanner.dismissAria")}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Action buttons: full-width primary CTA on mobile, inline group on desktop */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              type="button"
              size="sm"
              onClick={handleInstall}
              className="w-full sm:w-auto gap-2 h-9 sm:h-8 text-xs sm:text-sm font-semibold shadow-xs rounded-lg sm:rounded-md transition-all active:scale-[0.99]"
            >
              <Download className="size-4 sm:size-3.5" aria-hidden />
              <span>
                {isiOSInstallFlow
                  ? t("landing.hero.installAppIos")
                  : t("dashboard.installPwaBanner.install")}
              </span>
            </Button>
            {/* Inline close button on desktop */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 hidden sm:inline-flex text-muted-foreground hover:text-foreground rounded-md"
              onClick={handleDismiss}
              aria-label={t("dashboard.installPwaBanner.dismissAria")}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {isiOSInstallFlow ? (
        <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
          <DialogContent
            className="w-[calc(100%-2rem)] sm:max-w-lg"
            showCloseButton={false}
          >
            <DialogHeader className="text-start">
              <DialogTitle>{t("landing.pwaInstall.ios.title")}</DialogTitle>
              <DialogDescription>
                {t("landing.pwaInstall.ios.description")}
              </DialogDescription>
            </DialogHeader>

            <ol className="list-decimal space-y-2 ps-5 text-sm">
              <li>{t("landing.pwaInstall.ios.steps.share")}</li>
              <li>{t("landing.pwaInstall.ios.steps.scroll")}</li>
              <li>{t("landing.pwaInstall.ios.steps.addToHomeScreen")}</li>
            </ol>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">
                  {t("landing.pwaInstall.ios.actions.close")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

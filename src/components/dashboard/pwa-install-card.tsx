"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  invokePwaInstallPrompt,
  isIOS,
  isRunningAsInstalledPwa,
  isSafari,
  subscribeBeforeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install-prompt";

export function PWAInstallCard() {
  const t = useTranslations("landing");

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [visible, setVisible] = useState(false);

  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  const isiOSInstallFlow = useMemo(() => isIOS() && isSafari(), []);

  useEffect(() => {
    if (isRunningAsInstalledPwa()) return;

    if (isiOSInstallFlow) {
      setVisible(true);
      return;
    }

    return subscribeBeforeInstallPrompt((promptEvent) => {
      setDeferredPrompt(promptEvent);
      setVisible(true);
    });
  }, [isiOSInstallFlow]);

  const installApp = async () => {
    if (isiOSInstallFlow) {
      setIosDialogOpen(true);
      return;
    }

    if (!deferredPrompt) return;

    const choice = await invokePwaInstallPrompt(deferredPrompt);

    if (choice.outcome === "accepted") {
      setVisible(false);
    }

    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
              aria-hidden
            >
              <Smartphone className="h-5 w-5" />
            </div>
            <CardTitle>{t("hero.installApp")}</CardTitle>
          </div>
          <CardDescription>
            {isiOSInstallFlow
              ? t("pwaInstall.ios.description")
              : t("pwaInstall.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isiOSInstallFlow && (
            <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
              <li>{t("pwaInstall.ios.steps.share")}</li>
              <li>{t("pwaInstall.ios.steps.scroll")}</li>
              <li>{t("pwaInstall.ios.steps.addToHomeScreen")}</li>
            </ol>
          )}
          <Button onClick={installApp} size="sm" className="w-full sm:w-auto">
            <Download className="me-2" data-icon="inline-start" />
            {isiOSInstallFlow ? t("hero.installAppIos") : t("hero.installApp")}
          </Button>
        </CardContent>
      </Card>

      {isiOSInstallFlow ? (
        <DialogContent
          className="w-[calc(100%-2rem)] sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader className="text-start">
            <DialogTitle>{t("pwaInstall.ios.title")}</DialogTitle>
            <DialogDescription>
              {t("pwaInstall.ios.description")}
            </DialogDescription>
          </DialogHeader>

          <ol className="list-decimal space-y-2 ps-5 text-sm">
            <li>{t("pwaInstall.ios.steps.share")}</li>
            <li>{t("pwaInstall.ios.steps.scroll")}</li>
            <li>{t("pwaInstall.ios.steps.addToHomeScreen")}</li>
          </ol>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">{t("pwaInstall.ios.actions.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

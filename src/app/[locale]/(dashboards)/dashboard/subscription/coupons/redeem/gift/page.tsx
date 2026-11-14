"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Link, useRouter } from "@/i18n/navigation";
import { isApiClientError } from "@/lib/api/api-error";
import { apiClient } from "@/lib/api/api-client";
import { useSubscription } from "@/components/subscription/subscription-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RedeemErrorReason = "already-redeemed" | "usage-limit-reached" | "generic";

type RedeemState =
  | { status: "idle" }
  | { status: "missing-code" }
  | { status: "loading"; code: string }
  | { status: "success"; code: string }
  | {
      status: "error";
      code: string | null;
      reason: RedeemErrorReason;
    };

export default function RedeemGiftCouponPage() {
  const t = useTranslations("dashboard.subscription.coupons.redeemGift");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutateSubscription } = useSubscription();

  const rawCodeParam = useMemo(() => {
    // Support both `?coupon=...` (what we share) and `?code=...` (generic).
    return searchParams.get("coupon") ?? searchParams.get("code");
  }, [searchParams]);

  const code = useMemo(() => rawCodeParam?.trim() ?? "", [rawCodeParam]);

  const [state, setState] = useState<RedeemState>({ status: "idle" });
  const lastAttemptedCodeRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const mutateSubscriptionRef = useRef(mutateSubscription);
  mutateSubscriptionRef.current = mutateSubscription;

  const routerRef = useRef(router);
  routerRef.current = router;

  const tRef = useRef<typeof t | null>(null);
  tRef.current = t;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    if (!code) {
      setState({ status: "missing-code" });
      return;
    }

    // Prevent double-redeem attempts (React strict mode / re-renders).
    if (lastAttemptedCodeRef.current === code) {
      return;
    }
    lastAttemptedCodeRef.current = code;

    setState({ status: "loading", code });

    void (async () => {
      try {
        const result = await apiClient.coupons.redeemGift({ code });
        if (!result?.redeemed) {
          throw new Error("Redemption failed");
        }

        await mutateSubscriptionRef.current();

        if (isMountedRef.current) {
          toast.success(tRef.current?.("toast.success") ?? t("toast.success"));
          setState({ status: "success", code });
          redirectTimer = setTimeout(() => {
            if (isMountedRef.current) {
              routerRef.current.replace("/dashboard/subscription");
            }
          }, 800);
        }
      } catch (e) {
        if (isMountedRef.current) {
          // API currently returns an English error message for this case.
          // We map it to a localized UI message.
          const reason: RedeemErrorReason = (() => {
            if (!isApiClientError(e) || typeof e.message !== "string") {
              return "generic";
            }

            const rawMessage = e.message.trim();
            if (rawMessage === "Coupon was already redeemed") {
              return "already-redeemed";
            }

            if (rawMessage === "Coupon usage limit reached") {
              return "usage-limit-reached";
            }

            // Fallback: handle minor casing/format differences.
            const message = rawMessage.toLowerCase();
            if (message.includes("coupon was already redeemed")) {
              return "already-redeemed";
            }

            if (message.includes("coupon usage limit reached")) {
              return "usage-limit-reached";
            }

            return "generic";
          })();

          setState({ status: "error", code, reason });
        }
      }
    })();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [code]);

  const title =
    state.status === "missing-code"
      ? t("title.missingCode")
      : state.status === "success"
        ? t("title.success")
        : state.status === "error"
          ? t("title.error")
          : t("title.loading");

  const description =
    state.status === "missing-code"
      ? t("description.missingCode")
      : state.status === "success"
        ? t("description.success")
        : state.status === "error"
          ? t("description.error")
          : t("description.loading");

  const errorMessage =
    state.status === "error"
      ? state.reason === "already-redeemed"
        ? t("error.alreadyRedeemedMessage")
        : state.reason === "usage-limit-reached"
          ? t("error.usageLimitReachedMessage")
          : t("error.genericMessage")
      : null;

  return (
    <main className="container mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {state.status === "loading" ? (
            <p className="text-muted-foreground">{t("content.processing")}</p>
          ) : null}

          {state.status === "success" ? (
            <p className="text-muted-foreground">{t("content.redirecting")}</p>
          ) : null}

          {state.status === "missing-code" ? (
            <div className="space-y-2">
              <p className="text-destructive">
                {t("missingCode.noCodeProvided")}
              </p>
              <p className="text-muted-foreground">
                {t("missingCode.exampleLabel")}{" "}
                <span className="font-mono">?coupon=YOUR_CODE</span>
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="space-y-2">
              <p className="text-destructive">{errorMessage}</p>
              {state.code ? (
                <p className="text-muted-foreground">
                  {t("error.codeLabel")}{" "}
                  <span className="font-mono">{state.code}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard/subscription">
              {t("actions.goToSubscription")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

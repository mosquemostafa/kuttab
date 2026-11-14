"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminUserSubscriptionActivate } from "@/components/admin/admin-user-subscription-activate";
import { AdminUserSubscriptionExtend } from "@/components/admin/admin-user-subscription-extend";
import { AdminUserSubscriptionRenew } from "@/components/admin/admin-user-subscription-renew";
import { AdminUserSubscriptionChangePlan } from "@/components/admin/admin-user-subscription-change-plan";
import { AdminUserSubscriptionCancel } from "@/components/admin/admin-user-subscription-cancel";
import type { SubscriptionDTO } from "@/shared/types/subscription.types";

type SubscriptionAction =
  | "activate"
  | "extend"
  | "renew"
  | "changePlan"
  | "cancel";

type AdminUserSubscriptionActionsMenuProps = {
  userId: string;
  subscription: SubscriptionDTO | null;
  loading: boolean;
  loadFailed: boolean;
  onActionCompleted: () => Promise<void>;
};

export function AdminUserSubscriptionActionsMenu({
  userId,
  subscription,
  loading,
  loadFailed,
  onActionCompleted,
}: AdminUserSubscriptionActionsMenuProps) {
  const t = useTranslations("adminUsers");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<SubscriptionAction | null>(null);

  const actionConfigs: Array<{
    key: SubscriptionAction;
    title: string;
    description: string;
    destructive?: boolean;
  }> = [
    {
      key: "activate",
      title: t("subscriptionActivate.title"),
      description: t("subscriptionActivate.description"),
    },
    {
      key: "extend",
      title: t("subscriptionExtend.title"),
      description: t("subscriptionExtend.description"),
    },
    {
      key: "renew",
      title: t("subscriptionRenew.title"),
      description: t("subscriptionRenew.description"),
    },
    {
      key: "changePlan",
      title: t("subscriptionChangePlan.title"),
      description: t("subscriptionChangePlan.description"),
    },
    {
      key: "cancel",
      title: t("subscriptionCancel.title"),
      description: t("subscriptionCancel.description"),
      destructive: true,
    },
  ];

  const currentAction = actionConfigs.find(
    (action) => action.key === selectedAction,
  );
  const hasSubscription = Boolean(subscription);

  function isActionDisabled(action: SubscriptionAction) {
    if (action === "activate") {
      return hasSubscription;
    }

    return !hasSubscription;
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("actions.menuLabel")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("actions.menuLabel")}</DropdownMenuLabel>
          {actionConfigs.map((action, index) => (
            <div key={action.key}>
              {index === actionConfigs.length - 1 ? (
                <DropdownMenuSeparator />
              ) : null}
              <DropdownMenuItem
                variant={action.destructive ? "destructive" : "default"}
                disabled={isActionDisabled(action.key)}
                onClick={() => {
                  if (isActionDisabled(action.key)) {
                    return;
                  }
                  setDropdownOpen(false);
                  setSelectedAction(action.key);
                }}
              >
                {action.title}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={Boolean(selectedAction)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAction(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {currentAction ? (
            <>
              <DialogHeader className="text-start">
                <DialogTitle>{currentAction.title}</DialogTitle>
                <DialogDescription>
                  {currentAction.description}
                </DialogDescription>
              </DialogHeader>

              {selectedAction === "activate" ? (
                <AdminUserSubscriptionActivate
                  userId={userId}
                  onActionCompleted={onActionCompleted}
                />
              ) : null}
              {selectedAction === "extend" ? (
                <AdminUserSubscriptionExtend
                  subscription={subscription}
                  loading={loading}
                  loadFailed={loadFailed}
                  onActionCompleted={onActionCompleted}
                />
              ) : null}
              {selectedAction === "renew" ? (
                <AdminUserSubscriptionRenew
                  subscription={subscription}
                  loading={loading}
                  loadFailed={loadFailed}
                  onActionCompleted={onActionCompleted}
                />
              ) : null}
              {selectedAction === "changePlan" ? (
                <AdminUserSubscriptionChangePlan
                  subscription={subscription}
                  loading={loading}
                  loadFailed={loadFailed}
                  onActionCompleted={onActionCompleted}
                />
              ) : null}
              {selectedAction === "cancel" ? (
                <AdminUserSubscriptionCancel
                  subscription={subscription}
                  loading={loading}
                  loadFailed={loadFailed}
                  onActionCompleted={onActionCompleted}
                />
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

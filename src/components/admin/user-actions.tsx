"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Ban,
  Bell,
  CreditCard,
  Megaphone,
  MoreHorizontal,
  Trash2,
  Shield,
  User,
  LogOut,
  Shapes,
  MessageSquarePlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { UserBanDialog } from "./user-ban-dialog";
import { UserUnbanDialog } from "./user-unban-dialog";
import { UserDeleteDialog } from "./user-delete-dialog";
import { UserRevokeSessionsDialog } from "./user-revoke-sessions-dialog";
import { UserRoleDialog } from "./user-role-dialog";
import { UserSegmentDialog } from "./user-segment-dialog";
import { UserSendInAppNotificationDialog } from "./user-send-in-app-notification-dialog";
import { UserSendPushNotificationDialog } from "./user-send-push-notification-dialog";
import { StaffCreateTicketDialog } from "@/components/support/staff-create-ticket-dialog";
import { useTranslations } from "next-intl";
import { adminApi } from "@/lib/api/admin.api";
import { Link } from "@/i18n/navigation";

interface UserActionsProps {
  user: UserWithDetailsDTO;
  onActionComplete: () => void;
}

export function UserActions({ user, onActionComplete }: UserActionsProps) {
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevokeSessionsDialog, setShowRevokeSessionsDialog] =
    useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showInAppNotificationDialog, setShowInAppNotificationDialog] =
    useState(false);
  const [showPushNotificationDialog, setShowPushNotificationDialog] =
    useState(false);
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const locale = useLocale();

  const t = useTranslations("adminUsers");

  const handleDialogClose = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setter(false);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("actions.menuLabel")}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-sm">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            {t("actions.menuLabel")}
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowRoleDialog(true);
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>{t("actions.updateRole")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowSegmentDialog(true);
            }}
          >
            <Shapes className="mr-2 h-4 w-4" />
            <span>{t("actions.updateSegment")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowInAppNotificationDialog(true);
            }}
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>{t("actions.sendInAppNotification")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowPushNotificationDialog(true);
            }}
          >
            <Megaphone className="mr-2 h-4 w-4" />
            <span>{t("actions.sendPush")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowCreateTicketDialog(true);
            }}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>{t("actions.startSupportChat")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-xs">
            <Link
              href={`/admin/users/${user.id}/subscriptions`}
              onClick={() => setDropdownOpen(false)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>{t("actions.viewSubscriptions")}</span>
            </Link>
          </DropdownMenuItem>
          {process.env.NODE_ENV === "development" && (
            <DropdownMenuItem
              className="text-xs"
              onClick={async () => {
                setDropdownOpen(false);
                setIsImpersonating(true);
                try {
                  const res = await adminApi.impersonateUser(user.id);
                  if (res.ok) {
                    // Force full navigation so the Set-Cookie from the API
                    // response is applied and server-side session state is loaded.
                    window.location.assign(`/${locale}/dashboard`);
                  } else {
                    alert("Impersonation failed");
                  }
                } catch {
                  alert("Impersonation failed");
                } finally {
                  setIsImpersonating(false);
                }
              }}
            >
              <User className="mr-2 h-4 w-4" />
              <span>
                {isImpersonating
                  ? t("actions.loggingIn")
                  : t("actions.loginAsUser")}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                setDropdownOpen(false);
                setShowUnbanDialog(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>{t("actions.unbanUser")}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                setDropdownOpen(false);
                setShowBanDialog(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>{t("actions.banUser")}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t("actions.deleteUser")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => {
              setDropdownOpen(false);
              setShowRevokeSessionsDialog(true);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("actions.revokeSessions")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <UserBanDialog
        user={user}
        isOpen={showBanDialog}
        onClose={() => {
          handleDialogClose(setShowBanDialog);
          onActionComplete();
        }}
      />

      <UserUnbanDialog
        user={user}
        isOpen={showUnbanDialog}
        onClose={() => {
          handleDialogClose(setShowUnbanDialog);
          onActionComplete();
        }}
      />

      <UserDeleteDialog
        user={user}
        isOpen={showDeleteDialog}
        onClose={() => {
          handleDialogClose(setShowDeleteDialog);
          onActionComplete();
        }}
      />

      <UserRevokeSessionsDialog
        user={user}
        isOpen={showRevokeSessionsDialog}
        onClose={() => {
          handleDialogClose(setShowRevokeSessionsDialog);
          onActionComplete();
        }}
      />

      <UserRoleDialog
        user={user}
        isOpen={showRoleDialog}
        onClose={() => {
          handleDialogClose(setShowRoleDialog);
          onActionComplete();
        }}
      />

      <UserSegmentDialog
        user={user}
        isOpen={showSegmentDialog}
        onClose={() => {
          handleDialogClose(setShowSegmentDialog);
          onActionComplete();
        }}
      />

      <UserSendInAppNotificationDialog
        user={user}
        isOpen={showInAppNotificationDialog}
        onClose={() => handleDialogClose(setShowInAppNotificationDialog)}
      />

      <UserSendPushNotificationDialog
        user={user}
        isOpen={showPushNotificationDialog}
        onClose={() => handleDialogClose(setShowPushNotificationDialog)}
      />

      <StaffCreateTicketDialog
        isOpen={showCreateTicketDialog}
        onClose={() => handleDialogClose(setShowCreateTicketDialog)}
        targetUser={{
          id: user.id,
          name: user.name,
          email: user.email,
        }}
      />
    </>
  );
}

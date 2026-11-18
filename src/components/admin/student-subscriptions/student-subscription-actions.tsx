"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";

interface StudentSubscriptionActionsProps {
  subscription: StudentSubscriptionDTO;
  onEdit: (subscription: StudentSubscriptionDTO) => void;
  onDelete: (subscription: StudentSubscriptionDTO) => void;
  onViewDetails: (subscription: StudentSubscriptionDTO) => void;
}

export function StudentSubscriptionActions({
  subscription,
  onEdit,
  onDelete,
  onViewDetails,
}: StudentSubscriptionActionsProps) {
  const t = useTranslations("adminStudentSubscriptions");
  const [isOpen, setIsOpen] = useState(false);

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("actions.menuLabel")}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("actions.menuLabel")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => runAction(() => onViewDetails(subscription))}
          >
            <Eye />
            <span>{t("actions.viewDetails")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => runAction(() => onEdit(subscription))}
          >
            <Pencil />
            <span>{t("actions.edit")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => runAction(() => onDelete(subscription))}
          >
            <Trash2 />
            <span>{t("actions.delete")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClassDTO } from "@/shared/types/class.types";

interface ClassActionsProps {
  classItem: ClassDTO;
  onEdit: (classItem: ClassDTO) => void;
  onDelete: (classItem: ClassDTO) => void;
  onViewDetails: (classItem: ClassDTO) => void;
}

export function ClassActions({
  classItem,
  onEdit,
  onDelete,
  onViewDetails,
}: ClassActionsProps) {
  const t = useTranslations("adminClasses");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label={t("actions.menuLabel")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">
          {t("actions.menuLabel")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            onViewDetails(classItem);
          }}
          className="cursor-pointer gap-2 text-xs"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{t("actions.viewDetails")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            onEdit(classItem);
          }}
          className="cursor-pointer gap-2 text-xs"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{t("actions.edit")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            onDelete(classItem);
          }}
          className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{t("actions.delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

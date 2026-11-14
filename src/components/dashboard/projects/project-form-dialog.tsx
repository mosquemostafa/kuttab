"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProjectFormFields,
  PROJECT_COLOR_NONE,
} from "@/components/dashboard/projects/project-form-fields";
import {
  parseOptionalColorKeyFromFormValue,
  type ColorKey,
} from "@/shared/constants/color-palette";
import type {
  CreateProjectBody,
  UpdateProjectDTO,
} from "@/server/modules/projects/project.dto";
import type { ProjectDTO } from "@/shared/types/project.types";

type ProjectFormDialogCreateProps = {
  mode: "create";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProjectBody) => Promise<boolean>;
  isPending: boolean;
};

type ProjectFormDialogEditProps = {
  mode: "edit";
  project: ProjectDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateProjectDTO) => Promise<boolean>;
  isPending: boolean;
};

type ProjectFormDialogProps =
  | ProjectFormDialogCreateProps
  | ProjectFormDialogEditProps;

export function ProjectFormDialog(props: ProjectFormDialogProps) {
  const t = useTranslations("projects.list");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLOR_NONE);
  const [icon, setIcon] = useState("");

  const isCreate = props.mode === "create";

  useEffect(() => {
    if (props.mode !== "create" || !props.open) return;
    setName("");
    setDescription("");
    setColor(PROJECT_COLOR_NONE);
    setIcon("");
  }, [props.mode, props.mode === "create" ? props.open : false]);

  useEffect(() => {
    if (props.mode !== "edit" || !props.open || !props.project) return;
    const { name: n, description: d, colorKey, icon: ic } = props.project;
    setName(n);
    setDescription(d ?? "");
    setColor(colorKey ?? PROJECT_COLOR_NONE);
    setIcon(ic ?? "");
  }, [
    props.mode,
    props.mode === "edit" ? props.open : false,
    props.mode === "edit" ? props.project?.id : undefined,
  ]);

  const getColorLabel = (key: ColorKey) => {
    switch (key) {
      case "red":
        return t("colorKeys.red");
      case "orange":
        return t("colorKeys.orange");
      case "yellow":
        return t("colorKeys.yellow");
      case "green":
        return t("colorKeys.green");
      case "teal":
        return t("colorKeys.teal");
      case "blue":
        return t("colorKeys.blue");
      case "darkBlue":
        return t("colorKeys.darkBlue");
      case "purple":
        return t("colorKeys.purple");
      case "pink":
        return t("colorKeys.pink");
      case "brown":
        return t("colorKeys.brown");
      case "gray":
        return t("colorKeys.gray");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const payload = {
      name: trimmed,
      description: description.trim() || null,
      colorKey: parseOptionalColorKeyFromFormValue(color, PROJECT_COLOR_NONE),
      icon: icon.trim() || null,
    };

    if (isCreate) {
      const ok = await props.onSubmit(payload);
      if (ok) props.onOpenChange(false);
      return;
    }

    if (!props.project) return;
    const ok = await props.onSubmit(props.project.id, payload);
    if (ok) props.onOpenChange(false);
  }

  const idPrefix = isCreate ? "create-project" : "edit-project";
  const title = isCreate ? t("createCardTitle") : t("editTitle");
  const submitLabel = isCreate
    ? props.isPending
      ? t("creating")
      : t("submitCreate")
    : props.isPending
      ? t("saving")
      : t("save");

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md overflow-hidden p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="relative isolate flex max-h-[85dvh] flex-col"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {isCreate ? (
              <DialogDescription>
                {t("createCardDescription")}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{title}</DialogDescription>
            )}
          </DialogHeader>
          <div className="overflow-y-auto py-4 pr-1">
            <ProjectFormFields
              idPrefix={idPrefix}
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              color={color}
              onColorChange={setColor}
              icon={icon}
              onIconChange={setIcon}
              labels={{
                name: t("nameLabel"),
                namePlaceholder: t("namePlaceholder"),
                description: t("descriptionLabel"),
                descriptionPlaceholder: t("descriptionPlaceholder"),
                color: t("colorLabel"),
                colorNone: t("colorNone"),
                emojiClear: t("emojiClear"),
              }}
              getColorLabel={getColorLabel}
              inDialog
            />
          </div>
          <DialogFooter className="mt-1 flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={props.isPending || !name.trim()}
              className="w-full sm:w-auto"
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

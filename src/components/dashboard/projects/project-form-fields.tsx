"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaletteColorPicker } from "@/components/ui/palette-color-picker";
import { EmojiPickerField } from "@/components/emoji-picker-field";
import {
  COLOR_KEYS,
  PROJECT_COLOR_NONE,
  type ColorKey,
} from "@/shared/constants/color-palette";

export { PROJECT_COLOR_NONE } from "@/shared/constants/color-palette";

type ProjectFormFieldsProps = {
  idPrefix: string;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  icon: string;
  onIconChange: (value: string) => void;
  labels: {
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    color: string;
    colorNone: string;
    emojiClear: string;
  };
  getColorLabel: (key: ColorKey) => string;
  /** Form is inside a project create/edit dialog */
  inDialog?: boolean;
  /** Optional custom portal; omit to use `document.body` (prevents pickers from being clipped inside dialogs). */
  portalContainer?: HTMLElement | null;
};

export function ProjectFormFields({
  idPrefix,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  color,
  onColorChange,
  icon,
  onIconChange,
  labels,
  getColorLabel,
  inDialog = false,
  portalContainer,
}: ProjectFormFieldsProps) {
  const selectedColorKey =
    color === PROJECT_COLOR_NONE
      ? null
      : (COLOR_KEYS.find((key) => key === color) ?? null);

  return (
    <div className="grid gap-4">
      {/* Name + Icon row */}
      <div className="flex items-start gap-3">
        <EmojiPickerField
          idPrefix={idPrefix}
          value={icon}
          onChange={onIconChange}
          pickLabel=""
          clearLabel={labels.emojiClear}
          inDialog={inDialog}
          portalContainer={portalContainer}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={`${idPrefix}-name`} className="sr-only">
            {labels.name}
          </Label>
          <Input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={labels.namePlaceholder}
            maxLength={255}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>{labels.description}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={labels.descriptionPlaceholder}
          rows={3}
          maxLength={5000}
        />
      </div>
      <div className="space-y-2">
        <Label>{labels.color}</Label>
        <PaletteColorPicker
          mode="input"
          value={selectedColorKey}
          onChange={(next) => onColorChange(next ?? PROJECT_COLOR_NONE)}
          inputNoneLabel={labels.colorNone}
          getColorLabel={getColorLabel}
          triggerAriaLabel={labels.color}
          align={inDialog ? "start" : "center"}
        />
      </div>
    </div>
  );
}

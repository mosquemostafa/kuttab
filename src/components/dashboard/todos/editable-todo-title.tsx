"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EditableTodoTitleProps = {
  title: string;
  isDone: boolean;
  onSave: (nextTitle: string) => Promise<void>;
  textClassName: string;
  inputClassName: string;
};

export function EditableTodoTitle({
  title,
  isDone,
  onSave,
  textClassName,
  inputClassName,
}: EditableTodoTitleProps) {
  const t = useTranslations("todos");
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(title);
    }
  }, [isEditing, title]);

  useEffect(() => {
    if (!isEditing || !textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [draft, isEditing]);

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(title);
      setIsEditing(false);
      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void commit();
    }
  };

  const commit = async () => {
    if (isSaving) {
      return;
    }

    const trimmed = draft.trim();

    if (!trimmed || trimmed === title) {
      setDraft(title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        id={inputId}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          event.target.style.height = "auto";
          event.target.style.height = `${event.target.scrollHeight}px`;
        }}
        onBlur={() => {
          void commit();
        }}
        onKeyDown={handleDraftKeyDown}
        autoFocus
        rows={1}
        disabled={isSaving}
        className={cn(
          "resize-none overflow-hidden whitespace-pre-wrap wrap-break-word",
          inputClassName,
        )}
        aria-label={t("aria.editTaskTitle")}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full text-start"
      aria-label={t("aria.editTaskTitle")}
    >
      <p className={cn(textClassName, isDone && "text-muted-foreground")}>
        {title}
      </p>
    </button>
  );
}

"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { FolderOpen } from "lucide-react";

import { useProjectsStore } from "@/components/projects/projects-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { projectColorKeyToIconTextClass } from "@/shared/constants/color-palette";

const NONE_VALUE = "__project_none__" as const;

function mergeTriggerAccessibility(
  trigger: ReactNode,
  ariaLabel: string,
  disabled?: boolean,
): ReactNode {
  if (isValidElement(trigger)) {
    return cloneElement(trigger as ReactElement<Record<string, unknown>>, {
      "aria-label": ariaLabel,
      ...(disabled ? { disabled: true } : {}),
    });
  }
  return (
    <button type="button" aria-label={ariaLabel} disabled={disabled}>
      {trigger}
    </button>
  );
}

export function ProjectPickerDropdown({
  value,
  onChange,
  noneLabel,
  ariaLabel,
  disabled,
  align = "end",
  trigger,
}: {
  value: string | null;
  onChange: (next: string | null) => void | Promise<void>;
  noneLabel: string;
  ariaLabel: string;
  disabled?: boolean;
  align?: "start" | "end";
  trigger: ReactNode;
}) {
  const { projects } = useProjectsStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {mergeTriggerAccessibility(trigger, ariaLabel, disabled)}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="max-h-72 w-56 overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={value ?? NONE_VALUE}
          onValueChange={async (nextValue) => {
            const next = nextValue === NONE_VALUE ? null : nextValue;
            if (next === value) return;
            await onChange(next);
          }}
        >
          <DropdownMenuRadioItem value={NONE_VALUE}>
            {noneLabel}
          </DropdownMenuRadioItem>
          {projects.map((p) => {
            const rowTintClass = projectColorKeyToIconTextClass(p.colorKey);
            return (
              <DropdownMenuRadioItem key={p.id} value={p.id}>
                <span className="flex min-w-0 items-center gap-2">
                  <FolderOpen
                    className={cn(
                      "size-4 shrink-0",
                      rowTintClass ?? "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">{p.name}</span>
                  {p.icon ? <span className="shrink-0">{p.icon}</span> : null}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

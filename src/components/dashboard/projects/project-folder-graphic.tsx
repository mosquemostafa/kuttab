"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { ColorKey } from "@/shared/constants/color-palette";
import { isColorKey } from "@/shared/constants/color-palette";

type FinderFolderGraphicProps = {
  /** Tint from the palette; use `dashed` when there is no tint (`null` / “no color”). */
  colorKey: ColorKey | null;
  icon?: string | null;
  dashed?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const TAB_PATH = "M 7 0 H 59 Q 67 0 67 8 V 28 H 0 V 8 Q 0 0 7 0 Z";

/** Dashed tab: open path (no bottom edge), sides end at y=21 to meet the body top. */
const TAB_PATH_DASHED = "M 0 21 V 8 Q 0 0 7 0 H 59 Q 67 0 67 8 V 21";

const BODY_PATH =
  "M 0 21 H 147 Q 160 21 160 34 V 115 Q 160 128 147 128 H 13 Q 0 128 0 115 V 21 Z";

function finderTintDataAttr(colorKey: ColorKey | null): string {
  if (colorKey && isColorKey(colorKey)) return colorKey;
  return "fallback";
}

export function FinderFolderGraphic({
  colorKey,
  icon,
  dashed = false,
  className,
  children,
}: FinderFolderGraphicProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  if (dashed) {
    return (
      <div
        className={cn(
          "relative mx-auto w-full max-w-[110px] select-none",
          className,
        )}
      >
        <svg
          viewBox="0 0 160 128"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto w-full"
          aria-hidden
        >
          <path
            d={TAB_PATH_DASHED}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="7 4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/40"
          />
          <path
            d={BODY_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="7 4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/40"
          />
          {icon ? (
            <text
              x="80"
              y="88"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="44"
              style={{ filter: "drop-shadow(0 1.5px 3px rgba(0,0,0,0.2))" }}
            >
              {icon}
            </text>
          ) : null}
        </svg>

        {children && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center"
            style={{ top: "22%" }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }

  const tintAttr = finderTintDataAttr(colorKey);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[110px] select-none",
        className,
      )}
    >
      <svg
        data-finder-tint={tintAttr}
        viewBox="0 0 160 128"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
        style={{
          filter:
            "drop-shadow(0 6px 14px rgba(0,0,0,0.36))" +
            " drop-shadow(0 2px 4px rgba(0,0,0,0.22))",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`tab-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--finder-tab-a)" />
            <stop offset="100%" stopColor="var(--finder-tab-b)" />
          </linearGradient>

          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--finder-body-a)" />
            <stop offset="60%" stopColor="var(--finder-body-b)" />
            <stop
              offset="100%"
              stopColor="var(--finder-body-b)"
              stopOpacity={0.88}
            />
          </linearGradient>

          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity={0.42} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
          <clipPath id={`sc-${uid}`}>
            <rect x="0" y="21" width="160" height="44" />
          </clipPath>
        </defs>

        <path d={BODY_PATH} fill={`url(#body-${uid})`} />

        <line
          x1="0"
          y1="22.5"
          x2="160"
          y2="22.5"
          stroke="white"
          strokeWidth="1.4"
          strokeOpacity={0.5}
        />

        <path
          d={BODY_PATH}
          fill={`url(#sheen-${uid})`}
          clipPath={`url(#sc-${uid})`}
        />

        <path
          d="M 0 108 H 160 V 115 Q 160 128 147 128 H 13 Q 0 128 0 115 Z"
          fill="rgba(0,0,0,0.10)"
        />

        <path d={TAB_PATH} fill={`url(#tab-${uid})`} />

        <path
          d="M 7 1.8 H 59 Q 65.2 1.8 65.2 8"
          fill="none"
          stroke="white"
          strokeWidth="1.4"
          strokeOpacity={0.48}
          strokeLinecap="round"
        />

        {icon && (
          <text
            x="80"
            y="88"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="44"
            style={{ filter: "drop-shadow(0 1.5px 3px rgba(0,0,0,0.26))" }}
          >
            {icon}
          </text>
        )}
      </svg>

      {children && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center"
          style={{ top: "22%" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

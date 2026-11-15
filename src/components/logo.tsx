import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-lg",
  md: "h-8 w-8 rounded-xl",
  lg: "h-10 w-10 rounded-xl",
};

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const t = useTranslations("header");

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-white shadow-xs border border-emerald-500/30 overflow-hidden shrink-0",
        sizeMap[size],
        className,
      )}
      aria-label={t("brandLogoAlt")}
      title={t("brandLogoAlt")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "transition-transform duration-200",
          size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5",
        )}
      >
        {/* Subtle Islamic 8-pointed star / Rub el Hizb watermark */}
        <path
          d="M12 2L13.2 4.3L15.6 3.6L15.9 6.2L18.4 6.8L17.5 9.2L19.5 10.9L17.7 12.8L18.8 15.1L16.3 16L15.9 18.5L13.4 18.2L12 20.3L10.6 18.2L8.1 18.5L7.7 16L5.2 15.1L6.3 12.8L4.5 10.9L6.5 9.2L5.6 6.8L8.1 6.2L8.4 3.6L10.8 4.3L12 2Z"
          fill="currentColor"
          fillOpacity="0.14"
        />
        {/* Open Holy Quran - left and right curved pages */}
        <path
          d="M12 6.5C10.2 5.3 7.5 5 4 5.3V16.8C7.5 16.5 10.2 16.8 12 18M12 6.5C13.8 5.3 16.5 5 20 5.3V16.8C16.5 16.5 13.8 16.8 12 18M12 6.5V18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Traditional Wooden Rihal Base */}
        <path
          d="M7.5 19.5L12 17.5L16.5 19.5"
          stroke="#eab308"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Golden bookmark ribbon */}
        <path
          d="M12 8C12 10.2 12.8 11.5 13.2 13L12 12.2L10.8 13C11.2 11.5 12 10.2 12 8Z"
          fill="#facc15"
        />
        {/* Quranic page lines */}
        <line
          x1="6.5"
          y1="8.5"
          x2="9.5"
          y2="8.8"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <line
          x1="6.5"
          y1="11.5"
          x2="9.5"
          y2="11.8"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <line
          x1="14.5"
          y1="8.8"
          x2="17.5"
          y2="8.5"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <line
          x1="14.5"
          y1="11.8"
          x2="17.5"
          y2="11.5"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </svg>
    </div>
  );
};

import Image from "next/image";
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
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes="40px"
        className="object-contain p-1 transition-transform duration-200"
      />
    </div>
  );
};

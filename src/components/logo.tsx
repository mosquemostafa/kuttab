import Image from "next/image";
import { useTranslations } from "next-intl";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const t = useTranslations("header");

  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-primary ${sizeMap[size]} ${className}`}
    >
      <Image
        src="/logo.png"
        alt={t("brandLogoAlt")}
        width={24}
        height={24}
        className="h-6 w-6 object-contain dark:invert"
      />
    </div>
  );
};

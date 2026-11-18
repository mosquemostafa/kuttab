"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  placeholder?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export default function PasswordInput({
  value,
  onChange,
  id: idProp,
  placeholder = "Password",
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
}: PasswordInputProps) {
  const t = useTranslations("auth.passwordRequirements");
  const id = useId();
  const inputId = idProp || id;
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: t("minCharacters") },
      { regex: /[0-9]/, text: t("number") },
      { regex: /[a-z]/, text: t("lowercase") },
      { regex: /[A-Z]/, text: t("uppercase") },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const strength = checkStrength(value);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return t("enterPassword");
    if (score <= 2) return t("weak");
    if (score === 3) return t("medium");
    return t("strong");
  };

  const allRequirementsMet = strengthScore === 4;
  const shouldShowRequirements = value.length > 0 && !allRequirementsMet;

  return (
    <div>
      {/* Password input field with toggle visibility button */}
      <div className="*:not-first:mt-2">
        <div className="relative">
          <Input
            id={inputId}
            className="pe-9"
            placeholder={placeholder}
            type={isVisible ? "text" : "password"}
            value={value}
            onChange={onChange}
            aria-describedby={`${inputId}-description`}
          />
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Password strength indicator and requirements - only show if needed */}
      {shouldShowRequirements && (
        <>
          <div
            className="bg-border mt-3 mb-4 h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label={t("strength")}
          >
            <div
              className={`h-full ${getStrengthColor(
                strengthScore,
              )} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            ></div>
          </div>

          {/* Password strength description */}
          <p
            id={`${id}-description`}
            className="text-foreground mb-2 text-sm font-medium"
          >
            {getStrengthText(strengthScore)}. {t("mustContain")}
          </p>

          {/* Password requirements list */}
          <ul className="space-y-1.5" aria-label={t("requirements")}>
            {strength.map((req, index) => (
              <li key={index} className="flex items-center gap-2">
                {req.met ? (
                  <CheckIcon
                    size={16}
                    className="text-emerald-500"
                    aria-hidden="true"
                  />
                ) : (
                  <XIcon
                    size={16}
                    className="text-muted-foreground/80"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-xs ${
                    req.met ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  {req.text}
                  <span className="sr-only">
                    {req.met ? ` - ${t("met")}` : ` - ${t("notMet")}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

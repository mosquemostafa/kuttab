"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { clearAppData } from "@/lib/clearAppData";

export function ClearDataButton() {
  const t = useTranslations("common");
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    await clearAppData();
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="default"
      onClick={handleClear}
      disabled={clearing}
      aria-busy={clearing}
    >
      {clearing ? t("clearData.clearing") : t("clearData.button")}
    </Button>
  );
}

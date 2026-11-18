"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";

export function useSubscriptionTypeLabel() {
  const t = useTranslations("adminStudentSubscriptions");

  return useCallback(
    (type: StudentSubscriptionType) => {
      switch (type) {
        case StudentSubscriptionType.INSTALLMENTS:
          return t("paymentMethods.installments");
        case StudentSubscriptionType.MONTHLY:
          return t("paymentMethods.monthly");
        case StudentSubscriptionType.YEARLY:
          return t("paymentMethods.yearly");
      }
    },
    [t],
  );
}

import { Resend } from "resend";

import { env, newsletterDeliveryEnabled } from "@/server/lib/env";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!newsletterDeliveryEnabled || !env.RESEND_API_KEY) {
    throw new Error("Resend is not configured");
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

type NewsletterOutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional RFC 2369 List-Unsubscribe header value */
  listUnsubscribe?: string;
};

export async function sendNewsletterEmail(
  payload: NewsletterOutboundEmail,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (process.env.RESEND_DRY_RUN === "true" || env.RESEND_DRY_RUN) {
    return { ok: true, id: `mock_resend_${Date.now()}` };
  }

  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;
  const headers: Record<string, string> = {};
  if (payload.listUnsubscribe) {
    headers["List-Unsubscribe"] = payload.listUnsubscribe;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      return { ok: false, error: "Resend returned no message id" };
    }
    return { ok: true, id: data.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export type NewsletterBatchRecipient = {
  subscriberId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  listUnsubscribe?: string;
};

type NewsletterBatchSendResult =
  | {
      ok: true;
      rateLimited?: false;
      items: Array<{
        subscriberId: string;
        ok: boolean;
        id?: string;
        error?: string;
      }>;
      successCount: number;
      failCount: number;
    }
  | {
      ok: false;
      rateLimited: true;
      retryAfterSec: number;
      error: string;
    }
  | {
      ok: false;
      rateLimited: false;
      error: string;
    };

/**
 * Dispatches up to 100 emails in a single HTTP request using Resend's Batch Send API.
 * Includes Idempotency-Key support and automated dry-run / rate-limit detection.
 */
export async function sendNewsletterBatchEmail(
  recipients: NewsletterBatchRecipient[],
  options?: { idempotencyKey?: string },
): Promise<NewsletterBatchSendResult> {
  if (recipients.length === 0) {
    return { ok: true, items: [], successCount: 0, failCount: 0 };
  }

  // Dry-run mode: mock immediate success for testing load without real emails
  if (process.env.RESEND_DRY_RUN === "true" || env.RESEND_DRY_RUN) {
    return {
      ok: true,
      items: recipients.map((r, idx) => ({
        subscriberId: r.subscriberId,
        ok: true,
        id: `mock_resend_${Date.now()}_${idx}`,
      })),
      successCount: recipients.length,
      failCount: 0,
    };
  }

  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  const batchPayload = recipients.map((item) => {
    const headers: Record<string, string> = {};
    if (item.listUnsubscribe) {
      headers["List-Unsubscribe"] = item.listUnsubscribe;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    return {
      from,
      to: item.to,
      subject: item.subject,
      html: item.html,
      ...(item.text ? { text: item.text } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };
  });

  try {
    const resend = getResend();
    const { data, error } = await resend.batch.send(batchPayload, {
      ...(options?.idempotencyKey
        ? { idempotencyKey: options.idempotencyKey }
        : {}),
      batchValidation: "permissive",
    });

    if (error) {
      const errorMsg = error.message || "";
      const isRateLimited =
        errorMsg.toLowerCase().includes("rate limit") ||
        errorMsg.toLowerCase().includes("too many requests") ||
        (error as { statusCode?: number }).statusCode === 429;

      if (isRateLimited) {
        return {
          ok: false,
          rateLimited: true,
          retryAfterSec: 5,
          error: errorMsg,
        };
      }

      return {
        ok: false,
        rateLimited: false,
        error: errorMsg,
      };
    }

    const errorByIndex = new Map<number, string>();
    if (
      data &&
      "errors" in data &&
      Array.isArray(
        (data as { errors?: Array<{ index: number; message: string }> }).errors,
      )
    ) {
      for (const err of (
        data as { errors: Array<{ index: number; message: string }> }
      ).errors) {
        errorByIndex.set(err.index, err.message);
      }
    }

    const items = recipients.map((sub, index) => {
      const specificError = errorByIndex.get(index);
      const resItem = data?.data?.[index];
      if (resItem?.id && !specificError) {
        return { subscriberId: sub.subscriberId, ok: true, id: resItem.id };
      }
      return {
        subscriberId: sub.subscriberId,
        ok: false,
        error: specificError || "Missing message ID from Resend batch response",
      };
    });

    const successCount = items.filter((i) => i.ok).length;
    const failCount = items.length - successCount;

    return {
      ok: true,
      items,
      successCount,
      failCount,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const isRateLimited = message.toLowerCase().includes("429");
    if (isRateLimited) {
      return {
        ok: false,
        rateLimited: true,
        retryAfterSec: 5,
        error: message,
      };
    }
    return { ok: false, rateLimited: false, error: message };
  }
}

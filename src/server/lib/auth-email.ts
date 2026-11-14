import { Resend } from "resend";

import { env } from "@/server/lib/env";
import { sendEmail as sendGmailEmail } from "@/server/lib/email";

type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let resendClient: Resend | null = null;
let warnedAboutFallback = false;

function isResendConfiguredForAuth(): boolean {
  return Boolean(
    env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.RESEND_FROM_NAME,
  );
}

function getResend(): Resend {
  if (!resendClient) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

export async function sendAuthEmail(payload: OutboundEmail): Promise<boolean> {
  if (!isResendConfiguredForAuth()) {
    if (!warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        "Auth email fallback: Resend is not fully configured (RESEND_API_KEY/RESEND_FROM_EMAIL/RESEND_FROM_NAME). Falling back to Gmail SMTP.",
      );
    }

    return sendGmailEmail(payload);
  }

  const from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      ...(payload.html ? { html: payload.html } : {}),
      text: payload.text,
    });

    if (error) {
      console.error("Error sending auth email with Resend:", error);
      return false;
    }

    return Boolean(data?.id);
  } catch (e: unknown) {
    console.error("Error sending auth email:", e);
    return false;
  }
}

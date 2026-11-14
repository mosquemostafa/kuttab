import { Resend } from "resend";
import { env } from "@/server/lib/env";
import { sendEmail } from "@/server/lib/email";
import type { ContactDTO } from "@/server/modules/contact/contact.dto";

export const contactService = {
  async sendContactMessage(data: ContactDTO): Promise<void> {
    const { name, email, message } = data;
    const toEmail =
      env.CONTACT_EMAIL || env.RESEND_FROM_EMAIL || env.GMAIL_USER;

    if (!toEmail) {
      throw new Error("No contact email configured in environment.");
    }

    if (env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY);
        const fromEmail = env.RESEND_FROM_EMAIL || "contact@example.com";

        const { error } = await resend.emails.send({
          from: `Contact Form <${fromEmail}>`,
          to: [toEmail],
          replyTo: email,
          subject: `New Contact Form Submission from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });

        if (!error) {
          return;
        }
        console.warn("Resend email failed, attempting Gmail fallback:", error);
      } catch (err) {
        console.warn("Resend throw error, attempting Gmail fallback:", err);
      }
    }

    // Gmail fallback
    const sent = await sendEmail({
      to: toEmail,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (!sent) {
      throw new Error("Failed to send contact message.");
    }
  },
};

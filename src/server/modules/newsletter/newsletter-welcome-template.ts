/**
 * Transactional welcome email after newsletter subscribe.
 * Uses table-based layout and plain-text part for deliverability; content is factual (who, why, how to leave).
 */

type WelcomeEmailBundle = {
  subject: string;
  html: string;
  text: string;
  listUnsubscribe: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWelcomeEmailBundle(params: {
  locale: "ar" | "en";
  unsubscribeUrl: string;
  publicAppUrl: string;
}): WelcomeEmailBundle {
  const { locale, unsubscribeUrl, publicAppUrl } = params;
  const site = publicAppUrl.replace(/\/$/, "");
  const safeUnsub = escapeHtml(unsubscribeUrl);
  const safeSite = escapeHtml(site);

  if (locale === "ar") {
    const subject = "📬 أهلاً بك في النشرة البريدية";
    const preheader = "رسالة دورية مختصرة ومفيدة، بدون إزعاج.";
    const text = [
      "مرحبًا 👋",
      "",
      "سعداء بانضمامك إلى النشرة البريدية.",
      "",
      "من الآن فصاعدًا، سيصلك بشكل دوري:",
      "• تحديثات مستمرة وأخبار جديدة",
      "• أفكار عملية تساعدك في إنجاز أعمالك",
      "",
      "⸻",
      "",
      `زيارة الموقع: ${site}`,
      "",
      `إلغاء الاشتراك: ${unsubscribeUrl}`,
      "",
      "فريق العمل",
    ].join("\n");

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:28px 28px 8px 28px;text-align:right;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.02em;color:#52525b;text-transform:uppercase;">SaaS Starter</p>
              <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.35;font-weight:700;color:#18181b;">📬 أهلاً بك في النشرة البريدية</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;text-align:right;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#3f3f46;">
                مرحبًا 👋
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#52525b;">
                سعداء بانضمامك إلى النشرة البريدية.
              </p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.65;color:#52525b;">
                من الآن فصاعدًا، سيصلك بشكل دوري:
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.85;color:#52525b;">
                • تحديثات مستمرة وأخبار جديدة<br>
                • أفكار عملية تساعدك في إنجاز أعمالك
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${safeSite}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">زيارة الموقع</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;border-top:1px solid #e4e4e7;text-align:right;">
              <p style="margin:20px 0 8px 0;font-size:12px;line-height:1.55;color:#71717a;">
                تلقيت هذه الرسالة لأنك اشتركت في النشرة البريدية. إذا لم تطلب ذلك، يمكنك تجاهل الرسالة أو إلغاء الاشتراك أدناه.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:#71717a;">
                <a href="${safeUnsub}" style="color:#3b82f6;text-decoration:underline;">إلغاء الاشتراك</a>
                &nbsp;·&nbsp;
                <a href="${safeSite}" style="color:#3b82f6;text-decoration:underline;">الموقع</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#a1a1aa;text-align:center;max-width:560px;">
          فريق العمل
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return {
      subject,
      html,
      text,
      listUnsubscribe: `<${unsubscribeUrl}>`,
    };
  }

  const subject = "📬 Welcome to the newsletter";
  const preheader = "One short, useful periodic email. No noise. No spam.";
  const text = [
    "Hey 👋",
    "",
    "Welcome to the newsletter — we’re glad you’re here.",
    "",
    "Starting now, you’ll receive periodic updates with:",
    "• Product news and new features",
    "• Practical tips and guides",
    "",
    "⸻",
    "",
    `Visit us: ${site}`,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
    "",
    "The Team",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#52525b;text-transform:uppercase;">SaaS Starter</p>
              <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#18181b;">📬 Welcome to the newsletter</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#3f3f46;">
                Hey 👋
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#52525b;">
                Welcome to the newsletter — we’re glad you’re here.
              </p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.65;color:#52525b;">
                Starting now, you’ll receive periodic updates with:
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.85;color:#52525b;">
                • Product news and new features<br>
                • Practical tips and guides
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${safeSite}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open App</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;border-top:1px solid #e4e4e7;">
              <p style="margin:20px 0 8px 0;font-size:12px;line-height:1.55;color:#71717a;">
                You’re receiving this because you signed up for the newsletter. If that wasn’t you, you can ignore this message or unsubscribe below.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:#71717a;">
                <a href="${safeUnsub}" style="color:#2563eb;text-decoration:underline;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="${safeSite}" style="color:#2563eb;text-decoration:underline;">Website</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#a1a1aa;text-align:center;max-width:560px;">
          The Team
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    html,
    text,
    listUnsubscribe: `<${unsubscribeUrl}>`,
  };
}

import { Marked, type Tokens } from "marked";

import { env } from "@/server/lib/env";

const DEFAULT_LOCALE = "ar";

export function resolveFooterLocale(locale: string | null): string {
  return locale === "en" || locale === "ar" ? locale : DEFAULT_LOCALE;
}

export function localizedCampaignField(
  locale: string | null,
  ar: string,
  en: string,
): string {
  return resolveFooterLocale(locale) === "en" ? en : ar;
}

export function buildUnsubscribeUrl(
  appUrl: string,
  locale: string,
  token: string,
): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/${locale}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createEmailMarkdownParser(dir: "rtl" | "ltr") {
  const isRtl = dir === "rtl";
  const align = isRtl ? "right" : "left";
  const m = new Marked();

  m.use({
    renderer: {
      heading(token: Tokens.Heading) {
        const text = this.parser.parseInline(token.tokens);
        const sizes: Record<number, string> = {
          1: "24px",
          2: "20px",
          3: "18px",
          4: "16px",
          5: "15px",
          6: "14px",
        };
        const size = sizes[token.depth] || "16px";
        return `<h${token.depth} dir="${dir}" style="margin:24px 0 12px 0;font-size:${size};line-height:1.45;font-weight:700;color:#09090b;text-align:${align};direction:${dir};">${text}</h${token.depth}>\n`;
      },
      paragraph(token: Tokens.Paragraph) {
        const text = this.parser.parseInline(token.tokens);
        return `<p dir="${dir}" style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:#27272a;text-align:${align};direction:${dir};">${text}</p>\n`;
      },
      list(token: Tokens.List) {
        const tag = token.ordered ? "ol" : "ul";
        const paddingStyle = isRtl
          ? "padding:0 24px 0 0;"
          : "padding:0 0 0 24px;";
        let body = "";
        for (const item of token.items) {
          body += this.listitem(item);
        }
        return `<${tag} dir="${dir}" style="margin:0 0 18px 0;${paddingStyle}color:#27272a;text-align:${align};direction:${dir};">${body}</${tag}>\n`;
      },
      listitem(token: Tokens.ListItem) {
        const text = this.parser.parse(token.tokens);
        return `<li dir="${dir}" style="margin-bottom:8px;font-size:16px;line-height:1.75;text-align:${align};direction:${dir};">${text}</li>\n`;
      },
      blockquote(token: Tokens.Blockquote) {
        const text = this.parser.parse(token.tokens);
        const borderSide = isRtl ? "border-right" : "border-left";
        return `<blockquote dir="${dir}" style="margin:16px 0;padding:10px 18px;${borderSide}:4px solid #d4d4d8;background-color:#f8fafc;color:#52525b;text-align:${align};direction:${dir};">${text}</blockquote>\n`;
      },
      link(token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<a href="${escapeHtml(token.href)}"${title} style="color:#2563eb;text-decoration:underline;">${text}</a>`;
      },
      image(token: Tokens.Image) {
        return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text || "")}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:18px 0;" />`;
      },
      hr(_token: Tokens.Hr) {
        return `<hr style="border:0;border-top:1px solid #e4e4e7;margin:28px 0;" />\n`;
      },
      codespan(token: Tokens.Codespan) {
        return `<code style="font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:13px;padding:2px 6px;border-radius:4px;background-color:#f4f4f5;color:#09090b;">${escapeHtml(token.text)}</code>`;
      },
      code(token: Tokens.Code) {
        return `<pre dir="ltr" style="margin:16px 0;padding:14px;background-color:#18181b;color:#f4f4f5;border-radius:8px;overflow-x:auto;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.5;direction:ltr;text-align:left;"><code>${escapeHtml(token.text)}</code></pre>\n`;
      },
      table(token: Tokens.Table) {
        let header = "";
        for (const cell of token.header) {
          header += `<th dir="${dir}" style="padding:10px 12px;border-bottom:2px solid #e4e4e7;font-size:14px;font-weight:600;color:#09090b;text-align:${align};">${this.parser.parseInline(cell.tokens)}</th>`;
        }
        let body = "";
        for (const row of token.rows) {
          let rowHtml = "";
          for (const cell of row) {
            rowHtml += `<td dir="${dir}" style="padding:10px 12px;border-bottom:1px solid #f4f4f5;font-size:14px;color:#27272a;text-align:${align};">${this.parser.parseInline(cell.tokens)}</td>`;
          }
          body += `<tr>${rowHtml}</tr>`;
        }
        return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${dir}" style="margin:18px 0;border-collapse:collapse;direction:${dir};"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>\n`;
      },
    },
  });

  return m;
}

const rtlParser = createEmailMarkdownParser("rtl");
const ltrParser = createEmailMarkdownParser("ltr");

/**
 * Converts Markdown campaign body to email-safe HTML with explicit direction and inline styles.
 */
export function renderNewsletterBodyToHtml(
  value: string,
  locale?: string | null,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const loc = resolveFooterLocale(locale ?? null);
  const parser = loc === "en" ? ltrParser : rtlParser;

  return parser.parse(trimmed) as string;
}

/**
 * Wraps the campaign body into a full, responsive HTML email template card (max-width: 600px).
 * Enforces proper RTL/LTR document layout, centered card layout, brand header, and compliant footer.
 */
export function buildCampaignEmailHtml(params: {
  bodyHtml: string;
  subject: string;
  locale: string | null;
  token: string;
  coverImageUrl?: string | null;
}): string {
  const loc = resolveFooterLocale(params.locale);
  const isRtl = loc === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";
  const fontFamily = isRtl
    ? "system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif"
    : "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://example.com").replace(
    /\/$/,
    "",
  );
  const unsubUrl = buildUnsubscribeUrl(appUrl, loc, params.token);
  const unsubLabel = loc === "en" ? "Unsubscribe" : "إلغاء الاشتراك";
  const reason =
    loc === "en"
      ? "You are receiving this because you subscribed to our newsletter."
      : "وصلتك هذه الرسالة لأنك مشترك في نشرتنا البريدية.";
  const brandName = isRtl ? "مسجد المصطفى" : "Almostafa";
  const websiteLabel = isRtl ? "الموقع الرسمي" : "Website";
  const teamLabel = isRtl ? "فريق العمل" : "The Team";

  const coverImageHtml = params.coverImageUrl?.trim()
    ? `<tr><td style="padding:0;direction:${dir};"><img src="${escapeHtml(params.coverImageUrl.trim())}" alt="${escapeHtml(params.subject)}" style="width:100%;max-width:600px;height:auto;display:block;border-bottom:1px solid #e4e4e7;" /></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${loc}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(params.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:${fontFamily};direction:${dir};text-align:${align};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;direction:${dir};">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${dir}" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 3px rgba(0,0,0,0.04);direction:${dir};text-align:${align};">
          ${coverImageHtml}
          <!-- Brand Header -->
          <tr>
            <td style="padding:28px 32px 12px 32px;direction:${dir};text-align:${align};">
              <a href="${appUrl}" style="text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.02em;color:#18181b;">
                ${brandName}
              </a>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:4px 32px 28px 32px;font-family:${fontFamily};direction:${dir};text-align:${align};">
              ${params.bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 24px 32px;border-top:1px solid #e4e4e7;background-color:#fafafa;direction:${dir};text-align:${align};">
              <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#71717a;direction:${dir};text-align:${align};">
                ${reason}
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;direction:${dir};text-align:${align};">
                <a href="${unsubUrl}" style="color:#2563eb;text-decoration:underline;">${unsubLabel}</a>
                &nbsp;·&nbsp;
                <a href="${appUrl}" style="color:#71717a;text-decoration:none;">${websiteLabel}</a>
              </p>
            </td>
          </tr>
        </table>
        <!-- Sub-footer -->
        <p style="margin:16px 0 0 0;font-size:12px;color:#a1a1aa;text-align:center;max-width:600px;">
          ${teamLabel}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Backward-compatible helper that wraps body with list footer or delegates to full template.
 */

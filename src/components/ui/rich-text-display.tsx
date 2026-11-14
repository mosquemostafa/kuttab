import DOMPurify from "isomorphic-dompurify";
import { Marked, type Token, type Tokens } from "marked";
import { cn } from "@/lib/utils";
import styles from "@/components/ui/rich-text-display.module.css";

type RichTextDisplayProps = {
  markdown: string;
  className?: string;
  /** BCP 47 language of the article (e.g. en | ar); tunes font stack for that script */
  lang?: string;
  /** Text direction for lists, quotes, etc. (should match the content locale) */
  dir?: "ltr" | "rtl" | "auto";
  /** Whether headings can be folded/toggled like Obsidian (defaults to true) */
  collapsibleHeadings?: boolean;
};

const isBlank = (t: Token) => t.type === "space";

/**
 * Dedicated Marked parser instance.
 * By default, marked's renderer.space returns "" (discarding blank lines).
 * We override renderer.space to render extra \n\n separators as &nbsp; paragraphs.
 */
const markdownParser = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    space(token) {
      const count = (token.raw.replace(/\r\n/g, "\n").match(/\n\n/g) || [])
        .length;
      return count > 1 ? "<p>&nbsp;</p>\n".repeat(count - 1) : "";
    },
    paragraph(token: Tokens.Paragraph) {
      return `<p dir="auto">${this.parser.parseInline(token.tokens)}</p>\n`;
    },
    heading(token: Tokens.Heading) {
      return `<h${token.depth} class="rtd-heading-static" data-heading-level="${token.depth}" dir="auto">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
    },
    list(token) {
      const tag = token.ordered ? "ol" : "ul";
      const start =
        token.ordered && token.start !== 1 ? ` start="${token.start}"` : "";
      const hasTask = token.items.some((item) => item.task);
      const className = hasTask ? ' class="contains-task-list"' : "";
      let body = "";
      for (const item of token.items) {
        body += this.listitem(item);
      }
      return `<${tag}${className}${start}>\n${body}</${tag}>\n`;
    },
    listitem(item) {
      const text = this.parser.parse(item.tokens);
      const isTask = item.task;
      return `<li dir="auto"${isTask ? ' class="task-list-item"' : ""}>${text}</li>\n`;
    },
    blockquote(token: Tokens.Blockquote) {
      return `<blockquote dir="auto">\n${this.parser.parse(token.tokens)}</blockquote>\n`;
    },
  },
});

markdownParser.use({
  extensions: [
    {
      name: "highlight",
      level: "inline",
      childTokens: ["tokens"],
      start(src: string) {
        return src.indexOf("==");
      },
      tokenizer(src: string) {
        const match = /^==(?!\s)([^=\n]+?)(?<!\s)==/.exec(src);
        if (match) {
          return {
            type: "highlight",
            raw: match[0],
            text: match[1],
            tokens: this.lexer.inlineTokens(match[1]),
          };
        }
      },
      renderer(token: Tokens.Generic) {
        return `<mark>${this.parser.parseInline((token.tokens as Token[]) || [])}</mark>`;
      },
    },
    {
      name: "underline",
      level: "inline",
      childTokens: ["tokens"],
      start(src: string) {
        return src.indexOf("++");
      },
      tokenizer(src: string) {
        const match = /^\+\+(?!\s)([^\+\n]+?)(?<!\s)\+\+/.exec(src);
        if (match) {
          return {
            type: "underline",
            raw: match[0],
            text: match[1],
            tokens: this.lexer.inlineTokens(match[1]),
          };
        }
      },
      renderer(token: Tokens.Generic) {
        return `<u>${this.parser.parseInline((token.tokens as Token[]) || [])}</u>`;
      },
    },
    {
      name: "subscript",
      level: "inline",
      childTokens: ["tokens"],
      start(src: string) {
        return src.indexOf("~");
      },
      tokenizer(src: string) {
        if (src.startsWith("~~")) return;
        const match = /^~(?!\s)([^~\n]+?)(?<!\s)~/.exec(src);
        if (match) {
          return {
            type: "subscript",
            raw: match[0],
            text: match[1],
            tokens: this.lexer.inlineTokens(match[1]),
          };
        }
      },
      renderer(token: Tokens.Generic) {
        return `<sub>${this.parser.parseInline((token.tokens as Token[]) || [])}</sub>`;
      },
    },
    {
      name: "superscript",
      level: "inline",
      childTokens: ["tokens"],
      start(src: string) {
        return src.indexOf("^");
      },
      tokenizer(src: string) {
        const match = /^\^(?!\s)([^\^\n]+?)(?<!\s)\^/.exec(src);
        if (match) {
          return {
            type: "superscript",
            raw: match[0],
            text: match[1],
            tokens: this.lexer.inlineTokens(match[1]),
          };
        }
      },
      renderer(token: Tokens.Generic) {
        return `<sup>${this.parser.parseInline((token.tokens as Token[]) || [])}</sup>`;
      },
    },
  ],
});

function hasCollapsibleContent(tokens: Token[], i: number): boolean {
  const h = tokens[i];
  if (h.type !== "heading") return false;

  for (let j = i + 1; j < tokens.length; j++) {
    const t = tokens[j];
    if (isBlank(t)) continue;
    return !(t.type === "heading" && t.depth <= h.depth);
  }
  return false;
}

function renderMarkdownWithFolds(tokens: Token[]): string {
  let html = "";
  const stack: number[] = [];
  const contentTokens: Token[] = [];

  const flushContent = () => {
    if (contentTokens.length > 0) {
      html += markdownParser.parser(contentTokens);
      contentTokens.length = 0;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "heading") {
      flushContent();
      const depth = token.depth;

      // Close all open <details> sections with depth >= current heading depth
      while (stack.length > 0 && stack[stack.length - 1] >= depth) {
        stack.pop();
        html += "</div></details>\n";
      }

      const tag = `h${depth}`;
      const headingInner = markdownParser.parseInline(token.text);

      if (hasCollapsibleContent(tokens, i)) {
        stack.push(depth);
        html += `<details class="rtd-fold" data-heading-level="${depth}" open>
  <summary class="rtd-summary" dir="auto">
    <${tag} class="rtd-heading">${headingInner}</${tag}>
    <span class="rtd-ellipsis" aria-hidden="true">…</span>
  </summary>
  <div class="rtd-fold-inner">\n`;
      } else {
        html += `<${tag} class="rtd-heading-static" data-heading-level="${depth}" dir="auto">${headingInner}</${tag}>\n`;
      }
    } else {
      contentTokens.push(token);
    }
  }

  flushContent();

  // Close any remaining open <details> tags at the end of the document
  while (stack.length > 0) {
    stack.pop();
    html += "</div></details>\n";
  }

  return html;
}

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "ins",
    "s",
    "del",
    "sub",
    "sup",
    "a",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "hr",
    "img",
    "mark",
    "br",
    "input",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    "div",
    "span",
    "details",
    "summary",
  ],
  ALLOWED_ATTR: [
    "dir",
    "href",
    "src",
    "alt",
    "class",
    "style",
    "target",
    "rel",
    "type",
    "disabled",
    "checked",
    "align",
    "colspan",
    "rowspan",
    "colwidth",
    "open",
    "data-heading-level",
    "data-color",
    "aria-hidden",
  ],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

class LruCache<K, V> {
  private max: number;
  private map = new Map<K, V>();

  constructor(max = 200) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: K, val: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, val);
  }
}

const htmlCache = new LruCache<string, string>(200);

function renderToSafeHtml(
  markdown: string,
  collapsibleHeadings: boolean,
): string {
  // Fast-path: if collapsibleHeadings is disabled or document has no headings (#),
  // bypass token lexing, stack tracking, and chunked parser calls entirely.
  const renderedHtml: string =
    collapsibleHeadings && markdown.includes("#")
      ? renderMarkdownWithFolds(markdownParser.lexer(markdown))
      : (markdownParser.parse(markdown) as string);

  const sanitized = DOMPurify.sanitize(renderedHtml, DOMPURIFY_CONFIG);

  // Wrap tables without a wrapper container into a scrollable container (skip if no tables)
  const withWrappedTables = sanitized.includes("<table")
    ? sanitized.replace(
        /(<table\b[\s\S]*?<\/table>)/gi,
        '<div class="rtd-table-wrap">$1</div>',
      )
    : sanitized;

  // Add target and rel to external links (skip if no links)
  const safeHtml = withWrappedTables.includes("<a")
    ? withWrappedTables.replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
        const attrsStr = String(attrs);
        const hrefMatch = attrsStr.match(/\shref\s*=\s*"([^"]*)"/i);
        const href = hrefMatch?.[1] ?? "";
        const isExternal =
          /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:");

        const stripped = attrsStr
          .replace(/\srel\s*=\s*"[^"]*"/gi, "")
          .replace(/\starget\s*=\s*"[^"]*"/gi, "");

        return isExternal
          ? `<a${stripped} target="_blank" rel="noopener noreferrer">`
          : `<a${stripped}>`;
      })
    : withWrappedTables;

  return safeHtml;
}

/**
 * Read-only display for Markdown produced by SimpleEditor.
 * Uses native <details> / <summary> for Obsidian-style collapsible headings.
 */
export function RichTextDisplay({
  markdown,
  className,
  lang,
  dir,
  collapsibleHeadings = true,
}: RichTextDisplayProps) {
  if (!markdown?.trim()) {
    return null;
  }

  const cacheKey = `${collapsibleHeadings ? 1 : 0}:${markdown}`;
  let safeHtml = htmlCache.get(cacheKey);
  if (!safeHtml) {
    safeHtml = renderToSafeHtml(markdown, collapsibleHeadings);
    htmlCache.set(cacheKey, safeHtml);
  }

  const resolvedDir = dir ?? "auto";

  return (
    <div
      className={cn(styles.root, className)}
      {...(lang ? { lang } : {})}
      {...(resolvedDir ? { dir: resolvedDir } : {})}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

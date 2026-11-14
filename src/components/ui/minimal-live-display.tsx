"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { cn } from "@/lib/utils";

const displayHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, class: "cm-h1" },
  { tag: t.heading2, class: "cm-h2" },
  { tag: t.heading3, class: "cm-h3" },
  { tag: t.heading4, class: "cm-h4" },
  { tag: t.heading5, class: "cm-h5" },
  { tag: t.heading6, class: "cm-h6" },
  { tag: t.strong, class: "cm-strong" },
  { tag: t.emphasis, class: "cm-em" },
  { tag: t.strikethrough, class: "cm-strikethrough" },
  { tag: t.link, class: "cm-link" },
  { tag: t.url, class: "cm-url" },
  // In CM6 Markdown, structural punctuation (hashes, asterisks) is typically tagged with BOTH the block tag and meta tag
  { tag: t.meta, class: "cm-meta" }, // Often used for list markers, keep visible
]);

const displayTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "inherit",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflow: "hidden", // No scrolling for display
  },
  ".cm-content": {
    fontFamily: "inherit",
    padding: "0",
  },
  ".cm-line": {
    padding: "0",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  // ALWAYS hide formatting marks in display mode
  ".cm-h1.cm-meta, .cm-h2.cm-meta, .cm-h3.cm-meta, .cm-h4.cm-meta, .cm-h5.cm-meta, .cm-h6.cm-meta":
    { display: "none" },
  ".cm-strong.cm-meta, .cm-em.cm-meta, .cm-strikethrough.cm-meta, .cm-link.cm-meta":
    { display: "none" },

  // Typography scaling matching your rich-text-display CSS
  ".cm-h1": {
    fontSize: "1.4em",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0.2em 0",
    display: "inline-block",
  },
  ".cm-h2": {
    fontSize: "1.2em",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0.2em 0",
    display: "inline-block",
  },
  ".cm-h3": {
    fontSize: "1.1em",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0.2em 0",
    display: "inline-block",
  },
  ".cm-h4": {
    fontSize: "1em",
    fontWeight: "600",
    color: "var(--muted-foreground)",
  },

  ".cm-strong": { fontWeight: "700" },
  ".cm-em": { fontStyle: "italic", color: "var(--muted-foreground)" },
  ".cm-strikethrough": {
    textDecoration: "line-through",
    color: "var(--muted-foreground)",
  },
  ".cm-link": { color: "var(--primary)", textDecoration: "underline" },
  ".cm-url": { color: "var(--muted-foreground)", fontSize: "0.9em" },
  ".cm-meta": { color: "var(--primary)" },
});

type MinimalLiveDisplayProps = {
  value: string;
  className?: string;
  lineClamp?: number;
};

export function MinimalLiveDisplay({
  value,
  className,
  lineClamp,
}: MinimalLiveDisplayProps) {
  const extensions = useMemo(() => {
    const base = [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(displayHighlightStyle),
      displayTheme,
      EditorView.lineWrapping,
      EditorView.editable.of(false),
    ];

    if (lineClamp) {
      base.push(
        EditorView.theme({
          ".cm-content": {
            display: "-webkit-box !important",
            WebkitLineClamp: `${lineClamp} !important`,
            WebkitBoxOrient: "vertical !important",
            overflow: "hidden !important",
          },
        }),
      );
    }

    return base;
  }, [lineClamp]);

  return (
    <div
      className={cn(
        "relative w-full pointer-events-none select-none",
        className,
      )}
    >
      <CodeMirror
        value={value}
        extensions={extensions}
        readOnly={true}
        editable={false}
        theme="none"
        className="w-full"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          searchKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}

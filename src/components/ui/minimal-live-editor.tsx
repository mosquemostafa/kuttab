"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { cn } from "@/lib/utils";

const livePreviewHighlightStyle = HighlightStyle.define([
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

const livePreviewTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "inherit",
    height: "100%",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "currentColor",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflow: "auto",
  },
  ".cm-content": {
    fontFamily: "inherit",
    padding: "0",
  },
  ".cm-line": {
    padding: "0",
    lineHeight: "1.8",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },

  // Hide formatting marks (hashes, asterisks) when the line is NOT active
  ".cm-line:not(.cm-activeLine) .cm-h1.cm-meta, .cm-line:not(.cm-activeLine) .cm-h2.cm-meta, .cm-line:not(.cm-activeLine) .cm-h3.cm-meta, .cm-line:not(.cm-activeLine) .cm-h4.cm-meta, .cm-line:not(.cm-activeLine) .cm-h5.cm-meta, .cm-line:not(.cm-activeLine) .cm-h6.cm-meta":
    { display: "none" },
  ".cm-line:not(.cm-activeLine) .cm-strong.cm-meta, .cm-line:not(.cm-activeLine) .cm-em.cm-meta, .cm-line:not(.cm-activeLine) .cm-strikethrough.cm-meta, .cm-line:not(.cm-activeLine) .cm-link.cm-meta":
    { display: "none" },

  // Typography scaling matching your rich-text-display CSS
  ".cm-h1": {
    fontSize: "1.65em",
    fontWeight: "800",
    lineHeight: "1.3",
    margin: "0.5em 0 0.2em",
    display: "inline-block",
  },
  ".cm-h2": {
    fontSize: "1.35em",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0.5em 0 0.2em",
    display: "inline-block",
  },
  ".cm-h3": {
    fontSize: "1.1em",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0.5em 0 0.2em",
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
  ".cm-meta": { color: "var(--primary)" }, // List markers colored as accent
});

type MinimalLiveEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
};

export function MinimalLiveEditor({
  value,
  onChange,
  placeholder,
  className,
  editorClassName,
}: MinimalLiveEditorProps) {
  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(livePreviewHighlightStyle),
      livePreviewTheme,
      EditorView.lineWrapping,
    ],
    [],
  );

  return (
    <div
      className={cn("relative w-full flex flex-col cursor-text", className)}
      onClick={(e) => {
        const editor = e.currentTarget.querySelector(
          ".cm-content",
        ) as HTMLElement | null;
        if (editor && document.activeElement !== editor) {
          editor.focus();
        }
      }}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        theme="none"
        className={cn(
          "w-full flex-1 flex flex-col [&_.cm-editor]:h-full [&_.cm-editor]:flex-1",
          editorClassName,
        )}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true, // Required to add .cm-activeLine class
          highlightActiveLineGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          bracketMatching: true,
          closeBrackets: true,
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

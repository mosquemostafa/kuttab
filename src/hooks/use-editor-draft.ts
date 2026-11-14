"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  readDraft,
  removeDraft,
  writeDraft,
  pruneDrafts,
  type Draft,
} from "@/lib/editor-drafts/draft-storage";

export function useEditorDraft({
  editor,
  draftKey,
  ready = true,
  debounceMs = 750,
}: {
  editor: Editor | null;
  draftKey?: string;
  ready?: boolean;
  debounceMs?: number;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const baseline = useRef("");
  const dirty = useRef(false); // Set ONLY by user edits

  useEffect(() => {
    dirty.current = false;
    if (!editor || !draftKey || !ready) return setDraft(null);

    try {
      baseline.current = editor.getMarkdown();
    } catch {
      baseline.current = "";
    }

    const d = readDraft(draftKey);
    if (
      d &&
      (!d.content.trim() || d.content.trim() === baseline.current.trim())
    ) {
      removeDraft(draftKey);
      return setDraft(null);
    }
    setDraft(d);
  }, [editor, draftKey, ready]);

  const persist = useCallback(() => {
    clearTimeout(timer.current);
    // NEVER touch a draft the user hasn't actively edited in this session
    if (!dirty.current || !editor || !draftKey) return;
    dirty.current = false;
    try {
      const md = editor.getMarkdown();
      if (!md.trim() || md.trim() === baseline.current.trim()) {
        removeDraft(draftKey);
      } else {
        writeDraft(draftKey, md);
      }
    } catch {}
  }, [editor, draftKey]);

  useEffect(() => {
    if (!editor || !draftKey || !ready) return;

    const onUpdate = () => {
      dirty.current = true;
      setDraft(null); // User chose to continue editing, dismiss banner
      clearTimeout(timer.current);
      timer.current = setTimeout(persist, debounceMs);
    };

    const onHide = () => document.visibilityState === "hidden" && persist();

    editor.on("update", onUpdate);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);

    return () => {
      editor.off("update", onUpdate);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [editor, draftKey, ready, debounceMs, persist]);

  useEffect(() => {
    pruneDrafts();
  }, []);

  const restore = useCallback(() => {
    if (!editor || !draft) return;
    // emitUpdate: true ensures parent onChange (React Hook Form, state) gets notified
    editor.commands.setContent(draft.content, {
      contentType: "markdown",
      emitUpdate: true,
    });
    setDraft(null);
  }, [editor, draft]);

  const discard = useCallback(() => {
    if (draftKey) removeDraft(draftKey);
    setDraft(null);
  }, [draftKey]);

  // Call after a successful submit, before unmounting
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    dirty.current = false; // Prevents the unmount cleanup from resurrecting the draft
    if (draftKey) removeDraft(draftKey);
    setDraft(null);
  }, [draftKey]);

  return { draft, restore, discard, clear };
}

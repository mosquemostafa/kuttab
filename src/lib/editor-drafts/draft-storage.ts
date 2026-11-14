"use client";

const PREFIX = "saas:draft:";
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface Draft {
  content: string;
  savedAt: number;
}

const normalizeDraftKey = (key: string) =>
  key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;

export function readDraft(key: string): Draft | null {
  try {
    const k = normalizeDraftKey(key);
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (
      typeof d?.content !== "string" ||
      typeof d?.savedAt !== "number" ||
      Date.now() - d.savedAt > TTL_MS
    ) {
      localStorage.removeItem(k);
      return null;
    }
    return { content: d.content, savedAt: d.savedAt };
  } catch {
    return null;
  }
}

export function removeDraft(key: string) {
  try {
    localStorage.removeItem(normalizeDraftKey(key));
  } catch {}
}

export function writeDraft(key: string, content: string): boolean {
  const k = normalizeDraftKey(key);
  const payload = JSON.stringify({ content, savedAt: Date.now() });
  try {
    localStorage.setItem(k, payload);
    return true;
  } catch {
    pruneOldestDrafts(); // Quota exceeded: prune the oldest half of stored drafts, retry once
    try {
      localStorage.setItem(k, payload);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Removes the oldest 50% of drafts to free up storage without wiping everything.
 */
function pruneOldestDrafts() {
  try {
    const drafts: { key: string; savedAt: number }[] = [];
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    for (const k of keys) {
      const d = readDraft(k);
      if (d) drafts.push({ key: k, savedAt: d.savedAt });
    }
    drafts.sort((a, b) => a.savedAt - b.savedAt);
    const removeCount = Math.max(1, Math.ceil(drafts.length / 2));
    for (let i = 0; i < removeCount; i++) {
      removeDraft(drafts[i].key);
    }
  } catch {}
}

export function pruneDrafts(ttl = TTL_MS) {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    for (const k of keys) {
      const d = readDraft(k);
      if (d && Date.now() - d.savedAt > ttl) removeDraft(k);
    }
  } catch {}
}

export { removeDraft as clearDraft };

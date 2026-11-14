"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

import { useEditorDraft } from "@/hooks/use-editor-draft";
import { clearDraft } from "@/lib/editor-drafts/draft-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Button as UiButton } from "@/components/ui/button";

export { clearDraft };

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";

import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Selection } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";

const CustomTaskList = TaskList.extend({
  parseHTML() {
    return [
      { tag: 'ul[data-type="taskList"]', priority: 60 },
      { tag: "ul.contains-task-list", priority: 60 },
    ];
  },
});

const CustomTaskItem = TaskItem.extend({
  parseHTML() {
    return [
      {
        tag: 'li[data-type="taskItem"]',
        priority: 60,
        contentElement: (element) => element.querySelector("div") ?? element,
      },
      {
        tag: "li.task-list-item",
        priority: 60,
        getAttrs: (element) => ({
          checked: Boolean(
            (element as HTMLElement).querySelector("input")?.checked,
          ),
        }),
      },
    ];
  },
});

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/table-node/table-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";
import { ColorHighlightButton } from "@/components/tiptap-ui/color-highlight-button";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import {
  SearchAndReplace,
  SearchAndReplaceButton,
} from "@/components/tiptap-ui/search-and-replace";

// --- Icons ---
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { cn } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

import content from "@/components/tiptap-templates/simple/data/content.json";
import { ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { uploadEditorImageFromFile } from "@/lib/assets/r2-editor-image-upload";
import {
  USER_MEDIA_ALLOWED_IMAGE_TYPES,
  USER_MEDIA_MAX_IMAGE_BYTES,
} from "@/shared/constants/user-media.constants";

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  block: "center",
};

const MainToolbarContent = ({
  onLinkClick,
  onSearchAndReplaceClick,
  isSearchAndReplaceOpen,
  searchAndReplaceButtonRef,
  isMobile,
  isStandalone = false,
  showThemeToggle = false,
}: {
  onLinkClick: () => void;
  onSearchAndReplaceClick: () => void;
  isSearchAndReplaceOpen: boolean;
  searchAndReplaceButtonRef: React.RefObject<HTMLButtonElement | null>;
  isMobile: boolean;
  isStandalone?: boolean;
  showThemeToggle?: boolean;
}) => {
  return (
    <>
      {isStandalone && <Spacer />}

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
        <TableDropdownMenu modal={false} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        <ColorHighlightButton
          highlightColor="var(--tt-color-highlight-yellow)"
          tooltip="Highlight"
          aria-label="Highlight"
        />
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton />
      </ToolbarGroup>

      {isStandalone && <Spacer />}

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <SearchAndReplaceButton
          ref={searchAndReplaceButtonRef}
          aria-expanded={isSearchAndReplaceOpen}
          data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
          onClick={onSearchAndReplaceClick}
        />
        {showThemeToggle && <ThemeToggle />}
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({ onBack }: { onBack: () => void }) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack} aria-label="Back">
        <ArrowLeftIcon className="tiptap-button-icon rtl:rotate-180" />
        <LinkIcon className="tiptap-button-icon" />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    <LinkContent />
  </>
);

interface SimpleEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  lang?: string;
  className?: string;
  maxCharacters?: number;
  standalone?: boolean;
  borderless?: boolean;
  showThemeToggle?: boolean;
  /**
   * Unique key to auto-save and restore drafts in localStorage.
   * Format example: `draftKeyFor(userId, scope)` or "journal:create"
   */
  draftKey?: string;
  /**
   * Set to false until async server data has loaded (default: true).
   */
  ready?: boolean;
}

export function SimpleEditor({
  value,
  onChange,
  lang: langProp,
  className,
  standalone,
  borderless,
  showThemeToggle = false,
  draftKey,
  ready = true,
}: SimpleEditorProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const lang = langProp ?? locale;
  const isStandalone = standalone ?? (value === undefined && !className);
  const isMobile = useIsBreakpoint();
  const getErrorMessage = useApiErrorMessage();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "link">("main");
  const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const searchAndReplaceButtonRef = useRef<HTMLButtonElement>(null);

  const isUpdatingFromEditor = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Determine initial content
  const initialContent = useMemo(() => {
    if (value !== undefined) {
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
      return { type: "doc", content: [{ type: "paragraph" }] };
    }
    return content;
  }, []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      textDirection: "auto",
      contentType: typeof initialContent === "string" ? "markdown" : undefined,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Main content area, start typing to enter text.",
          class: "simple-editor",
          lang,
        },
      },
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
        CustomTaskList,
        CustomTaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        TableKit.configure({
          table: {
            resizable: false,
            renderWrapper: true,
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: false,
        }),
        Typography,
        Superscript,
        Subscript,

        Selection,
        Markdown,
        FindAndReplace.configure({
          searchDebounceMs: 500,
          injectCSS: false,
        }),
        ImageUploadNode.configure({
          accept: USER_MEDIA_ALLOWED_IMAGE_TYPES.join(","),
          maxSize: USER_MEDIA_MAX_IMAGE_BYTES,
          limit: 1,
          upload: async (file, onProgress, abortSignal) => {
            const res = await uploadEditorImageFromFile(
              file,
              (ratio) => onProgress?.({ progress: Math.round(ratio * 100) }),
              { signal: abortSignal },
            );
            return res.url;
          },
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        }),
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        isUpdatingFromEditor.current = true;
        const md = editor.getMarkdown();
        onChangeRef.current?.(md);
        queueMicrotask(() => {
          isUpdatingFromEditor.current = false;
        });
      },
    },
    [],
  );

  const { draft, restore, discard } = useEditorDraft({
    editor,
    draftKey,
    ready,
  });

  // Synchronize incoming `value` changes from parent (e.g. form reset, async fetch)
  useEffect(() => {
    if (!editor || value === undefined) return;
    if (isUpdatingFromEditor.current) return;

    const currentMd = editor.getMarkdown();
    if (value !== currentMd) {
      if (!value) {
        editor.commands.setContent(
          {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
          { emitUpdate: false },
        );
      } else {
        editor.commands.setContent(value, {
          contentType: "markdown",
          emitUpdate: false,
        });
      }
    }
  }, [editor, value]);

  // Synchronize dynamic `lang` attribute
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("lang", lang);
  }, [editor, lang]);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  const openSearchAndReplace = useCallback(() => {
    setMobileView("main");
    setIsSearchAndReplaceOpen(true);
  }, []);

  const closeSearchAndReplace = useCallback(() => {
    setIsSearchAndReplaceOpen(false);
    searchAndReplaceButtonRef.current?.focus();
  }, []);

  const toggleSearchAndReplace = useCallback(() => {
    if (isSearchAndReplaceOpen) {
      closeSearchAndReplace();
      return;
    }

    openSearchAndReplace();
  }, [closeSearchAndReplace, isSearchAndReplaceOpen, openSearchAndReplace]);

  return (
    <div
      className={cn(
        "simple-editor-wrapper",
        isStandalone && "is-standalone",
        borderless && "is-borderless",
        className,
      )}
      lang={lang}
    >
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile && isStandalone
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onLinkClick={() => setMobileView("link")}
              onSearchAndReplaceClick={toggleSearchAndReplace}
              isSearchAndReplaceOpen={isSearchAndReplaceOpen}
              searchAndReplaceButtonRef={searchAndReplaceButtonRef}
              isMobile={isMobile}
              isStandalone={isStandalone}
              showThemeToggle={showThemeToggle}
            />
          ) : (
            <MobileToolbarContent onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        {draft && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-b border-amber-500/20 animate-in fade-in duration-200"
          >
            <span className="truncate">{t("editorDraft.found")}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="font-medium underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                {t("editorDraft.preview")}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={restore}
                className="font-medium underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                {t("editorDraft.restore")}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={discard}
                className="text-muted-foreground hover:opacity-80 cursor-pointer"
              >
                {t("editorDraft.discard")}
              </button>
            </div>
          </div>
        )}

        {draft && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle className="text-start">
                  {t("editorDraft.previewTitle")}
                </DialogTitle>
                <DialogDescription className="text-start">
                  {t("editorDraft.previewDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-4">
                <RichTextDisplay
                  markdown={draft.content}
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <UiButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    discard();
                    setIsPreviewOpen(false);
                  }}
                  className="rounded-xl"
                >
                  {t("editorDraft.discard")}
                </UiButton>
                <UiButton
                  type="button"
                  onClick={() => {
                    restore();
                    setIsPreviewOpen(false);
                  }}
                  className="rounded-xl"
                >
                  {t("editorDraft.restore")}
                </UiButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <SearchAndReplace
          className="simple-editor-search-and-replace"
          open={isSearchAndReplaceOpen}
          onOpen={openSearchAndReplace}
          onClose={closeSearchAndReplace}
          scrollIntoViewOptions={SEARCH_AND_REPLACE_SCROLL_OPTIONS}
        />

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}

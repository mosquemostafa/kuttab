"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/api-client";
import {
  isApiClientError,
  validationDetailsToFieldErrors,
} from "@/lib/api/api-error";
import { isRichTextEmpty } from "@/lib/rich-text-empty";
import {
  SimpleEditor,
  clearDraft,
} from "@/components/tiptap-templates/simple/simple-editor";
import type { BlogDTO, BlogStatus } from "@/shared/types/blog.types";
import { Badge } from "@/components/ui/badge";
import { TagLabel } from "@/components/ui/hash-tag-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";

type BlogFormState = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  slug: string;
  contentAr: string;
  contentEn: string;
  coverImageUrl: string;
  excerptAr: string;
  excerptEn: string;
  readingMinutes: string;
  tags: string;
  status: BlogStatus;
  publishDate: string;
  isFeatured: boolean;
};

type BlogFieldKey = keyof BlogFormState;
type BlogFieldErrors = Partial<Record<BlogFieldKey, string>>;

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;

const EMPTY_FORM: BlogFormState = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  slug: "",
  contentAr: "",
  contentEn: "",
  coverImageUrl: "",
  excerptAr: "",
  excerptEn: "",
  readingMinutes: "",
  tags: "",
  status: "draft",
  publishDate: "",
  isFeatured: false,
};

type BlogFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      blogSlug: string;
    };

function normalizeTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

function mapBlogToForm(blog: BlogDTO): BlogFormState {
  return {
    titleAr: blog.titleAr,
    titleEn: blog.titleEn,
    descriptionAr: blog.descriptionAr,
    descriptionEn: blog.descriptionEn,
    slug: blog.slug,
    contentAr: blog.contentAr,
    contentEn: blog.contentEn,
    coverImageUrl: blog.coverImageUrl,
    excerptAr: blog.excerptAr,
    excerptEn: blog.excerptEn,
    readingMinutes: String(blog.readingMinutes),
    tags: blog.tags.join(", "),
    status: blog.status,
    publishDate: toDateTimeLocalValue(blog.publishDate),
    isFeatured: blog.isFeatured,
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function requiredFieldMessage(label: string): string {
  return `${label} is required`;
}

export function BlogForm(props: BlogFormProps) {
  const t = useTranslations("blogs");
  const router = useRouter();

  const isEditMode = props.mode === "edit";
  const blogSlug = isEditMode ? props.blogSlug : null;

  const [form, setForm] = useState<BlogFormState>(EMPTY_FORM);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const [tagErrorMessage, setTagErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});

  useSetBreadcrumb(blogSlug, form.titleAr || form.titleEn);

  const tags = useMemo(() => normalizeTags(form.tags), [form.tags]);
  const canAddMoreTags = tags.length < MAX_TAGS;

  const setField = <K extends keyof BlogFormState>(
    key: K,
    value: BlogFormState[K],
  ) => {
    setFieldErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }

      return { ...prev, [key]: undefined };
    });
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = (rawTag: string) => {
    const nextTag = rawTag.trim().toLowerCase();

    if (!nextTag) {
      setTagErrorMessage(t("editor.tagsErrors.empty"));
      return;
    }

    if (nextTag.length > MAX_TAG_LENGTH) {
      setTagErrorMessage(
        t("editor.tagsErrors.maxLength", { max: MAX_TAG_LENGTH }),
      );
      return;
    }

    if (!canAddMoreTags) {
      setTagErrorMessage(t("editor.tagsErrors.maxCount", { max: MAX_TAGS }));
      return;
    }

    if (tags.includes(nextTag)) {
      setTagErrorMessage(t("editor.tagsErrors.duplicate"));
      return;
    }

    setField("tags", [...tags, nextTag].join(", "));
    setTagInputValue("");
    setTagErrorMessage(null);
  };

  const removeTag = (tagToRemove: string) => {
    setField("tags", tags.filter((tag) => tag !== tagToRemove).join(", "));
    setTagErrorMessage(null);
  };

  const onTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addTag(tagInputValue);
  };

  const onTagInputChange = (value: string) => {
    if (isSaving) {
      return;
    }

    if (value.includes(",")) {
      const [firstTag] = value.split(",");
      addTag(firstTag ?? "");
      return;
    }

    setTagInputValue(value);
    setTagErrorMessage(null);
  };

  useEffect(() => {
    if (!isEditMode || !blogSlug) {
      return;
    }

    let active = true;

    const loadBlog = async () => {
      try {
        const blog = await apiClient.adminBlogs.getBySlug(blogSlug);

        if (!active) {
          return;
        }

        setBlogId(blog.id);
        setForm(mapBlogToForm(blog));
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error(t("table.loadFailed"));
        }

        router.push("/content/blogs");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadBlog();

    return () => {
      active = false;
    };
  }, [blogSlug, isEditMode, router, t]);

  const onSubmit = async () => {
    if (isEditMode && !blogId) {
      return;
    }

    setFieldErrors({});

    const readingMinutes = Number(form.readingMinutes);
    const isReadingMinutesValid =
      Number.isInteger(readingMinutes) && readingMinutes >= 1;
    const nextErrors: BlogFieldErrors = {};

    if (!form.titleAr.trim())
      nextErrors.titleAr = requiredFieldMessage(t("editor.titleAr"));
    if (!form.titleEn.trim())
      nextErrors.titleEn = requiredFieldMessage(t("editor.titleEn"));
    if (!form.descriptionAr.trim())
      nextErrors.descriptionAr = requiredFieldMessage(
        t("editor.descriptionAr"),
      );
    if (!form.descriptionEn.trim())
      nextErrors.descriptionEn = requiredFieldMessage(
        t("editor.descriptionEn"),
      );
    if (!form.slug.trim())
      nextErrors.slug = requiredFieldMessage(t("editor.slug"));
    if (!form.coverImageUrl.trim()) {
      nextErrors.coverImageUrl = requiredFieldMessage(
        t("editor.coverImageUrl"),
      );
    } else if (!isValidHttpUrl(form.coverImageUrl.trim())) {
      nextErrors.coverImageUrl = "Invalid URL";
    }
    if (!form.excerptAr.trim())
      nextErrors.excerptAr = requiredFieldMessage(t("editor.excerptAr"));
    if (!form.excerptEn.trim())
      nextErrors.excerptEn = requiredFieldMessage(t("editor.excerptEn"));
    if (!isReadingMinutesValid)
      nextErrors.readingMinutes = "Reading minutes must be a positive integer";
    if (isRichTextEmpty(form.contentAr))
      nextErrors.contentAr = requiredFieldMessage(t("editor.contentAr"));
    if (isRichTextEmpty(form.contentEn))
      nextErrors.contentEn = requiredFieldMessage(t("editor.contentEn"));

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(t("toasts.required"));
      return;
    }

    const payload = {
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      descriptionEn: form.descriptionEn.trim(),
      slug: form.slug.trim(),
      contentAr: form.contentAr.trim(),
      contentEn: form.contentEn.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      excerptAr: form.excerptAr.trim(),
      excerptEn: form.excerptEn.trim(),
      readingMinutes,
      tags: normalizeTags(form.tags),
      status: form.status,
      publishDate: form.publishDate
        ? new Date(form.publishDate).toISOString()
        : null,
      isFeatured: form.isFeatured,
    };

    try {
      setIsSaving(true);

      const draftKeyAr =
        isEditMode && blogId
          ? `blog:edit:${blogId}:contentAr`
          : "blog:create:contentAr";
      const draftKeyEn =
        isEditMode && blogId
          ? `blog:edit:${blogId}:contentEn`
          : "blog:create:contentEn";

      if (isEditMode && blogId) {
        await apiClient.adminBlogs.update(blogId, payload);
      } else {
        await apiClient.adminBlogs.create(payload);
      }

      clearDraft(draftKeyAr);
      clearDraft(draftKeyEn);

      if (isEditMode && blogId) {
        toast.success(t("toasts.updateSuccess"));
      } else {
        toast.success(t("toasts.createSuccess"));
      }

      router.push("/content/blogs");
    } catch (saveError) {
      if (isApiClientError(saveError)) {
        const backendFieldErrors = validationDetailsToFieldErrors(
          saveError.details,
        ) as BlogFieldErrors;
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        }
        toast.error(saveError.message);
      } else if (saveError instanceof Error) {
        toast.error(saveError.message);
      } else {
        toast.error(t("toasts.saveFailed"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const title = isEditMode ? t("editor.editTitle") : t("editor.createTitle");
  const description = isEditMode
    ? t("editor.editDescription")
    : t("editor.createDescription");

  if (isEditMode && isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blog-title-ar">{t("editor.titleAr")}</Label>
            <Input
              id="blog-title-ar"
              value={form.titleAr}
              onChange={(event) => setField("titleAr", event.target.value)}
            />
            {fieldErrors.titleAr ? (
              <p className="text-xs text-destructive">{fieldErrors.titleAr}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-title-en">{t("editor.titleEn")}</Label>
            <Input
              id="blog-title-en"
              dir="ltr"
              value={form.titleEn}
              onChange={(event) => setField("titleEn", event.target.value)}
            />
            {fieldErrors.titleEn ? (
              <p className="text-xs text-destructive">{fieldErrors.titleEn}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-description-ar">
              {t("editor.descriptionAr")}
            </Label>
            <Textarea
              id="blog-description-ar"
              value={form.descriptionAr}
              onChange={(event) =>
                setField("descriptionAr", event.target.value)
              }
            />
            {fieldErrors.descriptionAr ? (
              <p className="text-xs text-destructive">
                {fieldErrors.descriptionAr}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-description-en">
              {t("editor.descriptionEn")}
            </Label>
            <Textarea
              id="blog-description-en"
              dir="ltr"
              value={form.descriptionEn}
              onChange={(event) =>
                setField("descriptionEn", event.target.value)
              }
            />
            {fieldErrors.descriptionEn ? (
              <p className="text-xs text-destructive">
                {fieldErrors.descriptionEn}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-slug">{t("editor.slug")}</Label>
            <Input
              id="blog-slug"
              value={form.slug}
              onChange={(event) => setField("slug", event.target.value)}
            />
            {fieldErrors.slug ? (
              <p className="text-xs text-destructive">{fieldErrors.slug}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-cover-image-url">
              {t("editor.coverImageUrl")}
            </Label>
            <Input
              id="blog-cover-image-url"
              value={form.coverImageUrl}
              onChange={(event) =>
                setField("coverImageUrl", event.target.value)
              }
            />
            {fieldErrors.coverImageUrl ? (
              <p className="text-xs text-destructive">
                {fieldErrors.coverImageUrl}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="blog-tags">{t("editor.tags")}</Label>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {t("editor.tagsHint")}
                </p>
                <span className="text-xs text-muted-foreground">
                  {t("editor.tagsCount", {
                    count: tags.length,
                    max: MAX_TAGS,
                  })}
                </span>
              </div>

              <Input
                id="blog-tags"
                value={tagInputValue}
                onChange={(event) => onTagInputChange(event.target.value)}
                onKeyDown={onTagInputKeyDown}
                placeholder={t("editor.tagsInputPlaceholder")}
                disabled={isSaving || !canAddMoreTags}
                maxLength={MAX_TAG_LENGTH + 1}
              />

              {tagErrorMessage ? (
                <p className="text-xs text-destructive">{tagErrorMessage}</p>
              ) : null}

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <TagLabel tag={tag} />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-4"
                        onClick={() => removeTag(tag)}
                        disabled={isSaving}
                        aria-label={t("editor.removeTagAria", { tag })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("editor.noTags")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-excerpt-ar">{t("editor.excerptAr")}</Label>
            <Textarea
              id="blog-excerpt-ar"
              value={form.excerptAr}
              onChange={(event) => setField("excerptAr", event.target.value)}
            />
            {fieldErrors.excerptAr ? (
              <p className="text-xs text-destructive">
                {fieldErrors.excerptAr}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-excerpt-en">{t("editor.excerptEn")}</Label>
            <Textarea
              id="blog-excerpt-en"
              dir="ltr"
              value={form.excerptEn}
              onChange={(event) => setField("excerptEn", event.target.value)}
            />
            {fieldErrors.excerptEn ? (
              <p className="text-xs text-destructive">
                {fieldErrors.excerptEn}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-reading-minutes">
              {t("editor.readingMinutes")}
            </Label>
            <Input
              id="blog-reading-minutes"
              type="number"
              min={1}
              step={1}
              value={form.readingMinutes}
              onChange={(event) =>
                setField("readingMinutes", event.target.value)
              }
            />
            {fieldErrors.readingMinutes ? (
              <p className="text-xs text-destructive">
                {fieldErrors.readingMinutes}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="blog-content-ar">{t("editor.contentAr")}</Label>
            <SimpleEditor
              value={form.contentAr}
              onChange={(value) => setField("contentAr", value)}
              lang="ar"
              draftKey={
                isEditMode && blogId
                  ? `blog:edit:${blogId}:contentAr`
                  : "blog:create:contentAr"
              }
            />
            {fieldErrors.contentAr ? (
              <p className="text-xs text-destructive">
                {fieldErrors.contentAr}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="blog-content-en">{t("editor.contentEn")}</Label>
            <SimpleEditor
              value={form.contentEn}
              onChange={(value) => setField("contentEn", value)}
              lang="en"
              draftKey={
                isEditMode && blogId
                  ? `blog:edit:${blogId}:contentEn`
                  : "blog:create:contentEn"
              }
            />
            {fieldErrors.contentEn ? (
              <p className="text-xs text-destructive">
                {fieldErrors.contentEn}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-status">{t("editor.status")}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setField("status", value as BlogStatus)}
            >
              <SelectTrigger id="blog-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="published">
                  {t("status.published")}
                </SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-publish-date">{t("editor.publishDate")}</Label>
            <Input
              id="blog-publish-date"
              type="datetime-local"
              value={form.publishDate}
              onChange={(event) => setField("publishDate", event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium">{t("editor.isFeatured")}</p>
              <p className="text-xs text-muted-foreground">
                {t("editor.isFeaturedHint")}
              </p>
            </div>
            <Switch
              checked={form.isFeatured}
              onCheckedChange={(checked) => setField("isFeatured", checked)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/content/blogs")}
          >
            {t("editor.cancelEdit")}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSaving}>
            {isSaving
              ? t("editor.submitting")
              : isEditMode
                ? t("editor.submitUpdate")
                : t("editor.submitCreate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

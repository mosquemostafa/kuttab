export const BLOG_STATUSES = ["draft", "published", "archived"] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export type BlogDTO = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  slug: string;
  contentAr: string;
  contentEn: string;
  coverImageUrl: string;
  isFeatured: boolean;
  excerptAr: string;
  excerptEn: string;
  readingMinutes: number;
  authorId: string;
  tags: string[];
  status: BlogStatus;
  publishDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Returned by paginated list endpoints; body HTML is omitted to keep payloads small. */
export type BlogListItemDTO = Omit<BlogDTO, "contentAr" | "contentEn">;

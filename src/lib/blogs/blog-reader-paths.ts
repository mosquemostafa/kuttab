export const BLOG_READER_PATHS = {
  public: "/blogs",
  dashboard: "/dashboard/blogs",
} as const;

export type BlogReaderBasePath =
  (typeof BLOG_READER_PATHS)[keyof typeof BLOG_READER_PATHS];

export function blogPostPath(
  basePath: BlogReaderBasePath,
  slug: string,
): string {
  return `${basePath}/${slug}`;
}

/** Query string for blog list index pages (tag filter + pagination). */
export function blogListIndexHref(
  basePath: BlogReaderBasePath,
  options: { tag?: string; page?: number } = {},
): string {
  const params = new URLSearchParams();
  if (options.tag) {
    params.set("tag", options.tag);
  }
  if (options.page != null && options.page > 1) {
    params.set("page", String(options.page));
  }
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

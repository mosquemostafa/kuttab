import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listDashboardNewslettersQuerySchema } from "@/server/modules/newsletter/newsletter.dto";
import { newsletterService } from "@/server/modules/newsletter/newsletter.service";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";
import type {
  NewsletterChannelArticleDTO,
  NewsletterChannelListItemDTO,
} from "@/shared/types/newsletter.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export const dashboardNewslettersController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    listDashboardNewslettersQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);
    const result =
      await newsletterService.listWebsitePublicCampaignsForDashboard({
        page: pagination.page,
        limit: pagination.limit,
        offset: pagination.offset,
      });
    const totalPages = Math.max(1, Math.ceil(result.total / pagination.limit));
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages,
    };
    const items: NewsletterChannelListItemDTO[] = result.items
      .filter((row) => row.slug != null && row.slug !== "")
      .map((row) => ({
        id: row.id,
        slug: row.slug as string,
        subjectAr: row.subjectAr,
        subjectEn: row.subjectEn,
        excerptAr: row.excerptAr,
        excerptEn: row.excerptEn,
        coverImageUrl: row.coverImageUrl,
        startedAt: toIso(row.startedAt),
        completedAt: toIso(row.completedAt),
        createdAt: toIso(row.createdAt) ?? "",
      }));
    return ok(items, meta);
  },

  async getBySlug(_req: NextRequest, slug: string): Promise<NextResponse> {
    const row = await newsletterService.getWebsitePublicArticleBySlug(slug);
    const data: NewsletterChannelArticleDTO = {
      slug: row.slug as string,
      subjectAr: row.subjectAr,
      subjectEn: row.subjectEn,
      excerptAr: row.excerptAr,
      excerptEn: row.excerptEn,
      bodyAr: row.bodyAr,
      bodyEn: row.bodyEn,
      coverImageUrl: row.coverImageUrl,
      startedAt: toIso(row.startedAt),
      completedAt: toIso(row.completedAt),
    };
    return ok(data);
  },
};

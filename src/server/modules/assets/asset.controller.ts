import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  assetIdParamSchema,
  assetsListQuerySchema,
  moveAssetRequestSchema,
  replaceCompleteRequestSchema,
  replaceSignatureRequestSchema,
  updateAssetFilenameRequestSchema,
  updateAssetTagsRequestSchema,
  uploadCompleteRequestSchema,
  uploadSignatureRequestSchema,
} from "@/server/modules/assets/asset.dto";
import { assetService } from "@/server/modules/assets/asset.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

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

export const assetController = {
  async generateUploadSignature(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(uploadSignatureRequestSchema, body);
    const userId = getUserId(req);

    const result = await assetService.generateUploadSignature(input, userId);

    return ok(result);
  },

  async finalizeUpload(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(uploadCompleteRequestSchema, body);
    const userId = getUserId(req);

    const result = await assetService.finalizeUpload(input, userId);

    return ok(result, undefined, 201);
  },

  async generateReplaceSignature(
    req: NextRequest,
    id: string,
  ): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();
    const input = validateBody(replaceSignatureRequestSchema, body);
    const userId = getUserId(req);

    const result = await assetService.generateReplaceSignature(
      parsed.id,
      input,
      userId,
    );

    return ok(result);
  },

  async finalizeReplace(req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();
    const input = validateBody(replaceCompleteRequestSchema, body);
    const userId = getUserId(req);

    const result = await assetService.finalizeReplace(parsed.id, input, userId);

    return ok(result);
  },

  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const queryTags = searchParams
      .getAll("tags[]")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const query = assetsListQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      folder: searchParams.get("folder") ?? undefined,
      resourceType: searchParams.get("resourceType") ?? undefined,
      format: searchParams.get("format") ?? undefined,
      tags: queryTags.length > 0 ? queryTags : undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await assetService.listAssets(query);

    return ok(result.rows, {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    });
  },

  async listTags(): Promise<NextResponse> {
    const result = await assetService.listAllTags();
    return ok(result);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const result = await assetService.getAsset(parsed.id);

    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const result = await assetService.deleteAsset(parsed.id);

    return ok(result);
  },

  async updateFilename(req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();
    const input = validateBody(updateAssetFilenameRequestSchema, body);
    const result = await assetService.updateAssetFilename(parsed.id, input);

    return ok(result);
  },

  async updateTags(req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();
    const input = validateBody(updateAssetTagsRequestSchema, body);
    const userId = getUserId(req);
    const result = await assetService.updateAssetTags(parsed.id, input, userId);

    return ok(result);
  },

  async moveToFolder(req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();
    const input = validateBody(moveAssetRequestSchema, body);
    const userId = getUserId(req);
    const result = await assetService.moveAssetToFolder(
      parsed.id,
      input,
      userId,
    );

    return ok(result);
  },

  async patch(req: NextRequest, id: string): Promise<NextResponse> {
    const parsed = assetIdParamSchema.parse({ id });
    const body = await req.json();

    if (body && typeof body === "object" && "tags" in body) {
      const input = validateBody(updateAssetTagsRequestSchema, body);
      const userId = getUserId(req);
      const result = await assetService.updateAssetTags(
        parsed.id,
        input,
        userId,
      );
      return ok(result);
    }

    const input = validateBody(updateAssetFilenameRequestSchema, body);
    const result = await assetService.updateAssetFilename(parsed.id, input);

    return ok(result);
  },
};

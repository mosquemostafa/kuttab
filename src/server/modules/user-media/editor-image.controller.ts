import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  editorImageCompleteRequestSchema,
  editorImagePresignRequestSchema,
} from "@/server/modules/user-media/editor-image.dto";
import { editorImageR2Service } from "@/server/modules/user-media/editor-image.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
import type { ApiSuccess } from "@/shared/types/api-response.types";

function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const editorImageController = {
  async presign(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(editorImagePresignRequestSchema, body);
    const userId = getUserId(req);
    const data = await editorImageR2Service.presignUpload(userId, input);
    return ok(data);
  },

  async complete(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(editorImageCompleteRequestSchema, body);
    const userId = getUserId(req);
    const data = await editorImageR2Service.completeUpload(userId, input);
    return ok(data);
  },
};

/**
 * @swagger
 * /api/user-media/{id}:
 *   get:
 *     summary: Redirect to user media public URL by ID
 *     description: Only the owner of the media file can resolve their media by ID.
 *     tags:
 *       - User Media
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Media file ID
 *     responses:
 *       307:
 *         description: Temporary redirect to asset public URL
 *       400:
 *         description: Missing media ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Media file not found or not accessible
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  compose,
  resolveRouteParams,
  type RouteContext,
} from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { userMediaRepository } from "@/server/modules/user-media/user-media.repository";
import { getUserId } from "@/server/utils/request-user";

const wrap = compose(withErrorHandler, withAuth);

const getHandler = wrap(async (req: NextRequest, ctx?: RouteContext) => {
  const params = await resolveRouteParams(ctx);
  const id = params.id?.trim();

  if (!id) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
  }

  const userId = getUserId(req);
  // Ensure strict ownership: user can ONLY resolve their own media files
  const media = await userMediaRepository.findByIdAndUploadedBy(id, userId);
  if (!media || !media.publicUrl) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const response = NextResponse.redirect(media.publicUrl, 307);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );
  return response;
});

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => getHandler(req, ctx);

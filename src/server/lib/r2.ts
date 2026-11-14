import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";

import { env, r2AvatarStorageEnabled } from "@/server/lib/env";
import {
  AVATAR_OBJECT_KEY_PREFIX,
  type AvatarAllowedContentType,
} from "@/shared/constants/avatar-r2.constants";

let cachedClient: S3Client | null = null;

type R2Config = {
  R2_ACCOUNT_ID: string;
  /** When set, used as S3 API `endpoint` instead of the default account-based host. */
  R2_S3_ENDPOINT: string | undefined;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_BASE_URL: string;
};

function requireR2Config(): R2Config {
  if (!r2AvatarStorageEnabled) {
    throw new Error("R2 is not configured");
  }

  const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
  const R2_S3_ENDPOINT = env.R2_S3_ENDPOINT;
  const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
  const R2_PUBLIC_BASE_URL = env.R2_PUBLIC_BASE_URL;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_PUBLIC_BASE_URL
  ) {
    throw new Error("R2 is not configured");
  }

  return {
    R2_ACCOUNT_ID,
    R2_S3_ENDPOINT,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL,
  };
}

function getR2S3Client(): S3Client {
  const cfg = requireR2Config();

  if (!cachedClient) {
    const endpoint =
      cfg.R2_S3_ENDPOINT?.replace(/\/+$/, "") ??
      `https://${cfg.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    cachedClient = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: cfg.R2_ACCESS_KEY_ID,
        secretAccessKey: cfg.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  return cachedClient;
}

const MIME_TO_EXT: Record<AvatarAllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function buildAvatarObjectKey(
  userId: string,
  contentType: AvatarAllowedContentType,
): string {
  const ext = MIME_TO_EXT[contentType];
  return `${AVATAR_OBJECT_KEY_PREFIX}/${userId}/${createId()}.${ext}`;
}

export function publicUrlForR2ObjectKey(key: string): string {
  const { R2_PUBLIC_BASE_URL } = requireR2Config();
  const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  const path = key.replace(/^\/+/, "");
  return `${base}/${path}`;
}

export function tryParseR2ObjectKeyFromPublicUrl(
  url: string | null | undefined,
): string | null {
  if (!url || !r2AvatarStorageEnabled || !env.R2_PUBLIC_BASE_URL) {
    return null;
  }

  const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  const normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith(base)) {
    return null;
  }

  const rest = normalizedUrl.slice(base.length).replace(/^\/+/, "");
  return rest.length > 0 ? rest : null;
}

export async function presignR2PutObject(
  objectKey: string,
  contentType: string,
): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
  const { R2_BUCKET_NAME } = requireR2Config();
  const client = getR2S3Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  return {
    uploadUrl,
    headers: {
      "Content-Type": contentType,
    },
  };
}

/** @deprecated Use presignR2PutObject — kept as alias for avatar uploads. */
export async function presignAvatarPut(
  objectKey: string,
  contentType: AvatarAllowedContentType,
): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
  return presignR2PutObject(objectKey, contentType);
}

export async function headR2Object(objectKey: string) {
  const { R2_BUCKET_NAME } = requireR2Config();
  const client = getR2S3Client();

  return client.send(
    new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    }),
  );
}

export async function deleteR2Object(objectKey: string): Promise<void> {
  const { R2_BUCKET_NAME } = requireR2Config();
  const client = getR2S3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    }),
  );
}

export async function copyR2Object(
  sourceObjectKey: string,
  destinationObjectKey: string,
): Promise<void> {
  const { R2_BUCKET_NAME } = requireR2Config();
  const client = getR2S3Client();

  const encodedSource = `${R2_BUCKET_NAME}/${sourceObjectKey
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  await client.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET_NAME,
      CopySource: encodedSource,
      Key: destinationObjectKey,
    }),
  );
}

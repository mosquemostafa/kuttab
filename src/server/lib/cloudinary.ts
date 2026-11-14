import { v2 as cloudinary } from "cloudinary";

import { env } from "@/server/lib/env";
import {
  buildFilesFolderPath,
  buildImageFolderPath,
  sanitizeFolderPath,
} from "@/server/lib/cloudinary-folder";

const rootFolder = sanitizeFolderPath(
  env.CLOUDINARY_ROOT_FOLDER,
  "CLOUDINARY_ROOT_FOLDER",
);

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function buildImageFolder(subfolder: string): string {
  return buildImageFolderPath(rootFolder, subfolder);
}

export function buildFilesFolder(subfolder: string): string {
  return buildFilesFolderPath(rootFolder, subfolder);
}

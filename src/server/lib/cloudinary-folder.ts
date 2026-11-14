const SAFE_FOLDER_PATH_REGEX = /^[A-Za-z0-9/]+$/;

const DEFAULT_SUBFOLDER = "general";

export function sanitizeFolderPath(value: string, label: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    throw new Error(`${label} cannot be empty`);
  }

  if (!SAFE_FOLDER_PATH_REGEX.test(normalized)) {
    throw new Error(
      `${label} contains invalid characters. Only alphanumeric and '/' are allowed.`,
    );
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => segment.length === 0)) {
    throw new Error(`${label} contains empty path segments`);
  }

  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`${label} cannot contain '.' or '..' segments`);
  }

  return segments.join("/");
}

function withDefaultSubfolder(subfolder: string): string {
  return subfolder.trim().length === 0 ? DEFAULT_SUBFOLDER : subfolder;
}

export function buildImageFolderPath(
  rootFolder: string,
  subfolder: string,
): string {
  const safeRoot = sanitizeFolderPath(rootFolder, "CLOUDINARY_ROOT_FOLDER");
  const safeSubfolder = sanitizeFolderPath(
    withDefaultSubfolder(subfolder),
    "image subfolder",
  );

  return `${safeRoot}/images/${safeSubfolder}`;
}

export function buildFilesFolderPath(
  rootFolder: string,
  subfolder: string,
): string {
  const safeRoot = sanitizeFolderPath(rootFolder, "CLOUDINARY_ROOT_FOLDER");
  const safeSubfolder = sanitizeFolderPath(
    withDefaultSubfolder(subfolder),
    "files subfolder",
  );

  return `${safeRoot}/files/${safeSubfolder}`;
}

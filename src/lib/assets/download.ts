function buildDownloadUrl(secureUrl: string, filename: string): string {
  const sanitizedFilename = filename
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  if (!secureUrl.includes("/upload/")) {
    return secureUrl;
  }

  return secureUrl.replace(
    "/upload/",
    `/upload/fl_attachment:${sanitizedFilename}/`,
  );
}

export function downloadAsset(secureUrl: string, filename: string): void {
  const url = buildDownloadUrl(secureUrl, filename);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

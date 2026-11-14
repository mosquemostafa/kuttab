import { request, requestNoStore, requestWithMeta } from "@/lib/api/api-core";
import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";

type ContentAssetsListQuery = {
  q?: string;
  folder?: string;
  resourceType?: "image" | "video" | "raw";
  format?: string;
  tags?: string[];
  page?: number;
  limit?: number;
};

function buildListQueryString(query?: ContentAssetsListQuery): string {
  const params = new URLSearchParams();

  if (!query) return "";

  if (query.q) params.set("q", query.q);
  if (query.folder) params.set("folder", query.folder);
  if (query.resourceType) params.set("resourceType", query.resourceType);
  if (query.format) params.set("format", query.format);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));

  for (const tag of query.tags ?? []) {
    params.append("tags[]", tag);
  }

  return params.toString();
}

export const contentAssetsApi = {
  list: (query?: ContentAssetsListQuery) => {
    const queryString = buildListQueryString(query);
    return requestWithMeta<AssetResponseDto>(
      `/content/assets${queryString ? `?${queryString}` : ""}`,
    );
  },
  listTags: () => requestNoStore<{ tags: string[] }>("/content/assets/tags"),
  delete: (id: string) =>
    request<{ success: true }>(`/content/assets/${id}`, {
      method: "DELETE",
    }),
  update: (id: string, payload: { filename?: string; tags?: string[] }) =>
    request<AssetResponseDto>(`/content/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

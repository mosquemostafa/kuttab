import type {
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";
import type {
  AssetResponseDto,
  MoveAssetRequestDto,
} from "@/server/modules/assets/asset.dto";

export async function moveAssetToFolder(
  assetId: string,
  body: MoveAssetRequestDto,
): Promise<AssetResponseDto> {
  const response = await fetch(`/api/content/assets/${assetId}/move`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ApiResponse<AssetResponseDto>;

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return (json as ApiSuccess<AssetResponseDto>).data;
}

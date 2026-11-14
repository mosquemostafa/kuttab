import {
  buildCacheKey,
  invalidateByPrefix,
} from "@/server/modules/cache/cache.service";

const APP_SETTINGS_CACHE_PREFIX = "app-settings:v2";

export function appSettingsCacheKey(): string {
  return buildCacheKey(APP_SETTINGS_CACHE_PREFIX, ["default"]);
}

export async function invalidateAppSettingsCache(): Promise<void> {
  await invalidateByPrefix(`${APP_SETTINGS_CACHE_PREFIX}:`);
}
